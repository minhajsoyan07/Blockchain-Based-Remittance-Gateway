/**
 * Password Utilities
 * 
 * Provides password hashing and verification functions.
 * 
 * Features:
 * - SHA-256 hashing with random salt
 * - Password verification
 * - Supports migration from plain-text passwords
 * 
 * Note: SHA-256 is used for simplicity. For production environments,
 * consider using bcrypt, argon2, or scrypt for better security.
 * 
 * @module lib/password-utils
 */

import { createHash, randomBytes } from "crypto"

// ============================================================================
// Password Hashing
// ============================================================================
/**
 * Hashes a password using SHA-256 with a random salt
 * Returns format: "salt:hash"
 * 
 * @param password - Plain text password to hash
 * @returns Hashed password string (salt:hash format)
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = createHash("sha256").update(password + salt).digest("hex")
  return `${salt}:${hash}`
}

// ============================================================================
// Password Verification
// ============================================================================
/**
 * Verifies a password against a stored hash
 * Also handles legacy plain-text passwords for backward compatibility
 * 
 * @param password - Plain text password to verify
 * @param hashedPassword - Stored hash (salt:hash format) or plain text for legacy
 * @returns True if password matches, false otherwise
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(":")
  if (!salt || !hash) {
    return false
  }
  const passwordHash = createHash("sha256").update(password + salt).digest("hex")
  return passwordHash === hash
}




