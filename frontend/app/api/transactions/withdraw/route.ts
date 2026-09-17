/**
 * Withdraw Money API Route
 * 
 * Handles withdrawal transactions from user accounts.
 * Supports all 7 currencies: USD, EUR, GBP, BDT, BTC, ETH, USDT
 * 
 * Features:
 * - Token-based authentication
 * - Balance validation (checks sufficient funds)
 * - Account details validation
 * - Multi-currency support
 * 
 * @module app/api/transactions/withdraw/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"
import { parseUserIdFromToken } from "@/lib/auth-utils"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Process Withdrawal Request
// ============================================================================
/**
 * Processes withdrawal requests
 * - Validates authentication token
 * - Validates amount and account details
 * - Checks sufficient balance
 * - Deducts amount from user balance
 * - Returns updated balance and success message
 * 
 * Note: `accountDetails` is a formatted string containing all necessary info 
 * (e.g., "Bank: Name, Account: 123..." or "Wallet: 0x...")
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================================================
    // Request Parsing: Extract request body and authentication
    // ============================================================================
    const { amount, currency, withdrawMethod, accountDetails } = await request.json()
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
    // Input Validation: Validate amount and account details
    // ============================================================================
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    if (!accountDetails) {
      return NextResponse.json({ error: "Account details required" }, { status: 400 })
    }

    // ============================================================================
    // Balance Initialization: Ensure balances object exists
    // ============================================================================
    if (!user.balances) {
      user.balances = { USD: 0, BDT: 0, BTC: 0, ETH: 0, USDT: 0, EUR: 0, GBP: 0 }
    }

    // ============================================================================
    // Balance Check: Verify sufficient funds before withdrawal
    // ============================================================================
    if (user.balances[currency as keyof typeof user.balances] < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // ============================================================================
    // Balance Deduction: Subtract amount from specified currency balance
    // ============================================================================
    user.balances[currency as keyof typeof user.balances] -= Number.parseFloat(amount)

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
        toAddress: withdrawMethod === 'crypto' ? accountDetails.split('Wallet: ')[1] : 'System', // Simplified for now
        amount: Number.parseFloat(amount),
        gasFee: 0, // Could calculate this later
        currency: currency,
        description: `Withdraw via ${withdrawMethod}`,
        status: "completed",
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substring(2)}`, // Mock hash
        executionTime: Math.random() * 2,
        metadata: {
          method: withdrawMethod,
          details: accountDetails
        }
      }

      // @ts-ignore - Ignoring type mismatch for now as we might need to update Transaction type
      allTransactions.push(newTransaction)
      transactions.save(allTransactions)
    } catch (txError) {
      console.error("Failed to record transaction:", txError)
      // Don't fail the request if just history recording fails, but log it
    }

    // ============================================================================
    // Success Response: Return updated balance
    // ============================================================================
    return NextResponse.json({
      success: true,
      balance: user.balances[currency as keyof typeof user.balances],
      message: `Successfully withdrawn ${amount} ${currency}`,
    })
  } catch (error) {
    // ============================================================================
    // Error Handling: Log and return error response
    // ============================================================================
    console.error("Withdraw error:", error)
    return NextResponse.json({
      error: "Failed to process withdrawal",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
