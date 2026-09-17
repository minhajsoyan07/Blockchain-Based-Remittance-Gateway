/**
 * Exchange Rates API Route
 * 
 * Provides real-time exchange rates for all supported currencies:
 * - Fiat currencies: USD, BDT, EUR, GBP
 * - Cryptocurrencies: BTC, ETH, USDT
 * 
 * Features:
 * - Server-side caching (5 minutes TTL)
 * - Fallback rates on API failure
 * - Dual API integration (CoinGecko + ExchangeRate-API)
 * 
 * @module app/api/exchange-rates/route
 */

import { NextResponse } from "next/server"

import { DEFAULT_RATES } from "@/lib/currency-utils"

// Force dynamic rendering for real-time rates
export const dynamic = 'force-dynamic'

// ============================================================================
// Type Definitions
// ============================================================================
interface ExchangeRates {
  USD: number
  BDT: number
  EUR: number
  GBP: number
  BTC: number
  ETH: number
  USDT: number
}

// ============================================================================
// Server-Side Cache Configuration
// ============================================================================
let serverCache: { rates: ExchangeRates; timestamp: number } | null = null
const SERVER_CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache duration

// ============================================================================
// GET Handler: Fetch Real-Time Exchange Rates
// ============================================================================
/**
 * Handles GET requests for exchange rates
 * - Returns cached rates if available and fresh
 * - Fetches from external APIs if cache expired
 * - Falls back to cached or default rates on error
 */
export async function GET() {
  try {
    const now = Date.now()

    // ============================================================================
    // Cache Check: Return cached rates if still valid
    // ============================================================================
    if (serverCache && now - serverCache.timestamp < SERVER_CACHE_TTL) {
      return NextResponse.json(serverCache.rates, {
        headers: {
          "Cache-Control": "public, max-age=300", // 5 minutes
        },
      })
    }

    // ============================================================================
    // Fetch Cryptocurrency Prices from CoinGecko API with timeout
    // ============================================================================
    const cryptoController = new AbortController()
    const cryptoTimeout = setTimeout(() => cryptoController.abort(), 5000) // 5 second timeout

    const cryptoResponse = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd",
      {
        next: { revalidate: 300 },
        signal: cryptoController.signal,
        headers: {
          "Accept": "application/json",
        },
      }
    ).finally(() => clearTimeout(cryptoTimeout))

    if (!cryptoResponse.ok) {
      throw new Error(`CoinGecko API failed: ${cryptoResponse.status}`)
    }

    const cryptoData = await cryptoResponse.json()

    // ============================================================================
    // Fetch Fiat Exchange Rates from ExchangeRate-API with timeout
    // ============================================================================
    const fiatController = new AbortController()
    const fiatTimeout = setTimeout(() => fiatController.abort(), 5000) // 5 second timeout

    const fiatResponse = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      next: { revalidate: 300 },
      signal: fiatController.signal,
      headers: {
        "Accept": "application/json",
      },
    }).finally(() => clearTimeout(fiatTimeout))

    if (!fiatResponse.ok) {
      throw new Error(`ExchangeRate API failed: ${fiatResponse.status}`)
    }

    const fiatData = await fiatResponse.json()

    // ============================================================================
    // Rate Calculation: Convert API data to standardized format
    // ============================================================================
    const rates: ExchangeRates = {
      USD: 1, // Base currency
      BDT: fiatData.rates.BDT || DEFAULT_RATES.BDT,
      EUR: fiatData.rates.EUR || DEFAULT_RATES.EUR,
      GBP: fiatData.rates.GBP || DEFAULT_RATES.GBP,
      BTC: 1 / cryptoData.bitcoin.usd, // Inverse: 1 BTC = X USD
      ETH: 1 / cryptoData.ethereum.usd, // Inverse: 1 ETH = X USD
      USDT: 1 / (cryptoData.tether?.usd || 1), // Inverse: 1 USDT = X USD (typically 1)
    }

    // ============================================================================
    // Update Cache and Return Rates with Security Headers
    // ============================================================================
    serverCache = { rates, timestamp: now }

    // ============================================================================
    // Security Headers for API Responses
    // ============================================================================
    const securityHeaders = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    }

    return NextResponse.json(rates, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60", // 5 minutes with stale-while-revalidate
        ...securityHeaders,
      },
    })
  } catch (error) {
    // ============================================================================
    // Error Handling: Fallback Strategy
    // ============================================================================
    console.error("Failed to fetch real-time rates:", error)

    // Return cached rates if available (even if expired) with security headers
    const securityHeaders = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    }

    if (serverCache) {
      return NextResponse.json(serverCache.rates, {
        headers: {
          "Cache-Control": "public, max-age=60", // 1 minute for error state
          ...securityHeaders,
        },
      })
    }

    // ============================================================================
    // Fallback Rates: Default values if no cache available
    // ============================================================================
    return NextResponse.json(DEFAULT_RATES, {
      headers: {
        "Cache-Control": "public, max-age=60", // 1 minute for fallback
        ...securityHeaders,
      },
    })
  }
}
