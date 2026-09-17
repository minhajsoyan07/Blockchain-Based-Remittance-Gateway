import { randomBytes } from "crypto"

interface OTPData {
  code: string
  expiresAt: number
  attempts: number
  verified: boolean
}

// In-memory OTP store (in production, use Redis or database)
const otpStore = new Map<string, OTPData>()

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  const bytes = randomBytes(3)
  const code = (parseInt(bytes.toString("hex"), 16) % 1000000)
    .toString()
    .padStart(6, "0")
  return code
}

/**
 * Store OTP for email or phone with expiration
 */
export function storeOTP(identifier: string, type: "email" | "phone"): string {
  const code = generateOTP()
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes
  const key = `${type}:${identifier.toLowerCase()}`

  otpStore.set(key, {
    code,
    expiresAt,
    attempts: 0,
    verified: false,
  })

  // Clean up expired OTPs
  setTimeout(() => {
    otpStore.delete(key)
  }, 10 * 60 * 1000)

  return code
}

/**
 * Verify OTP code
 */
export function verifyOTP(identifier: string, type: "email" | "phone", code: string): boolean {
  const key = `${type}:${identifier.toLowerCase()}`
  const otpData = otpStore.get(key)

  if (!otpData) {
    return false
  }

  // Check if expired
  if (Date.now() > otpData.expiresAt) {
    otpStore.delete(key)
    return false
  }

  // Check attempt limit (max 5 attempts)
  if (otpData.attempts >= 5) {
    otpStore.delete(key)
    return false
  }

  otpData.attempts++

  if (otpData.code === code) {
    otpData.verified = true
    return true
  }

  return false
}

/**
 * Check if OTP is verified
 */
export function isOTPVerified(identifier: string, type: "email" | "phone"): boolean {
  const key = `${type}:${identifier.toLowerCase()}`
  const otpData = otpStore.get(key)
  return otpData?.verified === true
}

/**
 * Remove OTP after successful use
 */
export function removeOTP(identifier: string, type: "email" | "phone"): void {
  const key = `${type}:${identifier.toLowerCase()}`
  otpStore.delete(key)
}

/**
 * Send OTP via email (mock implementation - integrate with email service in production)
 */
export async function sendOTPEmail(email: string, code: string): Promise<boolean> {
  // In production, use services like:
  // - SendGrid
  // - AWS SES
  // - Resend
  // - Nodemailer with SMTP


  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In production, return the result of actual email service
  return true
}

/**
 * Send OTP via SMS (mock implementation - integrate with SMS service in production)
 */
export async function sendOTPSMS(phone: string, code: string): Promise<boolean> {
  // In production, use services like:
  // - Twilio
  // - AWS SNS
  // - Vonage (Nexmo)
  // - MessageBird


  // Simulate SMS sending delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In production, return the result of actual SMS service
  return true
}




