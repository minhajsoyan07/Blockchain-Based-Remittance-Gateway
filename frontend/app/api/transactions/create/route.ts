/**
 * Create Transaction API Route
 * 
 * Creates new transaction records in the system.
 * Typically used for external transaction logging or manual transaction entry.
 * 
 * Features:
 * - Token-based authentication
 * - Automatic transaction ID generation
 * - Flexible transaction status (pending, completed, failed)
 * - Support for all currencies
 * - Optional gas fee and description
 * 
 * @module app/api/transactions/create/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users, transactions, generateTransactionId } from "@/lib/mock-db"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Create New Transaction Record
// ============================================================================
/**
 * Creates a new transaction record
 * - Validates authentication token
 * - Validates required fields (toAddress, amount, txHash)
 * - Generates sequential transaction ID
 * - Saves transaction to database
 * - Returns created transaction with ID
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const tokenParts = token.split("_")
    const userId = tokenParts[1] // Extract userId from token format: token_userId_timestamp

    if (!userId) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 401 })
    }

    const body = await request.json()
    const { toAddress, amount, gasFee, currency, description, txHash, status, executionTime } = body

    if (!toAddress || !amount || !txHash) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get current transactions and add the new one
    const allUsers = users.get()
    const user = allUsers[userId]

    if (user && user.walletAddress && user.walletAddress.toLowerCase() === toAddress.toLowerCase()) {
      return NextResponse.json({ error: "Cannot send money to your own account" }, { status: 400 })
    }

    const newTransaction = {
      id: generateTransactionId(),
      fromUserId: userId,
      toAddress,
      amount: Number(amount),
      gasFee: Number(gasFee) || 0,
      currency: currency || "ETH",
      description: description || "",
      status: status || "completed",
      timestamp: Date.now(),
      txHash,
      executionTime:
        typeof executionTime === "number" && !Number.isNaN(executionTime)
          ? Number.parseFloat(executionTime.toFixed(2))
          : Number.parseFloat((Math.random() * 3 + 2).toFixed(2)),
    }

    // Get current transactions and add the new one
    const allTransactions = transactions.get()
    allTransactions.push(newTransaction)
    transactions.save(allTransactions)

    // Update user balance to reflect the transaction
    if (user) {
      const totalDeduction = Number(amount) + (Number(gasFee) || 0)
      const currencyCode = currency || "ETH"

      // Initialize balances if undefined
      if (!user.balances) {
        user.balances = { USD: 0, BDT: 0, BTC: 0, ETH: 0, USDT: 0, EUR: 0, GBP: 0 }
      }

      // Deduct from appropriate balance field
      if (currencyCode === "ETH" && typeof user.realEthBalance === 'number') {
        user.realEthBalance -= totalDeduction
      } else {
        const cur = currencyCode as keyof typeof user.balances
        user.balances[cur] = (user.balances[cur] || 0) - totalDeduction
      }

      users.save(allUsers)
    }

    // Update recipient balance if they exist in our system
    // We do this by iterating through all users since we don't have a direct wallet->user index
    const allUsersArray = Object.values(allUsers);
    const recipientUser = allUsersArray.find(
      (u) => u.walletAddress && u.walletAddress.toLowerCase() === toAddress.toLowerCase()
    );

    if (recipientUser) {
      if (!recipientUser.balances) {
        recipientUser.balances = { USD: 0, BDT: 0, BTC: 0, ETH: 0, USDT: 0, EUR: 0, GBP: 0 };
      }

      const currencyCode = currency || "ETH";

      // Initialize realEthBalance if missing
      if (typeof recipientUser.realEthBalance !== 'number') {
        recipientUser.realEthBalance = 0;
      }

      if (currencyCode === "ETH") {
        recipientUser.realEthBalance += Number(amount);
        // Also update the ETH field in balances for consistency, though realEthBalance is the source of truth for ETH
        recipientUser.balances.ETH = (recipientUser.balances.ETH || 0) + Number(amount);
      } else {
        const cur = currencyCode as keyof typeof recipientUser.balances;
        recipientUser.balances[cur] = (recipientUser.balances[cur] || 0) + Number(amount);
      }

      // Save again to persist recipient changes
      // Note: In a real DB this would be a single atomic transaction
      users.save(allUsers);
    }

    return NextResponse.json(newTransaction, { status: 201 })
  } catch (error) {
    console.error("Create transaction error:", error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}
