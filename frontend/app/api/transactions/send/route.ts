/**
 * Send Money API Route
 * 
 * Handles money transfer transactions between users.
 * Supports ETH transfers with MetaMask integration.
 * 
 * Features:
 * - Token-based authentication
 * - Wallet address validation (Ethereum format)
 * - Gas fee calculation (2% of amount)
 * - Balance validation (checks real ETH balance)
 * - Automatic transaction ID generation
 * 
 * @module app/api/transactions/send/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users, transactions, generateTransactionId } from "@/lib/mock-db"
import { performance } from "perf_hooks"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Process Send Money Transaction
// ============================================================================
/**
 * Processes money transfer requests
 * - Validates authentication and user
 * - Validates recipient wallet address
 * - Calculates gas fee (2% of amount)
 * - Checks sufficient ETH balance
 * - Creates transaction record
 * - Updates user balance
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = performance.now()

    // Get authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({
        error: "Authorization header required",
        message: "Please include 'Authorization: Bearer YOUR_TOKEN' in headers"
      }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "").trim()

    if (!token) {
      return NextResponse.json({
        error: "Invalid authorization format",
        message: "Authorization header should be 'Bearer YOUR_TOKEN'"
      }, { status: 401 })
    }

    // Parse token to get user ID
    const tokenParts = token.split("_")
    if (tokenParts.length < 2) {
      return NextResponse.json({
        error: "Invalid token format",
        message: "Token should be in format: token_USERID_TIMESTAMP"
      }, { status: 401 })
    }

    const userId = tokenParts[1]

    if (!userId) {
      return NextResponse.json({ error: "Invalid token - user ID not found" }, { status: 401 })
    }

    // Get user from database
    const allUsers = users.get()
    const user = allUsers[userId]

    if (!user) {
      return NextResponse.json({
        error: "User not found",
        message: `No user found with ID: ${userId}. Please check your token.`
      }, { status: 404 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({
        error: "Invalid JSON in request body",
        message: "Please send valid JSON data"
      }, { status: 400 })
    }

    const { toAddress, amount, currency, description } = body

    // Validate input
    if (!toAddress) {
      return NextResponse.json({
        error: "Recipient address required",
        message: "Please provide 'toAddress' in request body"
      }, { status: 400 })
    }

    const amountNum = Number.parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({
        error: "Invalid amount",
        message: "Amount must be greater than 0"
      }, { status: 400 })
    }

    // Validate Ethereum address format
    if (!toAddress.startsWith("0x") || toAddress.length !== 42) {
      return NextResponse.json({
        error: "Invalid wallet address",
        message: "Address must start with '0x' and be 42 characters long"
      }, { status: 400 })
    }


    const currencyCode = currency || "ETH"
    // amountNum is already parsed and validated above
    const gasFee = Number.parseFloat((amountNum * 0.02).toFixed(6))
    const totalAmount = amountNum + gasFee

    // Check balance
    let currentBalance = 0

    // Ensure balances exist
    if (!user.balances) {
      user.balances = { USD: 0, BDT: 0, BTC: 0, ETH: 0, USDT: 0, EUR: 0, GBP: 0 }
    }

    if (currencyCode === "ETH" && typeof user.realEthBalance === 'number') {
      currentBalance = user.realEthBalance
    } else {
      currentBalance = user.balances[currencyCode as keyof typeof user.balances] || 0
    }

    if (currentBalance < totalAmount) {
      return NextResponse.json({
        error: `Insufficient ${currencyCode} balance`,
        message: `Required: ${totalAmount} ${currencyCode} (${amountNum} + ${gasFee} gas fee). Available: ${currentBalance} ${currencyCode}`,
        required: totalAmount,
        available: currentBalance,
        gasFee: gasFee
      }, { status: 400 })
    }

    // Deduct balance
    if (currencyCode === "ETH" && typeof user.realEthBalance === 'number') {
      user.realEthBalance -= totalAmount
    } else {
      user.balances[currencyCode as keyof typeof user.balances] = currentBalance - totalAmount
    }

    users.save(allUsers)

    // Create transaction record
    const transaction = {
      id: generateTransactionId(),
      fromUserId: userId,
      fromAddress: user.walletAddress || "0x(Direct Transfer)",
      toAddress,
      amount: amountNum,
      gasFee,
      currency: currencyCode,
      description: description || "Transfer",
      status: "completed" as const,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      executionTime: Number.parseFloat(Math.max(1, (performance.now() - startTime) / 1000).toFixed(2)),
    }

    const allTransactions = transactions.get()
    allTransactions.push(transaction)
    transactions.save(allTransactions)

    return NextResponse.json({
      success: true,
      transaction,
      newBalance: user.realEthBalance,
      message: "Transaction completed successfully"
    })
  } catch (error) {
    console.error("Send transaction error:", error)
    return NextResponse.json({
      error: "Failed to process transaction",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 })
  }
}
