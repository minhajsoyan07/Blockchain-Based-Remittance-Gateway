"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import { useAuth } from "@/lib/auth-context"
import { getExchangeRates, convertCurrency, type ExchangeRates } from "@/lib/currency-utils"
import { toast } from "sonner"

// Type for user in exchange balances hook
type UserWithBalances = {
  realEthBalance?: number
  balances?: {
    USD?: number
    BDT?: number
    EUR?: number
    GBP?: number
    BTC?: number
    ETH?: number
    USDT?: number
  }
}
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BackButton } from "@/components/back-button"
import { OliveHeader } from "@/components/olive-header"
import { ArrowLeftRight, RefreshCw, TrendingUp, Wallet, DollarSign, ShieldCheck, Zap } from "lucide-react"

const CURRENCIES = ["USD", "BDT", "EUR", "GBP", "BTC", "ETH", "USDT"] as const

function getCurrencySymbol(currency: string) {
  switch (currency) {
    case "USD":
    case "USDT":
      return "$"
    case "BDT":
      return <span className="taka-symbol font-bold">৳</span>
    case "EUR":
      return "€"
    case "GBP":
      return "£"
    case "BTC":
      return "₿"
    case "ETH":
      return "Ξ"
    default:
      return ""
  }
}

// ============================================================================
// Currency Icon Configuration with Security & Performance
// ============================================================================

/**
 * Validates and returns currency icon path with security checks
 * Only allows safe, known currency paths to prevent path traversal
 */
function getCurrencyIconPath(currency: string): string {
  // Whitelist of allowed currencies for security
  const allowedCurrencies = ["USD", "EUR", "GBP", "BDT", "BTC", "ETH", "USDT"]

  // Security: Validate currency to prevent path traversal attacks
  if (!allowedCurrencies.includes(currency)) {
    return "/currency-icons/usd.png"
  }

  // Currency PNG image paths
  const iconPaths: Record<string, string> = {
    "USD": "/currency-icons/usd.png",
    "EUR": "/currency-icons/eur.png",
    "GBP": "/currency-icons/gbp.png",
    "BDT": "/currency-icons/bdt.png",
    "BTC": "/currency-icons/btc.png",
    "ETH": "/currency-icons/eth.png",
    "USDT": "/currency-icons/usdt.png"
  }

  // Return validated path or default
  return iconPaths[currency] || "/currency-icons/usd.png"
}

/**
 * Returns fallback emoji for currency when image fails to load
 */
function getCurrencyFallback(currency: string): string {
  const fallbacks: Record<string, string> = {
    "USD": "💵",
    "EUR": "💶",
    "GBP": "💷",
    "BDT": "৳",
    "BTC": "₿",
    "ETH": "Ξ",
    "USDT": "₮"
  }
  return fallbacks[currency] || "💳"
}

/**
 * Preloads currency icons for better performance and reduced latency
 */
function preloadCurrencyIcons(currencies: readonly string[]) {
  if (typeof window === "undefined") return

  // Preload all currency icons in parallel for faster loading
  currencies.forEach((currency) => {
    const link = document.createElement("link")
    link.rel = "preload"
    link.as = "image"
    link.href = getCurrencyIconPath(currency)
    document.head.appendChild(link)

    // Also preload using Image object for browser cache
    const img = new window.Image()
    img.src = getCurrencyIconPath(currency)
  })
}

function useExchangeBalances(user: UserWithBalances | null) {
  return CURRENCIES.reduce((acc, currency) => {
    if (!user) {
      acc[currency] = 0
      return acc
    }
    if (currency === "ETH") {
      acc[currency] = user.realEthBalance ?? 0
    } else {
      acc[currency] = user.balances?.[currency as keyof typeof user.balances] || 0
    }
    return acc
  }, {} as Record<string, number>)
}

