/**
 * Login API Route
 * 
 * Handles user authentication and login.
 * 
 * Features:
 * - Email and password validation
 * - Password verification (supports both hashed and plain-text for migration)
 * - Automatic password upgrade to hashed format
 * - Token generation for session management
 * - Returns complete user data on successful login
 * 
 * @module app/api/auth/login/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"
import { verifyPassword, hashPassword } from "@/lib/password-utils"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Authenticate User and Generate Session Token
// ============================================================================
/**
 * Processes login requests
 * - Validates email and password
 * - Finds user by email
 * - Verifies password (supports migration from plain-text to hashed)
 * - Upgrades plain-text passwords to hashed format
 * - Generates session token
 * - Returns user data and token
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""
    const normalizedPassword = typeof password === "string" ? password : ""

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const allUsers = users.get()
    const user = Object.values(allUsers).find((u) => {
      const uEmail = typeof u.email === "string" ? u.email.trim().toLowerCase() : ""
      const uUsername = typeof u.username === "string" ? u.username.trim().toLowerCase() : ""
      return uEmail === normalizedEmail || uUsername === normalizedEmail
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValidPassword = user.password.includes(":")
      ? verifyPassword(normalizedPassword, user.password)
      : user.password === normalizedPassword

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!user.password.includes(":")) {
      allUsers[user.id] = { ...user, password: hashPassword(password) }
      users.save(allUsers)
    }

    const token = `token_${user.id}_${Date.now()}`

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        walletAddress: user.walletAddress,
        nid: user.nid,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        profilePhoto: user.profilePhoto,
        balances: user.balances,
        realEthBalance: user.realEthBalance || 0,
        wallets: user.wallets,
        hasWalletSecurityPassword: !!user.walletSecurityPassword,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
