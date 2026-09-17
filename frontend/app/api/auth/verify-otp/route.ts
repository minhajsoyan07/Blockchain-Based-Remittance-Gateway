/**
 * Verify OTP API Route
 * 
 * Verifies OTP codes for password recovery.
 * 
 * @module app/api/auth/verify-otp/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP, isOTPVerified } from "@/lib/otp-utils"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Verify OTP Code
// ============================================================================
/**
 * Processes OTP verification requests
 * - Validates OTP format (6 digits)
 * - Verifies OTP code
 * - Marks OTP as verified
 */
export async function POST(request: NextRequest) {
  try {
    const { identifier, type, code } = await request.json()

    if (!identifier || !type || !code) {
      return NextResponse.json({ error: "Identifier, type, and code are required" }, { status: 400 })
    }

    if (type !== "email" && type !== "phone") {
      return NextResponse.json({ error: "Invalid recovery type" }, { status: 400 })
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Invalid OTP format" }, { status: 400 })
    }

    // Verify OTP
    const isValid = verifyOTP(identifier, type, code)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 401 })
    }

    // Check if OTP is verified
    if (!isOTPVerified(identifier, type)) {
      return NextResponse.json({ error: "OTP verification failed" }, { status: 401 })
    }


    return NextResponse.json({
      message: "OTP verified successfully",
      verified: true,
    })
  } catch (error) {
    console.error("[OTP] Verify OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}




