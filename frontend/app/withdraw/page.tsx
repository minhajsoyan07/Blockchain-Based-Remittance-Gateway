"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { OliveHeader } from "@/components/olive-header"
import { Minus, AlertCircle, CheckCircle, TrendingUp, ArrowLeft, Wallet, Smartphone, ArrowLeftRight, Shield, Clock, Zap, Building2 } from "lucide-react"
import { getCurrencySymbol, convertCurrency, getExchangeRates, type ExchangeRates } from "@/lib/currency-utils"

export default function WithdrawPage() {
  const router = useRouter()
  const { user, isLoading, logout, refreshUser } = useAuth()
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [withdrawMethod, setWithdrawMethod] = useState("bank")
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [exchangeRatesError, setExchangeRatesError] = useState<string | null>(null)

  // Withdrawal method specific fields
  const [bankName, setBankName] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [bankRoutingNumber, setBankRoutingNumber] = useState("")
  const [accountHolderName, setAccountHolderName] = useState("")

  const [cryptoWalletAddress, setCryptoWalletAddress] = useState("")

  const [mobileNumber, setMobileNumber] = useState("")
  const [mobileProvider, setMobileProvider] = useState("bkash")

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setExchangeRatesError(null)
        const rates = await getExchangeRates()
        setExchangeRates(rates)
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error)
        setExchangeRatesError("Failed to load exchange rates. Using default rates.")
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
    fetchRates()
  }, [])

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-slate-950 dark:via-purple-950/50 dark:to-blue-950/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Validation functions
  const validateAmount = (amountValue: string, currencyValue: string): string | null => {
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
      USD: 2, EUR: 2, GBP: 2, BDT: 2,
      BTC: 8, ETH: 6, USDT: 2,
    }

    if (maxDecimals[currencyValue] && decimalPlaces > maxDecimals[currencyValue]) {
      return `Maximum ${maxDecimals[currencyValue]} decimal places allowed for ${currencyValue}`
    }

    // Check if amount exceeds available balance
    const userBalance = currencyValue === "ETH"
      ? (user?.realEthBalance ?? 0)
      : (user?.balances?.[currencyValue as keyof typeof user.balances] || 0)

    if (amountNum > userBalance) {
      const balanceFormatted = userBalance.toFixed(currencyValue === "BTC" || currencyValue === "ETH" ? 6 : 2)
      return `Insufficient balance. Available: ${balanceFormatted} ${currencyValue}`
    }

    return null
  }

  const validateWithdrawalFields = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (withdrawMethod === "bank") {
      if (!bankName.trim()) newErrors.bankName = "Bank name is required"
      if (!accountHolderName.trim()) newErrors.accountHolderName = "Account holder name is required"

      if (!bankAccountNumber) {
        newErrors.bankAccountNumber = "Account number is required"
      } else if (bankAccountNumber.length < 8 || bankAccountNumber.length > 34) {
        newErrors.bankAccountNumber = "Account number must be 8-34 digits"
      }
    } else if (withdrawMethod === "crypto") {
      if (!cryptoWalletAddress) {
        newErrors.cryptoWalletAddress = "Wallet address is required"
      } else if (!cryptoWalletAddress.startsWith("0x") || cryptoWalletAddress.length !== 42) {
        newErrors.cryptoWalletAddress = "Invalid Ethereum address (must start with 0x and be 42 chars)"
      }
    } else if (withdrawMethod === "mobile") {
      if (!mobileNumber) {
        newErrors.mobileNumber = "Mobile number is required"
      } else {
        const digitsOnly = mobileNumber.replace(/\D/g, "")
        if (digitsOnly.startsWith("880") && digitsOnly.length !== 13) {
          newErrors.mobileNumber = "Must be 13 digits (e.g., +880...)"
        } else if (digitsOnly.startsWith("01") && digitsOnly.length !== 11) {
          newErrors.mobileNumber = "Must be 11 digits (e.g., 01...)"
        } else if (!digitsOnly.startsWith("880") && !digitsOnly.startsWith("01")) {
          newErrors.mobileNumber = "Invalid format"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setMessageType("")
    setErrors({})

    // Validate amount
    const amountError = validateAmount(amount, currency)
    if (amountError) {
      setMessage(amountError)
      setMessageType("error")
      return
    }

    // Validate method specific fields
    if (!validateWithdrawalFields()) {
      setMessage("Please fill all required fields correctly")
      setMessageType("error")
      return
    }

    setIsProcessing(true)

    try {
      // Construct account details string
      let accountDetails = ""
      if (withdrawMethod === "bank") {
        accountDetails = `Bank: ${bankName}, Account: ${bankAccountNumber}, Holder: ${accountHolderName}`
        if (bankRoutingNumber) accountDetails += `, Routing: ${bankRoutingNumber}`
      } else if (withdrawMethod === "crypto") {
        accountDetails = `Wallet: ${cryptoWalletAddress}`
      } else if (withdrawMethod === "mobile") {
        accountDetails = `${mobileProvider.toUpperCase()}: ${mobileNumber}`
      }

      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/transactions/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          currency,
          withdrawMethod: withdrawMethod === "mobile" ? mobileProvider : withdrawMethod, // Map 'mobile' to specific provider if needed, or keep generic. 
          // Actually, the API expects 'withdrawMethod' string. Let's send the specific method if it's mobile, or just 'mobile'?
          // The previous implementation sent 'bkash', 'nagad', etc. 
          // Let's send the provider name if mobile, otherwise the method name.
          // Wait, the API just logs it or stores it. 
          // Let's send 'mobile_money' or the provider? 
          // To be safe and consistent with previous data, let's send the provider for mobile.
          accountDetails,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to withdraw money")
      }

      const result = await response.json()

      setMessage(`Withdrawal request for ${amount} ${currency} submitted successfully!`)
      setMessageType("success")
      setAmount("")
      // Reset fields
      setBankName("")
      setBankAccountNumber("")
      setBankRoutingNumber("")
      setAccountHolderName("")
      setCryptoWalletAddress("")
      setMobileNumber("")

      await refreshUser()

      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Withdrawal error:", error)
      setMessage(error instanceof Error ? error.message : "Failed to process withdrawal. Please try again.")
      setMessageType("error")
    } finally {
      setIsProcessing(false)
    }
  }

  const getUsdEquivalent = () => {
    if (!amount || !exchangeRates) return 0
    const amountNum = Number.parseFloat(amount)
    if (Number.isNaN(amountNum) || amountNum <= 0) return 0
    return convertCurrency(amountNum, currency, "USD", exchangeRates)
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
                <Minus className="h-3.5 w-3.5" />
                Withdraw Funds
              </div>
              <h1 className="text-[36px] sm:text-[44px] font-semibold leading-tight text-white">
                Withdraw money from your account
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Securely withdraw funds to your preferred method. Support for bank transfers, crypto wallets, and mobile money with real-time exchange rates.
              </p>
            </div>
            <div className="flex flex-row gap-3">
              <BackButton />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="rounded-3xl border border-purple-100 bg-white shadow-xl dark:border-purple-900/40 dark:bg-slate-900">
              <CardHeader className="pb-4 border-b border-purple-100/70 dark:border-purple-800/40">
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-orange-600 dark:text-orange-300" strokeWidth={2.5} />
                  Make a Withdrawal
                </CardTitle>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Choose your withdrawal method and enter the amount to get your funds
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleWithdraw} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Amount</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === "" || (!Number.isNaN(Number.parseFloat(value)) && Number.parseFloat(value) >= 0)) {
                              setAmount(value)
                            }
                          }}
                          placeholder="0.00"
                          step={currency === "BTC" ? "0.00000001" : currency === "ETH" ? "0.000001" : "0.01"}
                          min="0"
                          className="h-12 text-base bg-white dark:bg-slate-800 border-purple-200 dark:border-purple-800/60 text-slate-900 dark:text-white pr-20 font-semibold focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const userBalance = currency === "ETH"
                              ? (user.realEthBalance ?? 0)
                              : (user.balances?.[currency as keyof typeof user.balances] || 0)
                            setAmount(userBalance.toFixed(currency === "BTC" || currency === "ETH" ? 6 : 2))
                          }}
                          disabled={!user || (currency === "ETH" ? !user.realEthBalance || (user.realEthBalance ?? 0) <= 0 : !user.balances?.[currency as keyof typeof user.balances] || (user.balances?.[currency as keyof typeof user.balances] || 0) <= 0)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 px-3 py-1.5 rounded-lg border-2 border-orange-300 dark:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Max
                        </button>
                      </div>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="h-12 px-4 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    {exchangeRates && amount && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <TrendingUp className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        <span>≈ ${getUsdEquivalent().toFixed(2)} USD</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">Withdrawal Method</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawMethod("bank")
                          setErrors({})
                        }}
                        className={`p-5 border-2 rounded-2xl text-left transition-all hover:shadow-lg ${withdrawMethod === "bank"
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-500/20 shadow-lg"
                          : "border-purple-200 dark:border-purple-800/60 hover:border-orange-400 dark:hover:border-orange-500"
                          }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Building2 className={`w-6 h-6 ${withdrawMethod === "bank" ? "text-orange-600 dark:text-orange-400" : "text-purple-600 dark:text-purple-300"}`} strokeWidth={2} />
                          <p className="text-base font-bold text-slate-900 dark:text-white">Bank</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Direct bank transfer</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawMethod("crypto")
                          setErrors({})
                        }}
                        className={`p-5 border-2 rounded-2xl text-left transition-all hover:shadow-lg ${withdrawMethod === "crypto"
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-500/20 shadow-lg"
                          : "border-purple-200 dark:border-purple-800/60 hover:border-orange-400 dark:hover:border-orange-500"
                          }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Zap className={`w-6 h-6 ${withdrawMethod === "crypto" ? "text-orange-600 dark:text-orange-400" : "text-purple-600 dark:text-purple-300"}`} strokeWidth={2} />
                          <p className="text-base font-bold text-slate-900 dark:text-white">Crypto</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Crypto wallet</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawMethod("mobile")
                          setErrors({})
                        }}
                        className={`p-5 border-2 rounded-2xl text-left transition-all hover:shadow-lg ${withdrawMethod === "mobile"
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-500/20 shadow-lg"
                          : "border-purple-200 dark:border-purple-800/60 hover:border-orange-400 dark:hover:border-orange-500"
                          }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Smartphone className={`w-6 h-6 ${withdrawMethod === "mobile" ? "text-orange-600 dark:text-orange-400" : "text-purple-600 dark:text-purple-300"}`} strokeWidth={2} />
                          <p className="text-base font-bold text-slate-900 dark:text-white">Mobile</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Mobile Money</p>
                      </button>
                    </div>
                  </div>

                  {/* Bank Transfer Fields */}
                  {withdrawMethod === "bank" && (
                    <div className="space-y-4 p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-800/40">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        Bank Account Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Account Holder Name</label>
                          <Input
                            type="text"
                            value={accountHolderName}
                            onChange={(e) => {
                              setAccountHolderName(e.target.value)
                              if (errors.accountHolderName) setErrors({ ...errors, accountHolderName: "" })
                            }}
                            placeholder="John Doe"
                            className={`h-11 text-sm bg-white dark:bg-slate-800 border-2 ${errors.accountHolderName ? "border-red-500" : "border-purple-200 dark:border-purple-800/60"
                              } focus:ring-2 focus:ring-orange-500`}
                          />
                          {errors.accountHolderName && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.accountHolderName}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Bank Name</label>
                          <Input
                            type="text"
                            value={bankName}
                            onChange={(e) => {
                              setBankName(e.target.value)
                              if (errors.bankName) setErrors({ ...errors, bankName: "" })
                            }}
                            placeholder="Bank of America"
                            className={`h-11 text-sm bg-white dark:bg-slate-800 border-2 ${errors.bankName ? "border-red-500" : "border-purple-200 dark:border-purple-800/60"
                              } focus:ring-2 focus:ring-orange-500`}
                          />
                          {errors.bankName && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.bankName}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Account Number</label>
                          <Input
                            type="tel"
                            inputMode="numeric"
                            value={bankAccountNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 34)
                              setBankAccountNumber(value)
                              if (errors.bankAccountNumber) setErrors({ ...errors, bankAccountNumber: "" })
                            }}
                            placeholder="1234567890"
                            className={`h-11 text-sm bg-white dark:bg-slate-800 border-2 ${errors.bankAccountNumber ? "border-red-500" : "border-purple-200 dark:border-purple-800/60"
                              } focus:ring-2 focus:ring-orange-500`}
                          />
                          {errors.bankAccountNumber && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.bankAccountNumber}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Routing Number (Optional)</label>
                          <Input
                            type="tel"
                            inputMode="numeric"
                            value={bankRoutingNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 9)
                              setBankRoutingNumber(value)
                            }}
                            placeholder="123456789"
                            className="h-11 text-sm bg-white dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-800/60 focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Crypto Wallet Fields */}
                  {withdrawMethod === "crypto" && (
                    <div className="space-y-4 p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-800/40">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        Crypto Wallet Address
                      </h3>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Ethereum Wallet Address</label>
                        <Input
                          type="text"
                          value={cryptoWalletAddress}
                          onChange={(e) => {
                            let value = e.target.value.trim().toLowerCase()
                            setCryptoWalletAddress(value)
                            if (errors.cryptoWalletAddress) setErrors({ ...errors, cryptoWalletAddress: "" })
                          }}
                          placeholder="0x..."
                          className={`h-11 text-sm bg-white dark:bg-slate-800 border-2 ${errors.cryptoWalletAddress ? "border-red-500" : "border-purple-200 dark:border-purple-800/60"
                            } focus:ring-2 focus:ring-orange-500 font-mono`}
                        />
                        {errors.cryptoWalletAddress && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.cryptoWalletAddress}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Enter the Ethereum wallet address to receive funds</p>
                      </div>
                    </div>
                  )}

                  {/* Mobile Money Fields */}
                  {withdrawMethod === "mobile" && (
                    <div className="space-y-4 p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-800/40">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        Mobile Money Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Provider</label>
                          <select
                            value={mobileProvider}
                            onChange={(e) => setMobileProvider(e.target.value)}
                            className="w-full h-11 px-3 text-sm border-2 border-purple-200 dark:border-purple-800/60 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="bkash">bKash</option>
                            <option value="nagad">Nagad</option>
                            <option value="rocket">Rocket</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mobile Number</label>
                          <Input
                            type="tel"
                            value={mobileNumber}
                            onChange={(e) => {
                              const value = e.target.value
                              setMobileNumber(value)
                              if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: "" })
                            }}
                            placeholder="+880..."
                            className={`h-11 text-sm bg-white dark:bg-slate-800 border-2 ${errors.mobileNumber ? "border-red-500" : "border-purple-200 dark:border-purple-800/60"
                              } focus:ring-2 focus:ring-orange-500`}
                          />
                          {errors.mobileNumber && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.mobileNumber}
                            </p>
                          )}
                        </div>
                      </div>
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
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <p
                        className={
                          messageType === "success"
                            ? "text-green-700 dark:text-green-300 text-sm font-bold"
                            : "text-red-700 dark:text-red-300 text-sm font-bold"
                        }
                      >
                        {message}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isProcessing}
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-base font-bold shadow-lg hover:shadow-xl rounded-2xl h-14"
                  >
                    <Minus className="w-5 h-5 mr-2" />
                    {isProcessing ? "Processing Withdrawal..." : "Withdraw Money"}
                  </Button>
                </form>
              </CardContent>
            </Card>


          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 shadow-xl dark:border-orange-800/60 dark:from-orange-900/20 dark:to-red-900/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" strokeWidth={2.5} />
                  Withdrawal Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Processing Time</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Bank transfers: 1-3 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Fast Withdrawals</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Crypto & mobile money are instant</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Wallet className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Secure Process</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">All transactions are encrypted</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {exchangeRates && (
              <Card className="rounded-3xl border border-purple-100 bg-white shadow-xl dark:border-purple-900/40 dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Available Balance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(["USD", "EUR", "GBP", "BDT", "BTC", "ETH", "USDT"] as const).map((curr) => (
                    <div key={curr} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800/40">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 dark:from-orange-600 dark:to-red-700 flex items-center justify-center text-xs font-bold text-white shadow-md">
                          {curr}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{curr}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {getCurrencySymbol(curr)}
                        {curr === "ETH"
                          ? (user.realEthBalance ?? 0).toFixed(6)
                          : (user.balances?.[curr as keyof typeof user.balances] || 0).toFixed(curr === "BTC" ? 6 : 2)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
