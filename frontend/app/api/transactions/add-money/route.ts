/**
 * Add Money API Route
 * 
 * Handles deposit transactions to user accounts.
 * Supports all 7 currencies: USD, EUR, GBP, BDT, BTC, ETH, USDT
 * 
 * Features:
 * - Token-based authentication
 * - Balance validation
 * - Multi-currency support
 * - Automatic balance initialization
 * 
 * @module app/api/transactions/add-money/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"
import { parseUserIdFromToken } from "@/lib/auth-utils"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Add Money to User Account
// ============================================================================
/**
 * Processes money deposit requests
 * - Validates authentication token
 * - Validates amount (must be > 0)
 * - Updates user balance for specified currency
 * - Returns updated balance and success message
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================================================
    // Request Parsing: Extract request body and authentication
    // ============================================================================
    const { amount, currency, paymentMethod } = await request.json()
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    // ============================================================================
    // Authentication Check: Verify user is authenticated
    // ============================================================================
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const allUsers = users.get()
    const userId = parseUserIdFromToken(token)

    if (!userId || !allUsers[userId]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = allUsers[userId]

    // ============================================================================
    // Input Validation: Ensure amount is strictly positive
    // ============================================================================
    const amountNum = Number.parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Invalid amount. Must be greater than 0." }, { status: 400 })
    }

    // ============================================================================
    // Balance Initialization: Ensure balances object exists
    // ============================================================================
    if (!user.balances) {
      user.balances = { USD: 0, BDT: 0, BTC: 0, ETH: 0, USDT: 0, EUR: 0, GBP: 0 }
    }

    // ============================================================================
    // Balance Update: Add amount to specified currency balance
    // ============================================================================
    user.balances[currency as keyof typeof user.balances] =
      (user.balances[currency as keyof typeof user.balances] || 0) + Number.parseFloat(amount)

    // ============================================================================
    // Persist Changes: Save updated user data
    // ============================================================================
    users.save(allUsers)

    // ============================================================================
    // Transaction Recording: Save transaction history
    // ============================================================================
    try {
      const { transactions, generateTransactionId } = await import("@/lib/db/transactions")
      const allTransactions = transactions.get()

      const newTransaction = {
        id: generateTransactionId(),
        fromUserId: userId,
        toAddress: "System",
        amount: Number.parseFloat(amount),
        gasFee: 0,
        currency: currency,
        description: `Deposit via ${paymentMethod}`,
        status: "completed",
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substring(2)}`,
        executionTime: Math.random() * 2,
        metadata: {
          method: paymentMethod
        }
      }

      // @ts-ignore
      allTransactions.push(newTransaction)
      transactions.save(allTransactions)
    } catch (txError) {
      console.error("Failed to record transaction:", txError)
    }

    // ============================================================================
    // Success Response: Return updated balance
    // ============================================================================
    return NextResponse.json({
      success: true,
      balance: user.balances[currency as keyof typeof user.balances],
      message: `Successfully added ${amount} ${currency}`,
    })
  } catch (error) {
    // ============================================================================
    // Error Handling: Log and return error response
    // ============================================================================
    console.error("Add money error:", error)
    return NextResponse.json({
      error: "Failed to add money",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