export default function ExchangePage() {
  const router = useRouter()
  const { user, isLoading, refreshUser } = useAuth()
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [fromCurrency, setFromCurrency] = useState<string>("USD")
  const [toCurrency, setToCurrency] = useState<string>("BDT")
  const [fromAmount, setFromAmount] = useState<string>("")
  const [toAmount, setToAmount] = useState<string>("")
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [exchangeRate, setExchangeRate] = useState<number>(0)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ============================================================================
  // Security: Validate currency icon paths
  // ============================================================================
  const validatedIconPaths = useMemo(() => {
    const paths: Record<string, string> = {}
    CURRENCIES.forEach((currency) => {
      // Security: Only allow safe, whitelisted paths to prevent path traversal
      const safePath = getCurrencyIconPath(currency)
      if (safePath.startsWith("/currency-icons/") && !safePath.includes("..")) {
        paths[currency] = safePath
      }
    })
    return paths
  }, [])

  // ============================================================================
  // Performance: Preload currency icons on mount for reduced latency
  // ============================================================================
  useEffect(() => {
    if (typeof window !== "undefined") {
      preloadCurrencyIcons(CURRENCIES)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchRates = async () => {
      const rates = await getExchangeRates()
      setExchangeRates(rates)
    }
    fetchRates()
  }, [])

  useEffect(() => {
    if (exchangeRates && fromAmount && !Number.isNaN(Number.parseFloat(fromAmount))) {
      const converted = convertCurrency(Number.parseFloat(fromAmount), fromCurrency as any, toCurrency as any, exchangeRates)
      setToAmount(converted.toFixed(6))

      if (fromCurrency === toCurrency) {
        setExchangeRate(1)
      } else {
        const rate = convertCurrency(1, fromCurrency as any, toCurrency as any, exchangeRates)
        setExchangeRate(rate)
      }
    } else {
      setToAmount("")
      setExchangeRate(0)
    }
  }, [fromAmount, fromCurrency, toCurrency, exchangeRates])

  const handleSwap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleRefreshRates = async () => {
    setIsLoadingRates(true)
    try {
      const rates = await getExchangeRates()
      setExchangeRates(rates)
    } catch (error) {
      console.error("Failed to refresh rates:", error)
    } finally {
      setIsLoadingRates(false)
    }
  }

  const handleExchange = async () => {
    if (!user || !exchangeRates) return

    const amount = Number.parseFloat(fromAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    const userBalance = fromCurrency === "ETH"
      ? (user.realEthBalance ?? 0)
      : (user.balances?.[fromCurrency as keyof typeof user.balances] ?? 0)

    if (amount > userBalance) {
      alert(`Insufficient ${fromCurrency} balance`)
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/transactions/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromCurrency,
          toCurrency,
          amount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Exchange failed")
      }

      const result = await response.json()

      // Refresh user data to get updated balances
      await refreshUser()

      // Refresh exchange rates
      const rates = await getExchangeRates()
    } catch (error: unknown) {
      console.error("Exchange error:", error)
      toast.error(error instanceof Error ? error.message : "Exchange failed")
    }
  }

  const balances = useExchangeBalances(user)

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-cyan-50/40 dark:from-slate-950 dark:via-blue-950/70 dark:to-cyan-950/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Popular exchange rate pairs
  const popularPairs = [
    { base: "USD", quote: "BDT" },
    { base: "USD", quote: "EUR" },
    { base: "USD", quote: "BTC" },
    { base: "ETH", quote: "USD" },
    { base: "EUR", quote: "BDT" },
    { base: "BTC", quote: "ETH" },
  ]

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <OliveHeader />
        {/* Page Header - Sky Blue-White-Shadow Pink */}
        <div className="rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 shadow-xl text-white overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm border border-white/20 shadow-sm">
                <DollarSign className="h-4 w-4" />
                Currency Exchange
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
                Exchange currencies with real-time rates
              </h1>
              <p className="text-sm sm:text-base text-blue-100 font-medium">
                Convert between USD, EUR, GBP, BDT, BTC, ETH, and USDT instantly. Our mid-market rates ensure fair pricing with secure, instant settlements for all your currency exchange needs.
              </p>
            </div>
            <div className="self-start">
              <BackButton />
            </div>
          </div>
        </div>



        {/* Currency Conversion Card - Pink Background */}
        <Card className="rounded-lg border border-slate-300 dark:border-slate-700 bg-pink-50 dark:bg-pink-950/20 shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-300 dark:border-slate-700 bg-pink-100 dark:bg-pink-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-pink-500 dark:bg-pink-600">
                    <ArrowLeftRight className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  Currency Conversion
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                  Select currencies, enter amount, and convert instantly with live exchange rates
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {exchangeRate > 0 && (
                  <span className="text-xs font-semibold text-white bg-yellow-500 dark:bg-yellow-600 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700">
                    1 {fromCurrency} ≈ {exchangeRate.toFixed(6)} {toCurrency}
                  </span>
                )}
                <Button
                  onClick={handleRefreshRates}
                  variant="secondary"
                  size="sm"
                  className="bg-yellow-500 dark:bg-yellow-600 text-white border border-slate-300 dark:border-slate-700 hover:bg-yellow-600 dark:hover:bg-yellow-700 font-semibold"
                  disabled={isLoadingRates}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingRates ? "animate-spin" : ""}`} strokeWidth={2.5} />
                  Refresh rates
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end">
              <div className="space-y-3 p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">From</label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Input
                    value={fromAmount}
                    onChange={(event) => setFromAmount(event.target.value)}
                    type="number"
                    placeholder="Enter amount"
                    className="h-12 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-medium pr-20 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const balance = balances[fromCurrency] || 0
                      setFromAmount(balance.toFixed(fromCurrency === "BTC" || fromCurrency === "ETH" ? 6 : 2))
                    }}
                    disabled={!balances[fromCurrency] || balances[fromCurrency] <= 0}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white bg-yellow-500 dark:bg-yellow-600 hover:bg-yellow-600 dark:hover:bg-yellow-700 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Max
                  </button>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Available: {getCurrencySymbol(fromCurrency)}
                  {balances[fromCurrency]?.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSwap}
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-yellow-500 dark:bg-yellow-600 text-white transition-all hover:bg-yellow-600 dark:hover:bg-yellow-700"
              >
                <ArrowLeftRight className="w-5 h-5" strokeWidth={2.5} />
              </button>

              <div className="space-y-3 p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">To</label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
                <Input
                  value={toAmount}
                  readOnly
                  placeholder="Converted amount"
                  className="h-12 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-base font-medium"
                />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Holding: {getCurrencySymbol(toCurrency)}
                  {balances[toCurrency]?.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-300 dark:border-slate-700">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Mid-market pricing
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secure settlement
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <Zap className="w-3.5 h-3.5" />
                  Instant conversion
                </span>
              </div>
              <Button
                onClick={handleExchange}
                className="h-12 rounded-md bg-yellow-500 dark:bg-yellow-600 text-white font-semibold px-8 hover:bg-yellow-600 dark:hover:bg-yellow-700 border border-slate-300 dark:border-slate-700"
              >
                Convert now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout: Rates and Balances */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6">
          {/* Exchange Rates Section - Yellow Background */}
          <Card className="rounded-lg border border-slate-300 dark:border-slate-700 bg-yellow-50 dark:bg-yellow-950/20 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-300 dark:border-slate-700 bg-yellow-100 dark:bg-yellow-900/30">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-500 dark:bg-yellow-600">
                  <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                Exchange Rates
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                Real-time mid-market rates for popular currency pairs
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {exchangeRates ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {popularPairs.map(({ base, quote }) => {
                    const rate = convertCurrency(1, base as any, quote as any, exchangeRates)
                    return (
                      <div
                        key={`${base}-${quote}`}
                        className="rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-4 py-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">{base}/{quote}</p>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">mid-market rate</p>
                          </div>
                          <div className="p-2 rounded-md bg-yellow-500 dark:bg-yellow-600">
                            <ArrowLeftRight className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                          1 {base} = {rate.toFixed(6)} {quote}
                        </p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2">
                          {getCurrencySymbol(base)}1 = {getCurrencySymbol(quote)}{rate.toFixed(4)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-200 dark:border-blue-800 animate-pulse mx-auto mb-3"></div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading exchange rates...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Balances Section - Light Green-White-Sky */}
          <Card className="rounded-lg border border-slate-300 dark:border-slate-700 bg-gradient-to-br from-green-50 via-white to-sky-50 dark:from-green-950/30 dark:via-slate-900 dark:to-sky-950/30 shadow-sm">
            <CardHeader className="pb-4 border-b border-slate-300 dark:border-slate-700 bg-gradient-to-r from-green-100/80 via-white to-sky-100/80 dark:from-green-900/40 dark:via-slate-800 dark:to-sky-900/40">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-400 to-sky-400 dark:from-green-600 dark:to-sky-600">
                  <Wallet className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                Wallet Balances
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                Available balances for exchange
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {CURRENCIES.map((currency) => {
                const balance = balances[currency] || 0
                return (
                  <div
                    key={currency}
                    className="flex items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-sky-50 dark:hover:from-green-900/20 dark:hover:to-sky-900/20 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-sky-100 dark:from-green-800 dark:to-sky-800 flex items-center justify-center shadow-md border border-slate-300 dark:border-slate-700 overflow-hidden relative">
                        {imageErrors.has(currency) ? (
                          // Fallback emoji when image fails
                          <span className="text-xl select-none" aria-hidden="true">
                            {getCurrencyFallback(currency)}
                          </span>
                        ) : (
                          // Currency PNG icon with proper sizing, formatting, and black thin outline
                          <Image
                            src={validatedIconPaths[currency] || getCurrencyIconPath(currency)}
                            alt={`${currency} currency icon`}
                            width={48}
                            height={48}
                            className="w-full h-full object-contain p-1.5"
                            style={{
                              outline: '1px solid rgba(0, 0, 0, 0.25)',
                              outlineOffset: '-1px',
                              borderRadius: '50%'
                            }}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              if (target && !imageErrors.has(currency)) {
                                setImageErrors((prev) => {
                                  const newSet = new Set(prev)
                                  newSet.add(currency)
                                  return newSet
                                })
                                target.style.display = 'none'
                              }
                            }}
                            onLoad={(e) => {
                              if (imageErrors.has(currency)) {
                                setImageErrors((prev) => {
                                  const newSet = new Set(prev)
                                  newSet.delete(currency)
                                  return newSet
                                })
                              }
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{currency}</p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {currency === "ETH" ? "Ethereum" : currency === "BTC" ? "Bitcoin" : currency === "USDT" ? "Tether" : currency === "USD" ? "US Dollar" : currency === "EUR" ? "Euro" : currency === "GBP" ? "British Pound" : currency === "BDT" ? "Bangladeshi Taka" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {getCurrencySymbol(currency)}
                        {balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </p>
                      {exchangeRates && balance > 0 && currency !== "USD" && (
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                          ≈ ${convertCurrency(balance, currency as any, "USD", exchangeRates).toFixed(2)} USD
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
