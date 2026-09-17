/**
 * Reset Password API Route
 * 
 * Handles password reset after OTP verification.
 * 
 * @module app/api/auth/reset-password/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"
import { hashPassword } from "@/lib/password-utils"
import { isOTPVerified, removeOTP } from "@/lib/otp-utils"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Reset Password After OTP Verification
// ============================================================================
/**
 * Processes password reset requests
 * - Validates OTP verification status
 * - Updates user password
 * - Removes OTP after successful reset
 */
export async function POST(request: NextRequest) {
  try {
    const { identifier, type, newPassword } = await request.json()

    if (!identifier || !type || !newPassword) {
      return NextResponse.json({ error: "Identifier, type, and new password are required" }, { status: 400 })
    }

    if (type !== "email" && type !== "phone") {
      return NextResponse.json({ error: "Invalid recovery type" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Check if OTP is verified
    if (!isOTPVerified(identifier, type)) {
      return NextResponse.json({ error: "OTP not verified. Please verify OTP first." }, { status: 401 })
    }

    const allUsers = users.get()
    let user = null

    if (type === "email") {
      user = Object.values(allUsers).find((u) => u.email?.toLowerCase() === identifier.toLowerCase())
    } else {
      // Normalize phone number for comparison
      const normalizedIdentifier = identifier.replace(/\D/g, "")
      user = Object.values(allUsers).find((u) => {
        if (!u.phone) return false
        const normalizedPhone = u.phone.replace(/\D/g, "")
        return normalizedPhone === normalizedIdentifier
      })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update password
    allUsers[user.id] = {
      ...user,
      password: hashPassword(newPassword),
    }

    users.save(allUsers)

    // Remove OTP after successful password reset
    removeOTP(identifier, type)


    return NextResponse.json({
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("[OTP] Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}




