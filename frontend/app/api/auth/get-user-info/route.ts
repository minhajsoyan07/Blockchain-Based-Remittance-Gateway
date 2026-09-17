/**
 * Get User Info API Route
 * 
 * Retrieves basic user information by user ID.
 * 
 * @module app/api/auth/get-user-info/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ============================================================================
// GET Handler: Retrieve User Information
// ============================================================================
/**
 * Processes GET requests for user info
 * - Validates authentication token
 * - Retrieves user by ID
 * - Returns basic user data
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const allUsers = users.get()
    const user = allUsers[userId]

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    })
  } catch (error) {
    console.error("Get user info error:", error)
    return NextResponse.json({ error: "Failed to fetch user info" }, { status: 500 })
  }
}
