"use client"

import type React from "react"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { Send, AlertCircle, CheckCircle, TrendingUp, Zap, RefreshCw, ArrowLeft, Shield } from "lucide-react"
import { OliveHeader } from "@/components/olive-header"
import { getCurrencySymbol, getExchangeRates, type ExchangeRates } from "@/lib/currency-utils"
import { debounce } from "@/lib/performance-utils"

export default function SendMoneyPage() {
  const router = useRouter()
  const { user, isLoading, logout, refreshBalance, refreshUserData, updateRealEthBalance } = useAuth()
  const [toAddress, setToAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [password, setPassword] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [txHash, setTxHash] = useState("")
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [inputCurrency, setInputCurrency] = useState<string>("USD")
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false)
  const [usdValue, setUsdValue] = useState<number>(0)
  const [bdtValue, setBdtValue] = useState<number>(0)
  const [estimatedGasFee, setEstimatedGasFee] = useState<number>(0)
  const [estimatedGasFeeBdt, setEstimatedGasFeeBdt] = useState<number>(0)
  const [totalCost, setTotalCost] = useState<number>(0)
  const [totalCostBdt, setTotalCostBdt] = useState<number>(0)
  const [ethAmount, setEthAmount] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Type-safe check for MetaMask extension
      const ethereum = (window as { ethereum?: unknown }).ethereum
      setIsMetaMaskAvailable(ethereum !== undefined)
    }
  }, [])

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const rates = await getExchangeRates()
        setExchangeRates(rates)
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error)
        // Set fallback rates so the page still functions
        setExchangeRates({
          USD: 1,
          BDT: 110.5,
          EUR: 0.92,
          GBP: 0.79,
          BTC: 0.000023,
          ETH: 0.00041,
          USDT: 1.0,
        })
      }
    }
    fetchExchangeRates()
  }, [])

  // Memoized balance fetch function for performance
  const fetchMetaMaskBalance = useCallback(async () => {
    // Validate wallet address exists and is valid
    if (!user?.walletAddress ||
      typeof user.walletAddress !== "string" ||
      user.walletAddress.trim() === "") {
      return
    }

    try {
      const { getEthBalance } = await import("@/lib/metamask-utils")
      const balance = await getEthBalance(user.walletAddress)
      if (balance === null) return

      const newBalance = Number.parseFloat(balance)

      // Only update if balance is valid and different from current
      if (!Number.isNaN(newBalance) && user.realEthBalance !== newBalance) {
        updateRealEthBalance(newBalance)
      }
    } catch (error) {
      console.error("Failed to fetch MetaMask balance:", error)
      // Don't reset balance on error, keep existing value
    }
  }, [user?.walletAddress, user?.realEthBalance, updateRealEthBalance])

  // Auto-fetch MetaMask balance on page load (optimized)
  useEffect(() => {
    // Only fetch if user is loaded and has wallet address
    if (!isLoading && user?.walletAddress) {
      // Small delay to prevent blocking initial render
      const timer = setTimeout(() => {
        fetchMetaMaskBalance()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isLoading, user?.walletAddress, fetchMetaMaskBalance])

  // Memoize expensive calculations for better performance
  const calculatedValues = useMemo(() => {
    if (!amount || !exchangeRates) {
      return {
        ethAmount: 0,
        usdValue: 0,
        bdtValue: 0,
        estimatedGasFee: 0,
        estimatedGasFeeBdt: 0,
        totalCost: 0,
        totalCostBdt: 0,
      }
    }

    const amountNum = Number.parseFloat(amount)
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      return {
        ethAmount: 0,
        usdValue: 0,
        bdtValue: 0,
        estimatedGasFee: 0,
        estimatedGasFeeBdt: 0,
        totalCost: 0,
        totalCostBdt: 0,
      }
    }

    let ethAmountCalc = 0

    if (inputCurrency === "ETH") {
      ethAmountCalc = amountNum
    } else if (inputCurrency === "BTC") {
      ethAmountCalc = amountNum * (1 / exchangeRates.ETH) / (1 / exchangeRates.BTC)
    } else {
      // For fiat currencies (USD, EUR, GBP, BDT, USDT)
      const usdValue = inputCurrency === "USDT"
        ? amountNum
        : amountNum / exchangeRates[inputCurrency as keyof ExchangeRates]
      ethAmountCalc = usdValue / (1 / exchangeRates.ETH)
    }

    const gasFee = ethAmountCalc * 0.02
    const usd = ethAmountCalc * (1 / exchangeRates.ETH)
    const bdt = usd * exchangeRates.BDT
    const gasFeeUsd = gasFee * (1 / exchangeRates.ETH)
    const gasFeeBdt = gasFeeUsd * exchangeRates.BDT
    const total = (ethAmountCalc + gasFee) * (1 / exchangeRates.ETH)
    const totalBdt = total * exchangeRates.BDT

    return {
      ethAmount: ethAmountCalc,
      usdValue: usd,
      bdtValue: bdt,
      estimatedGasFee: gasFeeUsd,
      estimatedGasFeeBdt: gasFeeBdt,
      totalCost: total,
      totalCostBdt: totalBdt,
    }
  }, [amount, exchangeRates, inputCurrency])

  // Update state from memoized values (only when values change)
  useEffect(() => {
    setEthAmount(calculatedValues.ethAmount)
    setUsdValue(calculatedValues.usdValue)
    setBdtValue(calculatedValues.bdtValue)
    setEstimatedGasFee(calculatedValues.estimatedGasFee)
    setEstimatedGasFeeBdt(calculatedValues.estimatedGasFeeBdt)
    setTotalCost(calculatedValues.totalCost)
    setTotalCostBdt(calculatedValues.totalCostBdt)
  }, [calculatedValues])

  const inputCurrencySymbol = useMemo(() => getCurrencySymbol(inputCurrency), [inputCurrency])

  const amountFractionDigits = useMemo(() => {
    if (inputCurrency === "BTC") return 8
    if (inputCurrency === "ETH") return 6
    return 2
  }, [inputCurrency])

  const amountNumber = useMemo(() => {
    const parsed = Number.parseFloat(amount)
    return Number.isNaN(parsed) ? 0 : parsed
  }, [amount])

  const gasFeeEth = useMemo(() => {
    if (Number.isNaN(ethAmount) || ethAmount <= 0) {
      return 0
    }
    return Number.parseFloat((ethAmount * 0.02).toFixed(6))
  }, [ethAmount])

  const totalEth = useMemo(() => {
    if (Number.isNaN(ethAmount) || ethAmount <= 0) {
      return 0
    }
    return Number.parseFloat((ethAmount + gasFeeEth).toFixed(6))
  }, [ethAmount, gasFeeEth])

  // ============================================================================
  // Handlers (must be before conditional returns per Rules of Hooks)
  // ============================================================================

  // Validation functions
  const validateAmount = useCallback((amountValue: string, currencyValue: string): string | null => {
    if (!amountValue || amountValue.trim() === "") {
      return "Please enter an amount"
    }

    const amountNum = Number.parseFloat(amountValue)

    if (Number.isNaN(amountNum)) {
      return "Amount must be a valid number"
    }

    if (amountNum <= 0) {
      return "Amount must be greater than 0"
    }

    // Check decimal precision
    const decimalPlaces = amountValue.split(".")[1]?.length || 0
    const maxDecimals: Record<string, number> = {
      USD: 2,
      EUR: 2,
      GBP: 2,
      BDT: 2,
      BTC: 8,
      ETH: 6,
      USDT: 2,
    }

    if (maxDecimals[currencyValue] && decimalPlaces > maxDecimals[currencyValue]) {
      return `Maximum ${maxDecimals[currencyValue]} decimal places allowed for ${currencyValue}`
    }

    return null
  }, [])

  const validateWalletAddress = useCallback((address: string): string | null => {
    if (!address || address.trim() === "") {
      return "Please enter a wallet address"
    }

    const trimmedAddress = address.trim().toLowerCase()

    if (!trimmedAddress.startsWith("0x") || trimmedAddress.length !== 42) {
      return "Invalid wallet address. Must start with 0x and be 42 characters long"
    }

    if (!/^0x[a-f0-9]{40}$/.test(trimmedAddress)) {
      return "Invalid wallet address format. Use valid Ethereum address"
    }

    return null
  }, [])

  const handleSendMoney = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setMessageType("")
    setTxHash("")

    // Validate amount
    const amountError = validateAmount(amount, inputCurrency)
    if (amountError) {
      setMessage(amountError)
      setMessageType("error")
      return
    }

    // Validate wallet address
    const addressError = validateWalletAddress(toAddress)
    if (addressError) {
      setMessageType("error")
      return
    }

    if (user?.walletAddress && user.walletAddress.toLowerCase() === toAddress.toLowerCase()) {
      setMessage("Cannot send money to your own wallet address")
      setMessageType("error")
      return
    }

    if (ethAmount <= 0) {
      setMessage("Amount must be greater than 0")
      setMessageType("error")
      return
    }

    if (!isMetaMaskAvailable) {
      setMessage("MetaMask is not installed. Please install MetaMask extension.")
      setMessageType("error")
      return
    }

    if (!user?.walletAddress) {
      setMessage("Please connect your MetaMask wallet from the dashboard first")
      setMessageType("error")
      return
    }

    if (!password) {
      setMessage("Please enter your password")
      setMessageType("error")
      return
    }

    const currentBalance = user.realEthBalance ?? 0
    // Estimate gas: max(0.0005 ETH, 2% of amount)
    // 0.0005 ETH is ~24,000 gas at 20 gwei, decent baseline for simple transfer
    const estimatedGas = Math.max(0.0005, ethAmount * 0.02)
    const totalNeeded = ethAmount + estimatedGas

    // Validate balance with more precision
    const balanceCheck = currentBalance - totalNeeded
    if (balanceCheck < 0) {
      const shortfall = Math.abs(balanceCheck)
      setMessage(
        `Insufficient ETH balance. Need amount + ~gas (${totalNeeded.toFixed(6)} ETH). You have ${currentBalance.toFixed(6)} ETH.`,
      )
      setMessageType("error")
      return
    }

    // Additional safety check: ensure balance is sufficient with a small buffer
    if (balanceCheck < 0.000001) {
      setMessage("Insufficient ETH balance. Please ensure you have enough ETH for gas fees")
      setMessageType("error")
      return
    }

    setIsSending(true)

    try {
      // Verify password first
      try {
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            password: password,
          }),
        })

        if (!loginResponse.ok) {
          throw new Error("Invalid password")
        }
      } catch (error) {
        setMessage("Invalid password. Please try again.")
        setMessageType("error")
        setIsSending(false)
        return
      }

      const { sendEthTransaction } = await import("@/lib/metamask-utils")
      const startTime = typeof performance !== "undefined" ? performance.now() : Date.now()

      // Ensure ethAmount is formatted as a decimal string safe for ethers
      // Use toFixed(18) to get enough precision and avoid scientific notation, then trim trailing zeros
      let safeEthAmount = ethAmount.toFixed(18).replace(/\.?0+$/, "")

      const transactionHash = await sendEthTransaction(toAddress, safeEthAmount)
      const endTime = typeof performance !== "undefined" ? performance.now() : Date.now()
      const executionTimeSeconds = Number.parseFloat(
        Math.max(1, ((endTime - startTime) / 1000)).toFixed(2),
      )

      // Show success message immediately
      setMessage(`Transaction sent successfully!`)
      setTxHash(transactionHash)
      setMessageType("success")

      // Clear form fields
      setToAddress("")
      setAmount("")
      setDescription("")
      setPassword("")
      setUsdValue(0)
      setBdtValue(0)
      setEstimatedGasFee(0)
      setEstimatedGasFeeBdt(0)
      setTotalCost(0)
      setTotalCostBdt(0)

      // Record transaction immediately (don't wait)
      try {
        const token = localStorage.getItem("auth_token")
        await fetch("/api/transactions/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            toAddress,
            amount: ethAmount,
            gasFee: ethAmount * 0.02,
            currency: "ETH",
            description: description || "Send ETH via MetaMask",
            txHash: transactionHash,
            status: "completed",
            executionTime: executionTimeSeconds,
          }),
        })
      } catch (error) {
        console.error("Failed to record transaction:", error)
      }

      // Refresh balance and user data after successful transaction
      try {
        setIsRefreshing(true)

        // Wait a moment for blockchain to process (optional, but good for UX pacing)
        await new Promise(resolve => setTimeout(resolve, 800))

        // ONLY refresh user data from server. 
        // We do NOT fetch from MetaMask here because:
        // 1. If this is a mock transaction, the blockchain balance hasn't changed, but the server balance HAS.
        // 2. If it is a real transaction, the server balance is already updated with the deduction.
        // Fetching from MetaMask (which might be slow or unchanged) would overwrite our fresh deducted balance.
        await refreshUserData()

      } finally {
        setIsRefreshing(false)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send transaction")
      setMessageType("error")
    } finally {
      setIsSending(false)
    }
  }, [toAddress, amount, ethAmount, description, password, user, isMetaMaskAvailable, fetchMetaMaskBalance, refreshUserData, inputCurrency, validateAmount, validateWalletAddress])

  /**
   * Handles user logout with safe navigation
   */
  const handleLogout = useCallback(() => {
    // Clear storage and navigate immediately without triggering React state updates
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("auth_token")
        window.location.href = "/"
      } catch (error) {
        window.location.href = "/"
      }
    }
  }, [])

  // ============================================================================
  // Conditional Returns (after all hooks)
  // ============================================================================

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ============================================================================
  // Conditional Returns (after all hooks)
  // ============================================================================

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-slate-950 dark:via-purple-950/50 dark:to-blue-950/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <OliveHeader />
        {/* Page Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 shadow-xl text-white overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                <Send className="h-3.5 w-3.5" />
                Transfer Money
              </div>
              <h1 className="text-[36px] sm:text-[44px] font-semibold leading-tight text-white">
                Send money securely worldwide
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Transfer funds instantly using blockchain technology. Support for all currencies with automatic conversion to ETH.
              </p>
            </div>
            <div className="flex flex-row gap-3">

              <BackButton />
            </div>
          </div>
        </div>

        <div className="mb-6" />

        {user.walletAddress && (
          <Card className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 shadow-xl dark:border-purple-800/60 dark:from-purple-900/20 dark:to-blue-900/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 font-semibold uppercase tracking-wide">
                    Your ETH Balance
                  </p>
                  <div className="text-4xl font-bold text-purple-700 dark:text-purple-300 mb-1">
                    {(user.realEthBalance ?? 0).toFixed(6)} ETH
                  </div>
                  {exchangeRates && user.realEthBalance !== undefined && (user.realEthBalance ?? 0) > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-white dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-purple-100 dark:border-purple-800/40">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">USD Value</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          ${((user.realEthBalance ?? 0) * (1 / exchangeRates.ETH)).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-800/50 px-4 py-3 rounded-xl border border-purple-100 dark:border-purple-800/40">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">BDT Value</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          <span className="taka-symbol">৳</span>{((user.realEthBalance ?? 0) * (1 / exchangeRates.ETH) * exchangeRates.BDT).toFixed(0)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="md:text-right">
                  <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 font-semibold uppercase tracking-wide">
                    Connected Wallet
                  </p>
                  <p className="text-sm font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border-2 border-purple-200 dark:border-purple-700 mb-3">
                    {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                  </p>
                  <Button
                    onClick={async () => {
                      try {
                        setIsRefreshing(true)

                        // Clear any stale balance values first
                        setUsdValue(0)
                        setBdtValue(0)

                        // Fetch fresh balance from MetaMask directly (optimized)
                        if (user?.walletAddress) {
                          fetchMetaMaskBalance()
                        }

                        // Refresh user data from server in parallel for speed
                        await Promise.all([
                          refreshUserData(),
                          new Promise(resolve => setTimeout(resolve, 300))
                        ])

                        // Auto refresh page to ensure all values are updated correctly (faster)
                        if (typeof window !== "undefined") {
                          setTimeout(() => {
                            window.location.reload()
                          }, 300)
                        }
                      } catch (error) {
                        console.error("Failed to refresh balance:", error)
                        setIsRefreshing(false)
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} strokeWidth={2} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="rounded-3xl border border-purple-100 bg-white shadow-xl dark:border-purple-900/40 dark:bg-slate-900 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10 p-6 border-b border-purple-100 dark:border-purple-800/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-purple-100 dark:border-purple-800/60">
                      <Send className="w-6 h-6 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transfer Details</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Send real ETH from your MetaMask wallet</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                    <Shield className="w-3.5 h-3.5 text-green-700 dark:text-green-400" />
                    <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Secure</span>
                  </div>
                </div>
              </div>
              <CardContent className="pt-6">
                <form onSubmit={handleSendMoney} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Recipient Wallet Address
                    </label>
                    <Input
                      type="text"
                      value={toAddress}
                      onChange={(e) => {
                        let value = e.target.value.trim()
                        // Auto-format wallet addresses to lowercase
                        if (value.startsWith("0x")) {
                          value = value.toLowerCase()
                        }
                        setToAddress(value)
                      }}
                      placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"
                      className="h-12 text-base bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                      pattern="^0x[a-fA-F0-9]{40}$"
                      required
                      disabled={!user.walletAddress || !isMetaMaskAvailable}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Must be a valid Ethereum address starting with 0x
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Amount & Currency</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => {
                            const value = e.target.value
                            // Prevent negative values
                            if (value === "" || (!Number.isNaN(Number.parseFloat(value)) && Number.parseFloat(value) >= 0)) {
                              setAmount(value)
                            }
                          }}
                          placeholder="0.001"
                          step={inputCurrency === "BTC" ? "0.00000001" : inputCurrency === "ETH" ? "0.000001" : "0.01"}
                          min="0"
                          className="h-12 text-base bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-20 font-semibold focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                          required
                          disabled={!user.walletAddress || !isMetaMaskAvailable}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (user.realEthBalance !== undefined && (user.realEthBalance ?? 0) > 0 && exchangeRates) {
                              // Calculate max amount reserve for gas (0.0005 minimum or 2% logic reversed)
                              // We use a safe buffer of 0.001 ETH or 2% for Max just to be safe
                              const safeBuffer = Math.max(0.001, (user.realEthBalance ?? 0) * 0.02)
                              let maxEthAmount = (user.realEthBalance ?? 0) - safeBuffer
                              if (maxEthAmount < 0) maxEthAmount = 0

                              const usdValue = maxEthAmount * (1 / exchangeRates.ETH)

                              if (inputCurrency === "ETH") {
                                setAmount(maxEthAmount.toFixed(6))
                              } else if (inputCurrency === "BTC") {
                                const btcValue = usdValue / (1 / exchangeRates.BTC)
                                setAmount(btcValue.toFixed(6))
                              } else if (inputCurrency === "USDT") {
                                setAmount(usdValue.toFixed(2))
                              } else {
                                const convertedValue = inputCurrency === "BDT"
                                  ? usdValue * exchangeRates.BDT
                                  : usdValue * exchangeRates[inputCurrency as keyof ExchangeRates]
                                setAmount(convertedValue.toFixed(2))
                              }
                            }
                          }}
                          disabled={!user.walletAddress || !isMetaMaskAvailable || !user.realEthBalance || (user.realEthBalance ?? 0) <= 0 || !exchangeRates}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-3 py-1.5 rounded-lg border-2 border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Max
                        </button>
                      </div>
                      <select
                        value={inputCurrency}
                        onChange={(e) => setInputCurrency(e.target.value)}
                        className="h-12 px-4 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={!user.walletAddress || !isMetaMaskAvailable}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="BDT">BDT</option>
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                        <option value="USDT">USDT</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <div className="font-medium">Available: {(user.realEthBalance ?? 0).toFixed(6)} ETH</div>
                        {exchangeRates && user.realEthBalance !== undefined && (user.realEthBalance ?? 0) > 0 && (
                          <div className="mt-1 grid grid-cols-2 gap-2">
                            <div>≈ ${((user.realEthBalance ?? 0) * (1 / exchangeRates.ETH)).toFixed(2)} USD</div>
                            <div>≈ <span className="taka-symbol text-sm mr-0.5">৳</span>{((user.realEthBalance ?? 0) * (1 / exchangeRates.ETH) * exchangeRates.BDT).toFixed(0)} BDT</div>
                          </div>
                        )}
                      </div>
                      {usdValue > 0 && (
                        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-700">
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description Field moved up */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Description (Optional)
                    </label>
                    <Input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Payment for services"
                      className="h-12 text-base bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                      disabled={!user.walletAddress || !isMetaMaskAvailable}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password to confirm"
                      className="h-12 text-base bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                      disabled={!user.walletAddress || !isMetaMaskAvailable}
                      required
                    />
                  </div>

                  {!isMetaMaskAvailable && (
                    <div className="p-4 rounded-2xl flex items-start gap-3 bg-red-50 dark:bg-red-500/20 border-2 border-red-200 dark:border-red-500/40">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <div>
                        <p className="text-red-700 dark:text-red-300 text-sm font-bold">MetaMask is not installed</p>
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                          Please install MetaMask extension to continue.
                        </p>
                        <a
                          href="https://metamask.io"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 dark:text-red-400 text-xs underline hover:text-red-700 dark:hover:text-red-300 inline-block mt-2 font-semibold"
                        >
                          Visit https://metamask.io to install MetaMask
                        </a>
                      </div>
                    </div>
                  )}

                  {isMetaMaskAvailable && !user.walletAddress && (
                    <div className="p-4 rounded-2xl flex items-start gap-3 bg-amber-50 dark:bg-amber-500/20 border-2 border-amber-200 dark:border-amber-500/40">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      <p className="text-amber-700 dark:text-amber-300 text-sm font-bold">
                        Please connect your MetaMask wallet from the dashboard to send transactions.
                      </p>
                    </div>
                  )}

                  {message && (
                    <div
                      className={`p-4 rounded-2xl flex items-start gap-3 border-2 ${messageType === "success"
                        ? "bg-green-50 dark:bg-green-500/20 border-green-200 dark:border-green-500/40"
                        : "bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/40"
                        }`}
                    >
                      {messageType === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                      )}
                      <div className="flex-1">
                        <p
                          className={
                            messageType === "success"
                              ? "text-green-700 dark:text-green-300 text-sm font-bold"
                              : "text-red-700 dark:text-red-300 text-sm font-bold"
                          }
                        >
                          {message}
                        </p>
                        {txHash && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono break-all">
                            Transaction Hash: {txHash}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSending || !user.walletAddress || !isMetaMaskAvailable}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl rounded-2xl h-14"
                  >
                    <Send className="w-5 h-5 mr-2" strokeWidth={2.5} />
                    {isSending ? "Processing Transaction..." : "Send Money via MetaMask"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 sticky top-6">
            {/* Transaction Summary Card - Always visible */}
            <Card className="rounded-3xl border border-indigo-200 bg-white shadow-xl dark:border-indigo-800/60 dark:bg-slate-900 overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  Current Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {/* Sending Amount */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Sending Amount</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {amount ? `${inputCurrencySymbol}${amountNumber.toLocaleString('en-US', { maximumFractionDigits: amountFractionDigits })} ${inputCurrency}` : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {ethAmount.toFixed(6)} ETH
                    </p>
                    <div className="flex flex-col items-end gap-0.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ≈ ${usdValue.toFixed(2)} USD
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ≈ <span className="taka-symbol">৳</span>{bdtValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} BDT
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Gas Fee */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Estimated Gas Fee</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-wide">
                        2%
                      </span>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Network processing</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {gasFeeEth.toFixed(6)} ETH
                    </p>
                    <div className="flex flex-col items-end gap-0.5">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ≈ ${estimatedGasFee.toFixed(2)} USD
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ≈ <span className="taka-symbol">৳</span>{estimatedGasFeeBdt.toLocaleString('en-US', { maximumFractionDigits: 0 })} BDT
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Total */}
                <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Total Cost</p>
                    <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{totalEth.toFixed(6)} ETH</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-xs">
                    <div className="flex justify-between w-full">
                      <p className="text-indigo-600/70 dark:text-indigo-400/70">Amount to be debited</p>
                      <p className="text-indigo-600/70 dark:text-indigo-400/70">≈ ${totalCost.toFixed(2)} USD</p>
                    </div>
                    <p className="text-indigo-600/70 dark:text-indigo-400/70">
                      ≈ <span className="taka-symbol">৳</span>{totalCostBdt.toLocaleString('en-US', { maximumFractionDigits: 0 })} BDT
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-xl dark:border-amber-800/60 dark:from-amber-900/20 dark:to-orange-900/20">
              <CardHeader className="pb-3 border-b border-amber-200 dark:border-amber-800/40">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0 mt-0.5">•</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">This sends REAL ETH from your MetaMask wallet - transactions cannot be reversed</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0 mt-0.5">•</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Ensure the recipient wallet address is correct before confirming</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0 mt-0.5">•</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">A 2% gas fee will be deducted from your transaction</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0 mt-0.5">•</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">You must approve the transaction in your MetaMask extension</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0 mt-0.5">•</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Transaction confirmation may take a few minutes depending on network congestion</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
