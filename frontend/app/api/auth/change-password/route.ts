/**
 * Change Password API Route
 * 
 * Handles user password changes with security validation.
 * 
 * Features:
 * - Token-based authentication
 * - Current password verification
 * - New password strength validation (minimum 8 characters)
 * - Prevents reusing current password
 * - Password hashing before storage
 * - Supports migration from plain-text to hashed passwords
 * 
 * @module app/api/auth/change-password/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"
import { hashPassword, verifyPassword } from "@/lib/password-utils"
import { parseUserIdFromToken } from "@/lib/auth-utils"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Change User Password
// ============================================================================
/**
 * Processes password change requests
 * - Validates authentication token
 * - Verifies current password
 * - Validates new password strength
 * - Checks that new password differs from current
 * - Hashes and saves new password
 */
export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 })
    }

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = parseUserIdFromToken(token)

    if (!userId) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 401 })
    }

    const allUsers = users.get()
    const user = allUsers[userId]

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isValidPassword = user.password.includes(":")
      ? verifyPassword(currentPassword, user.password)
      : user.password === currentPassword

    if (!isValidPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Check if new password is same as current password
    const isSamePassword = user.password.includes(":")
      ? verifyPassword(newPassword, user.password)
      : user.password === newPassword

    if (isSamePassword) {
      return NextResponse.json({ error: "New password must be different from current password" }, { status: 400 })
    }

    // Update password
    allUsers[userId] = {
      ...user,
      password: hashPassword(newPassword),
    }

    users.save(allUsers)


    return NextResponse.json({ message: "Password changed successfully" }, { status: 200 })
  } catch (error) {
    console.error("[Change Password] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



