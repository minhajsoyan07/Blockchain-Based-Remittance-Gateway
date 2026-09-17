/**
 * Currency Exchange API Route
 * 
 * Handles currency conversion transactions between supported currencies.
 * Supports all 7 currencies: USD, EUR, GBP, BDT, BTC, ETH, USDT
 * 
 * Features:
 * - Token-based authentication
 * - Real-time exchange rate fetching
 * - Multi-currency balance management
 * - Automatic balance initialization
 * - ETH balance handling (realEthBalance vs balances.ETH)
 * 
 * @module app/api/transactions/exchange/route
 */

import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"
import { getExchangeRates, convertCurrency } from "@/lib/currency-utils"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ============================================================================
// POST Handler: Process Currency Exchange Transaction
// ============================================================================
/**
 * Processes currency exchange requests
 * - Validates authentication and user
 * - Validates currencies (must be different)
 * - Checks sufficient balance in source currency
 * - Fetches real-time exchange rates
 * - Converts amount using current rates
 * - Updates balances (deducts from source, adds to destination)
 * - Handles ETH balance separately (realEthBalance)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tokenParts = token.split("_")
    const userId = tokenParts[1]

    if (!userId) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 401 })
    }

    const { fromCurrency, toCurrency, amount } = await request.json()

    if (!fromCurrency || !toCurrency || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    if (fromCurrency === toCurrency) {
      return NextResponse.json({ error: "Cannot exchange same currency" }, { status: 400 })
    }

    const allUsers = users.get()
    const user = allUsers[userId]

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check balance
    const userBalance = fromCurrency === "ETH" 
      ? (user.realEthBalance ?? 0)
      : (user.balances?.[fromCurrency as keyof typeof user.balances] ?? 0)

    if (amount > userBalance) {
      return NextResponse.json({ error: `Insufficient ${fromCurrency} balance` }, { status: 400 })
    }

    // Get exchange rates and convert
    const exchangeRates = await getExchangeRates()
    const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency, exchangeRates)

    // Initialize balances if not exists
    if (!user.balances) {
      user.balances = { USD: 0, EUR: 0, GBP: 0, BDT: 0, BTC: 0, ETH: 0, USDT: 0 }
    }

    // Ensure all currency fields exist
    if (user.balances.USD === undefined) user.balances.USD = 0
    if (user.balances.EUR === undefined) user.balances.EUR = 0
    if (user.balances.GBP === undefined) user.balances.GBP = 0
    if (user.balances.BDT === undefined) user.balances.BDT = 0
    if (user.balances.BTC === undefined) user.balances.BTC = 0
    if (user.balances.ETH === undefined) user.balances.ETH = 0
    if (user.balances.USDT === undefined) user.balances.USDT = 0

    // Deduct from source
    if (fromCurrency === "ETH") {
      const currentBalance = user.realEthBalance ?? 0
      user.realEthBalance = Math.max(0, currentBalance - amount)
    } else {
      const currentBalance = user.balances[fromCurrency as keyof typeof user.balances] || 0
      user.balances[fromCurrency as keyof typeof user.balances] = Math.max(0, currentBalance - amount) as number
    }

    // Add to destination
    if (toCurrency === "ETH") {
      const currentBalance = user.realEthBalance ?? 0
      user.realEthBalance = currentBalance + convertedAmount
    } else {
      const currentBalance = user.balances[toCurrency as keyof typeof user.balances] || 0
      user.balances[toCurrency as keyof typeof user.balances] = (currentBalance + convertedAmount) as number
    }

    users.save(allUsers)

    return NextResponse.json({
      success: true,
      message: "Currency exchanged successfully",
      fromAmount: amount,
      toAmount: convertedAmount,
      fromCurrency,
      toCurrency,
      balances: user.balances,
      realEthBalance: user.realEthBalance,
    })
  } catch (error) {
    console.error("[Exchange] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
