/**
 * Update Profile API Route
 * 
 * Handles user profile information updates.
 * 
 * Features:
 * - Token-based authentication
 * - Partial profile updates (only provided fields are updated)
 * - Supports: fullName, nid, phone, address, dateOfBirth, profilePhoto, walletAddress
 * - Returns complete updated user data
 * 
 * @module app/api/auth/update-profile/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"
import { parseUserIdFromToken } from "@/lib/auth-utils"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Update User Profile Information
// ============================================================================
/**
 * Updates user profile fields
 * - Validates authentication token
 * - Updates only provided fields (partial update)
 * - Persists changes to database
 * - Returns complete updated user object
 */
export async function POST(request: NextRequest) {
  try {
    const updates = await request.json()
    console.log("Received profile update request:", JSON.stringify(updates, null, 2))
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const allUsers = users.get()
    const userId = parseUserIdFromToken(token)

    if (!userId) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 401 })
    }

    const user = allUsers[userId]

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    if (updates.fullName !== undefined) user.fullName = updates.fullName
    if (updates.email !== undefined) user.email = updates.email
    if (updates.nid !== undefined) user.nid = updates.nid
    if (updates.phone !== undefined) user.phone = updates.phone
    if (updates.address !== undefined) user.address = updates.address
    if (updates.dateOfBirth !== undefined) user.dateOfBirth = updates.dateOfBirth
    if (updates.profilePhoto !== undefined) user.profilePhoto = updates.profilePhoto
    if (updates.bio !== undefined) (user as any).bio = updates.bio
    if (updates.location !== undefined) (user as any).location = updates.location
    if (updates.occupation !== undefined) (user as any).occupation = updates.occupation
    if (updates.website !== undefined) (user as any).website = updates.website
    if (updates.gender !== undefined) (user as any).gender = updates.gender
    if (updates.nationality !== undefined) (user as any).nationality = updates.nationality
    if (updates.religion !== undefined) (user as any).religion = updates.religion

    // ============================================================================
    // Wallet Address Update: Explicitly handle removal
    // ============================================================================
    if (updates.walletAddress !== undefined) {
      // If null, empty string, or undefined is provided, explicitly remove wallet address
      if (updates.walletAddress === null || updates.walletAddress === "" || updates.walletAddress === undefined) {
        // Explicitly delete the property to ensure it's removed
        if (user.walletAddress !== undefined) {
          delete user.walletAddress
        }
        // Also reset realEthBalance when wallet is removed
        if (user.realEthBalance !== undefined) {
          user.realEthBalance = 0
        }
      } else {
        // Validate and set new wallet address
        const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/
        const trimmedAddress = String(updates.walletAddress).trim()
        if (ethereumAddressRegex.test(trimmedAddress)) {
          user.walletAddress = trimmedAddress.toLowerCase()
        } else {
          return NextResponse.json(
            { error: "Invalid wallet address format" },
            { status: 400 }
          )
        }
      }
    }

    console.log("Saving updated user profile:", user.id)
    users.save(allUsers)

    // ============================================================================
    // Success Response with Security Headers
    // ============================================================================
    // Build response data - explicitly exclude walletAddress if it was removed
    const responseData: any = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      nid: user.nid,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      profilePhoto: user.profilePhoto,
      bio: (user as any).bio || "",
      location: (user as any).location || "",
      occupation: (user as any).occupation || "",
      website: (user as any).website || "",
      balances: user.balances,
      realEthBalance: user.realEthBalance || 0,
      hasWalletSecurityPassword: !!user.walletSecurityPassword,
      wallets: user.wallets || [],
      gender: (user as any).gender || "",
      nationality: (user as any).nationality || "",
      religion: (user as any).religion || "",
    }

    // Only include walletAddress if it exists and is not empty
    if (user.walletAddress && user.walletAddress.trim() !== "") {
      responseData.walletAddress = user.walletAddress
    }

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
