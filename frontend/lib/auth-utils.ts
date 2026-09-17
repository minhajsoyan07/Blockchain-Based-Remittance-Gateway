/**
 * Authentication Utilities
 * 
 * Provides client-side authentication token management functions.
 * 
 * Features:
 * - Token parsing (extracts user ID from token)
 * - Token storage/retrieval from localStorage
 * - Authentication status checking
 * 
 * @module lib/auth-utils
 */

// ============================================================================
// Token Parsing
// ============================================================================
/**
 * Extracts user ID from authentication token
 * Token format: "token_<userId>_<timestamp>"
 * 
 * @param token - Authentication token string
 * @returns User ID or null if token is invalid
 */
export function parseUserIdFromToken(token: string): string | null {
  // Expected format: token_<userId>_<timestamp>
  if (!token || !token.startsWith("token_")) return null
  const withoutPrefix = token.slice("token_".length)
  const lastUnderscore = withoutPrefix.lastIndexOf("_")
  if (lastUnderscore === -1) return null
  const userId = withoutPrefix.slice(0, lastUnderscore)
  return userId || null
}

// ============================================================================
// Token Storage Management
// ============================================================================
/**
 * Stores authentication token in localStorage
 * Safe for SSR (checks for window object)
 */
export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token)
  }
}

/**
 * Retrieves authentication token from localStorage
 * Returns null if not available or in SSR context
 */
export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

/**
 * Removes authentication token from localStorage
 * Safe for SSR (checks for window object)
 */
export const removeAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
  }
}

export const isAuthenticated = () => {
  return !!getAuthToken()
}

// ============================================================================
// Password Validation
// ============================================================================
/**
 * Checks the strength of a password
 * Criteria: 8+ chars, mix of upper/lowercase, numbers, special chars
 * 
 * @param password - Password to check
 * @returns "weak" | "medium" | "strong"
 */
export const checkPasswordStrength = (password: string): "weak" | "medium" | "strong" => {
  if (!password || password.length < 8) return "weak"
  let criteriaCount = 0
  if (password.length >= 8) criteriaCount++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) criteriaCount++
  if (/\d/.test(password)) criteriaCount++
  if (/[^a-zA-Z0-9]/.test(password)) criteriaCount++

  if (criteriaCount >= 4) return "strong" // Increased strictness for strong
  if (criteriaCount >= 3) return "medium"
  return "weak"
}
