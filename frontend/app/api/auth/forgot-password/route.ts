/**
 * Forgot Password API Route
 * 
 * Handles password recovery initiation via OTP.
 * 
 * @module app/api/auth/forgot-password/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"
import { storeOTP, sendOTPEmail, sendOTPSMS } from "@/lib/otp-utils"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Initiate Password Recovery
// ============================================================================
/**
 * Processes forgot password requests
 * - Validates identifier and type
 * - Generates and stores OTP
 * - Sends OTP via email or SMS
 * - Returns OTP code (for development)
 */
export async function POST(request: NextRequest) {
  try {
    const { identifier, type } = await request.json()

    if (!identifier || !type) {
      return NextResponse.json({ error: "Identifier and type are required" }, { status: 400 })
    }

    if (type !== "email" && type !== "phone") {
      return NextResponse.json({ error: "Invalid recovery type" }, { status: 400 })
    }

    const allUsers = users.get()
    let user = null

    if (type === "email") {
      user = Object.values(allUsers).find((u) => u.email?.toLowerCase() === identifier.toLowerCase())
    } else {
      // Normalize phone number for comparison (remove spaces, dashes, etc.)
      const normalizedIdentifier = identifier.replace(/\D/g, "")
      user = Object.values(allUsers).find((u) => {
        if (!u.phone) return false
        const normalizedPhone = u.phone.replace(/\D/g, "")
        return normalizedPhone === normalizedIdentifier
      })
    }

    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json({
        message: "If an account exists with this identifier, an OTP has been sent.",
      })
    }

    // Generate and store OTP
    const otpCode = storeOTP(identifier, type)

    // Send OTP via email or SMS
    let sent = false
    if (type === "email") {
      sent = await sendOTPEmail(identifier, otpCode)
    } else {
      sent = await sendOTPSMS(identifier, otpCode)
    }

    if (!sent) {
      return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 })
    }


    // For development/testing: always return OTP code in response
    // In production, remove otpCode from response for security
    return NextResponse.json({
      message: `OTP has been sent to your ${type === "email" ? "email" : "phone"}`,
      otpCode: otpCode, // Always return for now to make it workable
    })
  } catch (error) {
    console.error("[OTP] Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
