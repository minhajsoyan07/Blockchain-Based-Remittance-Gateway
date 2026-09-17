/**
 * Currency Utilities Module
 * 
 * Provides functions for currency conversion, formatting, and exchange rate management.
 * Handles conversion between 7 supported currencies (USD, BDT, EUR, GBP, BTC, ETH, USDT)
 * with proper rate calculations and fallback mechanisms.
 * 
 * @module lib/currency-utils
 */

// ============================================================================
// Type Definitions
// ============================================================================
export interface ExchangeRates {
  USD: number
  BDT: number
  EUR: number
  GBP: number
  BTC: number
  ETH: number
  USDT: number
}

// ============================================================================
// Client-Side Cache Configuration
// ============================================================================
let cachedRates: ExchangeRates | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache duration

// ============================================================================
// Default/Fallback Rates
// ============================================================================
export const DEFAULT_RATES: ExchangeRates = {
  USD: 1,
  BDT: 110.5,
  EUR: 0.92,
  GBP: 0.79,
  BTC: 0.000023,
  ETH: 0.00041,
  USDT: 1.0,
}

// ============================================================================
// Get Exchange Rates: Fetches rates from API with caching
// ============================================================================
/**
 * Fetches real-time exchange rates from the API
 * - Uses client-side cache to reduce API calls
 * - Falls back to cached rates on error
 * - Returns default rates if all else fails
 * 
 * @returns Promise resolving to ExchangeRates object
 */
export const getExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    const now = Date.now()
    if (cachedRates && now - cacheTimestamp < CACHE_TTL) {
      return cachedRates
    }

    const response = await fetch("/api/exchange-rates", {
      cache: "force-cache", // Use force-cache instead of no-store to respect server caching
    })

    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`)
    }

    const rates = await response.json()
    cachedRates = rates
    cacheTimestamp = now
    return rates
  } catch (error) {
    console.error("Failed to fetch exchange rates, using fallback:", error)
    if (cachedRates) {
      return cachedRates
    }
    // Fallback rates if API fails and no cache available
    return DEFAULT_RATES
  }
}

// ============================================================================
// Convert Currency: Converts between any two supported currencies
// ============================================================================
/**
 * Converts an amount from one currency to another
 * - Uses USD as intermediate currency for cross-currency conversion
 * - Handles both fiat-to-fiat and crypto conversions
 * - Includes comprehensive error handling and validation
 * 
 * Conversion Logic:
 * 1. Fiat currencies: rate represents units per USD (e.g., BDT: 110.5 per USD)
 * 2. Crypto currencies: rate represents USD per unit (inverted for calculation)
 * 3. All conversions go through USD as intermediate
 * 
 * @param amount - Amount to convert
 * @param from - Source currency code
 * @param to - Target currency code
 * @param rates - ExchangeRates object with current rates
 * @returns Converted amount, or 0 if conversion fails
 */
export const convertCurrency = (amount: number, from: string, to: string, rates: ExchangeRates | null | undefined): number => {
  // ============================================================================
  // Input Validation
  // ============================================================================
  if (typeof amount !== "number" || isNaN(amount) || amount === 0) {
    return 0
  }

  if (!rates) {
    return 0
  }

  // ============================================================================
  // Same Currency: No conversion needed
  // ============================================================================
  if (from === to) {
    return amount
  }

  const fromRate = rates[from as keyof ExchangeRates]
  const toRate = rates[to as keyof ExchangeRates]

  // ============================================================================
  // Rate Validation: Ensure rates exist and are valid
  // ============================================================================
  if (!fromRate || !toRate || fromRate === 0) {
    return 0
  }

  // ============================================================================
  // Step 1: Convert from source currency to USD
  // ============================================================================
  // For crypto (BTC, ETH, USDT): rate is USD per unit, so amount * (1/rate) = USD
  // For fiat (USD, BDT, EUR, GBP): rate is units per USD, so amount / rate = USD
  let amountInUSD = 0

  if (from === "BTC" || from === "ETH" || from === "USDT") {
    // Crypto to USD: amount * (1 / cryptoRate)
    amountInUSD = amount * (1 / fromRate)
  } else {
    // Fiat to USD: amount / fiatRate
    amountInUSD = amount / fromRate
  }

  // ============================================================================
  // Step 2: Convert from USD to target currency
  // ============================================================================
  let convertedAmount = 0

  if (to === "BTC" || to === "ETH" || to === "USDT") {
    // USD to Crypto: USD amount / (1 / cryptoRate) = crypto amount
    convertedAmount = amountInUSD / (1 / toRate)
  } else {
    // USD to Fiat: USD amount * fiatRate = fiat amount
    convertedAmount = amountInUSD * toRate
  }

  // ============================================================================
  // Final Validation: Ensure result is valid number
  // ============================================================================
  return isNaN(convertedAmount) || !isFinite(convertedAmount) ? 0 : convertedAmount
}

// ============================================================================
// Format Currency With Name: Formats amount with currency name
// ============================================================================
/**
 * Formats a currency amount with its full name
 * - Includes proper decimal places (6 for crypto, 2 for fiat)
 * - Handles invalid numbers gracefully
 * 
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted string (e.g., "1000.00 US Dollar")
 */
export const formatCurrencyWithName = (amount: number, currency: string): string => {
  const names: Record<string, string> = {
    USD: "US Dollar",
    BDT: "Bangladeshi Taka",
    EUR: "Euro",
    GBP: "British Pound",
    BTC: "Bitcoin",
    ETH: "Ethereum",
    USDT: "Tether",
  }

  const safeAmount = isNaN(amount) ? 0 : amount
  const decimals = currency === "BTC" || currency === "ETH" ? 6 : currency === "USDT" ? 2 : 2

  return `${safeAmount.toFixed(decimals)} ${names[currency] || currency}`
}

// ============================================================================
// Format Currency: Formats amount with currency symbol
// ============================================================================
/**
 * Formats a currency amount with its symbol
 * - Special spacing for BDT (৳ symbol)
 * - Proper decimal places based on currency type
 * - Handles invalid numbers gracefully
 * 
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted string (e.g., "$1000.00" or "৳ 110500.00")
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    BDT: "৳",
    EUR: "€",
    GBP: "£",
    BTC: "₿",
    ETH: "Ξ",
    USDT: "₮",
  }

  const safeAmount = isNaN(amount) ? 0 : amount
  const decimals = currency === "BTC" || currency === "ETH" ? 6 : currency === "USDT" ? 2 : 2

  const symbol = symbols[currency] || ""
  const space = currency === "BDT" ? " " : ""

  return `${symbol}${space}${safeAmount.toFixed(decimals)}`
}

// ============================================================================
// Get Currency Symbol: Returns symbol for currency code
// ============================================================================
/**
 * Gets the currency symbol for a given currency code
 * - Returns symbol if available, otherwise returns code
 * 
 * @param currency - Currency code
 * @returns Currency symbol or code
 */
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    BDT: "৳",
    EUR: "€",
    GBP: "£",
    BTC: "₿",
    ETH: "Ξ",
    USDT: "₮",
  }
  return symbols[currency] || currency
}
