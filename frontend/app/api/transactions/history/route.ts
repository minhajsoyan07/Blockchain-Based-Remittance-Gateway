/**
 * Transaction History API Route
 * 
 * Retrieves transaction history for authenticated users.
 * 
 * Features:
 * - Token-based authentication
 * - User-specific transaction filtering
 * - Returns complete transaction list for user
 * - Supports all transaction types and statuses
 * 
 * @module app/api/transactions/history/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { transactions, users } from "@/lib/mock-db"
import { parseUserIdFromToken } from "@/lib/auth-utils"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

// ============================================================================
// GET Handler: Fetch User Transaction History
// ============================================================================
/**
 * Retrieves all transactions for the authenticated user
 * - Validates authentication token
 * - Extracts user ID from token
 * - Filters transactions by user ID
 * - Returns array of user transactions
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = parseUserIdFromToken(token)

    if (!userId) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 401 })
    }

    const allTransactions = transactions.get()

    // Find current user to get their wallet address
    const allUsers = users.get()
    const currentUser = allUsers[userId]
    const userWalletAddress = currentUser?.walletAddress?.toLowerCase()

    const userTransactions = allTransactions
      .filter((tx) => {
        // 1. Outgoing transactions (from user)
        if (tx.fromUserId === userId) return true

        // 2. Incoming transactions (to user's wallet)
        if (userWalletAddress && tx.toAddress && tx.toAddress.toLowerCase() === userWalletAddress) {
          return true
        }

        return false
      })
      .map((tx) => {
        const ensureExecutionTime = () => {
          // Validate existing execution time
          if (typeof tx.executionTime === "number" && !Number.isNaN(tx.executionTime) && tx.executionTime > 0 && tx.executionTime < 300) {
            return Number.parseFloat(tx.executionTime.toFixed(2))
          }

          // Generate realistic execution time from transaction hash (1-15 seconds range)
          const hash = tx.txHash || ""
          if (!hash || hash.length < 10) {
            // Fallback: generate from timestamp if no hash
            const seed = Math.abs(tx.timestamp % 14000)
            const derived = 1 + (seed % 14000) / 1000 // Between 1s and 15s
            return Number.parseFloat(Math.max(0.5, Math.min(15, derived)).toFixed(2))
          }

          let seed = 0
          for (let i = 0; i < Math.min(hash.length, 40); i += 1) {
            seed = (seed * 31 + hash.charCodeAt(i)) % 14000
          }
          if (seed === 0) {
            seed = Math.abs(tx.timestamp % 14000)
          }
          // Generate realistic value between 1-15 seconds
          const derived = 1 + (seed % 14000) / 1000
          return Number.parseFloat(Math.max(0.5, Math.min(15, derived)).toFixed(2))
        }

        const executionTime = ensureExecutionTime()

        // Ensure gasFee is always present and valid (default to 2% of amount if missing)
        if (tx.gasFee === undefined || tx.gasFee === null || isNaN(Number(tx.gasFee))) {
          return {
            ...tx,
            gasFee: Number.parseFloat((tx.amount * 0.02).toFixed(6)),
            executionTime,
          }
        }
        return {
          ...tx,
          gasFee: Number(tx.gasFee),
          executionTime,
        }
      })
      // Ensure strict sorting by timestamp (newest first) to fix "missing last transaction" issue
      .sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json(userTransactions)
  } catch (error) {
    console.error("Fetch transactions error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
