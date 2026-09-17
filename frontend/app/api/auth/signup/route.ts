/**
 * Signup API Route
 * 
 * Handles new user registration and account creation.
 * 
 * Features:
 * - Field validation (fullName, email, phone, password)
 * - Password strength check (minimum 8 characters)
 * - Email and phone uniqueness validation
 * - Sequential user ID generation (RPAY001, RPAY002, ...)
 * - Password hashing (SHA-256 with salt)
 * - Automatic balance initialization for all currencies
 * - Sample transaction seeding for new users
 * - Token generation for immediate session
 * 
 * @module app/api/auth/signup/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users, transactions, getNextSequentialUserId } from "@/lib/mock-db"
import { hashPassword } from "@/lib/password-utils"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Register New User and Create Account
// ============================================================================
/**
 * Processes signup requests
 * - Validates all required fields
 * - Checks password length (minimum 8 characters)
 * - Validates email and phone uniqueness
 * - Generates sequential user ID
 * - Hashes password before storage
 * - Initializes balances for all currencies
 * - Seeds sample transactions for user
 * - Generates session token
 * - Returns user data and token
 */
export async function POST(request: NextRequest) {
  try {
    const { fullName, email, phone, password, dateOfBirth } = await request.json()

    // Normalize input early for consistent validation and storage
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""
    const normalizedPhone = typeof phone === "string" ? phone.replace(/[^\d+]/g, "") : ""
    const normalizedFullName = typeof fullName === "string" ? fullName.trim() : ""
    // Username is auto-generated, so we don't need to normalize input
    const normalizedPassword = typeof password === "string" ? password : ""
    const normalizedDateOfBirth = typeof dateOfBirth === "string" ? dateOfBirth.trim() : ""

    if (!normalizedFullName || !normalizedEmail || !normalizedPhone || !normalizedPassword || !normalizedDateOfBirth) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const allUsers = users.get()

    // Compare using normalized values to avoid false duplicates (case/format differences)
    const existingUser = Object.values(allUsers).find((u) => {
      if (!u || !u.email) return false
      const uEmail = typeof u.email === "string" ? u.email.trim().toLowerCase() : ""
      const uPhone = typeof u.phone === "string" ? u.phone.replace(/[^\d+]/g, "") : ""
      return uEmail === normalizedEmail || uPhone === normalizedPhone
    })

    if (existingUser) {
      // Check which field matched to provide specific error message
      const existingEmail = typeof existingUser.email === "string" ? existingUser.email.trim().toLowerCase() : ""
      const existingPhone = typeof existingUser.phone === "string" ? existingUser.phone.replace(/[^\d+]/g, "") : ""

      if (existingEmail === normalizedEmail) {
        return NextResponse.json({ error: "This email is already registered. Please use a different email or login." }, { status: 409 })
      }
      if (existingPhone === normalizedPhone) {
        return NextResponse.json({ error: "This phone number is already registered. Please use a different number." }, { status: 409 })
      }
      // Fallback error
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Auto-generate username from email
    let baseUsername = normalizedEmail.split("@")[0].replace(/[^a-z0-9]/gi, "")
    let generatedUsername = baseUsername
    let counter = 1

    // Ensure uniqueness
    while (Object.values(allUsers).some((u) => u.username === generatedUsername)) {
      generatedUsername = `${baseUsername}${counter}`
      counter++
    }

    const userId = getNextSequentialUserId(allUsers)
    allUsers[userId] = {
      id: userId,
      email: normalizedEmail,
      fullName: normalizedFullName,
      username: generatedUsername,
      phone: normalizedPhone,
      password: hashPassword(normalizedPassword), // Hash password before storing
      dateOfBirth: normalizedDateOfBirth,
      balances: {
        USD: 0,
        BDT: 0,
        BTC: 0,
        ETH: 0,
        USDT: 0,
        EUR: 0,
        GBP: 0,
      },
      wallets: [],
    }

    users.save(allUsers)

    // Remove sample transaction seeding - users start with zero transactions

    const token = `token_${userId}_${Date.now()}`

    return NextResponse.json({
      token,
      user: {
        id: userId,
        email,
        fullName,
        username: generatedUsername,
        balances: allUsers[userId].balances,
        realEthBalance: 0,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
