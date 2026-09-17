import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"
import { parseUserIdFromToken } from "@/lib/auth-utils"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    try {
      const allUsers = users.get()
      const userId = parseUserIdFromToken(token)

      if (!userId) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      const user = allUsers[userId]

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 })
      }

      // Lightweight verification check — no need to scan all transactions
      const isVerified = !!user.isVerified || !!(user.walletAddress)

      // Build response - only include walletAddress if it exists and is not empty
      const responseData: Record<string, any> = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        nid: user.nid,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        profilePhoto: user.profilePhoto,
        balances: user.balances || {},
        realEthBalance: user.realEthBalance || 0,
        wallets: user.wallets,
        hasWalletSecurityPassword: !!user.walletSecurityPassword,
        isVerified: isVerified,
      }

      // Only include walletAddress if it exists and is a valid non-empty string
      if (user.walletAddress && typeof user.walletAddress === "string" && user.walletAddress.trim() !== "") {
        responseData.walletAddress = user.walletAddress
      }

      return NextResponse.json(responseData, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "X-Content-Type-Options": "nosniff",
        },
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
