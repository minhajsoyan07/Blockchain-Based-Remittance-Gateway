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
import { Plus, CreditCard, Wallet, TrendingUp, Zap, Shield, AlertCircle, CheckCircle } from "lucide-react"
import { getCurrencySymbol, getExchangeRates, convertCurrency, type ExchangeRates, DEFAULT_RATES } from "@/lib/currency-utils"

export default function AddMoneyPage() {
  const router = useRouter()
  const { user, isLoading, logout, refreshUser } = useAuth()
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "">("")
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)

  // Payment method specific fields
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCVV, setCardCVV] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [bankAccountNumber, setBankAccountNumber] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankRoutingNumber, setBankRoutingNumber] = useState("")
  const [accountHolderName, setAccountHolderName] = useState("")
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState("")
  const [transactionPurpose, setTransactionPurpose] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const rates = await getExchangeRates()
        setExchangeRates(rates)
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error)
        // Set fallback rates so the page still functions
        setExchangeRates(DEFAULT_RATES)
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

    // Minimum amount check
    const minAmounts: Record<string, number> = {
      USD: 10,
      EUR: 10,
      GBP: 10,
      BDT: 100,
      BTC: 0.00001,
      ETH: 0.001,
      USDT: 10,
    }

    if (minAmounts[currencyValue] && amountNum < minAmounts[currencyValue]) {
      return `Minimum amount is ${minAmounts[currencyValue]} ${currencyValue}`
    }

    // Check for maximum limits (prevent extremely large amounts)
    const maxAmounts: Record<string, number> = {
      USD: 1000000,
      EUR: 1000000,
      GBP: 1000000,
      BDT: 100000000,
      BTC: 1000,
      ETH: 10000,
      USDT: 1000000,
    }

    if (maxAmounts[currencyValue] && amountNum > maxAmounts[currencyValue]) {
      return `Maximum amount allowed is ${maxAmounts[currencyValue].toLocaleString()} ${currencyValue}`
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
  }

  const validateCardNumber = (cardNum: string): string | null => {
    const cleaned = cardNum.replace(/\s/g, "")
    if (!cleaned) return "Card number is required"
    if (!/^\d{13,19}$/.test(cleaned)) return "Card number must be 13-19 digits"
    return null
  }

  const validateCardExpiry = (expiry: string): string | null => {
    if (!expiry) return "Expiry date is required"
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/
    if (!regex.test(expiry)) return "Use format MM/YY"

    const [month, year] = expiry.split("/")
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1)
    const now = new Date()
    if (expiryDate < now) return "Card has expired"
    return null
  }

  const validateCVV = (cvv: string): string | null => {
    if (!cvv) return "CVV is required"
    if (!/^\d{3,4}$/.test(cvv)) return "CVV must be 3 or 4 digits"
    return null
  }

  const validateBankAccount = (account: string): string | null => {
    if (!account) return "Bank account number is required"
    const digitsOnly = account.replace(/\D/g, "")
    if (digitsOnly.length < 8 || digitsOnly.length > 34) {
      return "Bank account must be 8-34 digits"
    }
    return null
  }

  const validateCryptoWallet = (wallet: string): string | null => {
    if (!wallet) return "Wallet address is required"
    const cleaned = wallet.trim().toLowerCase()
    if (!cleaned.startsWith("0x") || cleaned.length !== 42) {
      return "Invalid wallet address (must start with 0x and be 42 characters)"
    }
    if (!/^0x[a-f0-9]{40}$/.test(cleaned)) {
      return "Invalid wallet address format"
    }
    return null
  }

  const validatePaymentMethodFields = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (paymentMethod === "card") {
      const cardNumError = validateCardNumber(cardNumber)
      if (cardNumError) newErrors.cardNumber = cardNumError

      const expiryError = validateCardExpiry(cardExpiry)
      if (expiryError) newErrors.cardExpiry = expiryError

      const cvvError = validateCVV(cardCVV)
      if (cvvError) newErrors.cardCVV = cvvError

      if (!cardholderName.trim()) newErrors.cardholderName = "Cardholder name is required"
    } else if (paymentMethod === "bank") {
      const accountError = validateBankAccount(bankAccountNumber)
      if (accountError) newErrors.bankAccountNumber = accountError

      if (!bankName.trim()) newErrors.bankName = "Bank name is required"
      if (!accountHolderName.trim()) newErrors.accountHolderName = "Account holder name is required"
    } else if (paymentMethod === "crypto") {
      const walletError = validateCryptoWallet(cryptoWalletAddress)
      if (walletError) newErrors.cryptoWalletAddress = walletError
    }

    if (!transactionPurpose.trim()) {
      newErrors.transactionPurpose = "Transaction purpose is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddMoney = async (e: React.FormEvent) => {
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

    // Validate payment method specific fields
    if (!validatePaymentMethodFields()) {
      setMessage("Please fill all required fields correctly")
      setMessageType("error")
      return
    }

    setIsProcessing(true)

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/transactions/add-money", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          currency,
          paymentMethod,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add money")
      }

      const result = await response.json()

      setMessage(`Successfully added ${amount} ${currency} to your account!`)
      setMessageType("success")
      setAmount("")

      await refreshUser()

      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Payment processing error:", error)
      setMessage(error instanceof Error ? error.message : "Failed to add money. Please try again.")
      setMessageType("error")
    } finally {
      setIsProcessing(false)
    }
  }

  // ============================================================================
  // Logout Handler
  // ============================================================================
  /**
   * Handles user logout with safe navigation
   */
  const handleLogout = () => {
    // Clear storage and navigate immediately without triggering React state updates
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("auth_token")
        window.location.href = "/"
      } catch (error) {
        window.location.href = "/"
      }
    }
  }

  const getUsdEquivalent = () => {
    if (!amount || !exchangeRates) return 0
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum)) return 0

    return convertCurrency(amountNum, currency, "USD", exchangeRates)
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <OliveHeader />
        {/* Page Header */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-900 dark:text-white overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                <Plus className="h-3.5 w-3.5" />
                Deposit Funds
              </div>
              <h1 className="text-3xl font-bold leading-tight">
                Add money to your account
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Securely deposit funds using multiple payment methods.
              </p>
            </div>
            <div className="flex flex-row gap-3">
              <BackButton />
            </div>
          </div>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-500" strokeWidth={2.5} />
                  Make a Deposit
                </CardTitle>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Choose your payment method and enter the amount
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddMoney} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Amount</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          const value = e.target.value
                          // Strictly prevent negative values
                          if (value === "") {
                            setAmount("")
                            return
                          }
                          const parsed = parseFloat(value)
                          if (!isNaN(parsed) && parsed >= 0) {
                            setAmount(value)
                          }
                        }}
                        onKeyDown={(e) => {
                          // Prevent entering minus sign
                          if (e.key === "-" || e.key === "e") {
                            e.preventDefault()
                          }
                        }}
                        placeholder="0.00"
                        step={currency === "BTC" ? "0.00000001" : currency === "ETH" ? "0.000001" : "0.01"}
                        min="0"
                        className="h-12 text-base bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pr-24 font-semibold focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        required
                      />
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 px-3 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        <span>≈ ${getUsdEquivalent().toFixed(2)} USD</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">Payment Method</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("card")
                          setErrors({})
                          setCardNumber("")
                          setCardExpiry("")
                          setCardCVV("")
                          setCardholderName("")
                        }}
                        className={`p-5 border rounded-xl text-left transition-all hover:shadow-sm ${paymentMethod === "card"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
                          }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <CreditCard className={`w-6 h-6 ${paymentMethod === "card" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} strokeWidth={2} />
                          <p className="text-base font-bold text-slate-900 dark:text-white">Card</p>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Credit/Debit card</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("bank")
                          setErrors({})
                          setBankAccountNumber("")
                          setBankName("")
                          setBankRoutingNumber("")
                          setAccountHolderName("")
                        }}
                        className={`p-5 border rounded-xl text-left transition-all hover:shadow-sm ${paymentMethod === "bank"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
                          }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Wallet className={`w-6 h-6 ${paymentMethod === "bank" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} strokeWidth={2} />
                          <p className="text-base font-bold text-slate-900 dark:text-white">Bank</p>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Bank transfer</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("crypto")
                          setErrors({})
                          setCryptoWalletAddress("")
                        }}
                        className={`p-5 border rounded-xl text-left transition-all hover:shadow-sm ${paymentMethod === "crypto"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
                          }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Zap className={`w-6 h-6 ${paymentMethod === "crypto" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} strokeWidth={2} />
                          <p className="text-base font-bold text-slate-900 dark:text-white">Crypto</p>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Cryptocurrency</p>
                      </button>
                    </div>
                  </div>

                  {/* Card Payment Fields */}
                  {paymentMethod === "card" && (
                    <div className="space-y-4 p-4 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800/40">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                        Card Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Card Number</label>
                          <Input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 19)
                              setCardNumber(value.replace(/(.{4})/g, "$1 ").trim())
                              if (errors.cardNumber) setErrors({ ...errors, cardNumber: "" })
                            }}
                            placeholder="1234 5678 9012 3456"
                            className={`h-11 text-sm bg-white dark:bg-slate-800 border-2 ${errors.cardNumber ? "border-red-500" : "border-purple-200 dark:border-purple-800/60"
                              } focus:ring-2 focus:ring-green-500`}
                          />
                          {errors.cardNumber && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.cardNumber}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Expiry Date (MM/YY)</label>
                          <Input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, "").slice(0, 4)
                              if (value.length >= 2) value = value.slice(0, 2) + "/" + value.slice(2)
                              setCardExpiry(value)
                              if (errors.cardExpiry) setErrors({ ...errors, cardExpiry: "" })
                            }}
                            placeholder="MM/YY"
                            maxLength={5}
                            className={`h-11 text-sm bg-white dark:bg-slate-800 border-2 ${errors.cardExpiry ? "border-red-500" : "border-purple-200 dark:border-purple-800/60"
                              } focus:ring-2 focus:ring-green-500`}
                          />
                          {errors.cardExpiry && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.cardExpiry}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">CVV</label>
                          <Input
                            type="text"
                            value={cardCVV}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                              setCardCVV(value)
                              if (errors.cardCVV) setErrors({ ...errors, cardCVV: "" })
                            }}
                            placeholder="123"
                            maxLength={4}
                            className={`h-11 text-sm bg-white dark:bg-slate-800 border-2 ${errors.cardCVV ? "border-red-500" : "border-purple-200 dark:border-purple-800/60"
                              } focus:ring-2 focus:ring-green-500`}
                          />
                          {errors.cardCVV && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.cardCVV}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Cardholder Name</label>
                          <Input
                            type="text"
                            value={cardholderName}
                            onChange={(e) => {
                              setCardholderName(e.target.value)
                              if (errors.cardholderName) setErrors({ ...errors, cardholderName: "" })
                            }}
                            placeholder="John Doe"
                            className={`h-11 text-sm bg-white dark:bg-slate-800 border-2 ${errors.cardholderName ? "border-red-500" : "border-purple-200 dark:border-purple-800/60"
                              } focus:ring-2 focus:ring-green-500`}
                          />
                          {errors.cardholderName && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {errors.cardholderName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Fields */}
                  {paymentMethod === "bank" && (
                    <div className="space-y-4 p-4 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800/40">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
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
                              } focus:ring-2 focus:ring-green-500`}
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
                              } focus:ring-2 focus:ring-green-500`}
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
                              // Only allow digits, no text or symbols
                              const value = e.target.value.replace(/\D/g, "").slice(0, 34)
                              setBankAccountNumber(value)
                              if (errors.bankAccountNumber) setErrors({ ...errors, bankAccountNumber: "" })
                            }}
                            onPaste={(e) => {
                              e.preventDefault()
                              const pastedText = e.clipboardData.getData("text")
                              // Only allow digits from pasted text
                              const digitsOnly = pastedText.replace(/\D/g, "").slice(0, 34)
                              setBankAccountNumber(digitsOnly)
                              if (errors.bankAccountNumber) setErrors({ ...errors, bankAccountNumber: "" })
                            }}
                            placeholder="1234567890"
                            className={`h-11 text-sm bg-white dark:bg-slate-800 border-2 ${errors.bankAccountNumber ? "border-red-500" : "border-purple-200 dark:border-purple-800/60"
                              } focus:ring-2 focus:ring-green-500`}
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
                              // Only allow digits
                              const value = e.target.value.replace(/\D/g, "").slice(0, 9)
                              setBankRoutingNumber(value)
                            }}
                            onPaste={(e) => {
                              e.preventDefault()
                              const pastedText = e.clipboardData.getData("text")
                              const digitsOnly = pastedText.replace(/\D/g, "").slice(0, 9)
                              setBankRoutingNumber(digitsOnly)
                            }}
                            placeholder="123456789"
                            className="h-11 text-sm bg-white dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-800/60 focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Crypto Wallet Fields */}
                  {paymentMethod === "crypto" && (
                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                          className={`h-11 text-sm bg-white dark:bg-slate-900 border ${errors.cryptoWalletAddress ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                            } focus:ring-2 focus:ring-blue-500 font-mono`}
                        />
                        {errors.cryptoWalletAddress && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.cryptoWalletAddress}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Enter the Ethereum wallet address to send from</p>
                      </div>
                    </div>
                  )}

                  {/* Transaction Purpose */}
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Transaction Purpose</label>
                    <select
                      value={transactionPurpose}
                      onChange={(e) => {
                        setTransactionPurpose(e.target.value)
                        if (errors.transactionPurpose) setErrors({ ...errors, transactionPurpose: "" })
                      }}
                      className={`h-12 w-full px-3 text-sm border-2 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.transactionPurpose ? "border-red-500" : "border-purple-200 dark:border-purple-800/60"
                        }`}
                    >
                      <option value="">Select purpose</option>
                      <option value="Personal">Personal Use</option>
                      <option value="Business">Business Payment</option>
                      <option value="Investment">Investment</option>
                      <option value="Remittance">Remittance</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.transactionPurpose && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.transactionPurpose}
                      </p>
                    )}
                  </div>

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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base font-bold shadow-sm hover:shadow-md rounded-xl h-12"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {isProcessing ? "Processing Payment..." : "Add Money"}
                  </Button>
                </form>
              </CardContent>
            </Card>


          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl dark:border-green-800/60 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Encrypted Transactions</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">All deposits are secured with end-to-end encryption</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Instant Processing</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Funds are available immediately after deposit</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Best Rates</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Competitive exchange rates for all currencies</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {exchangeRates && (
              <Card className="rounded-3xl border border-purple-100 bg-white shadow-xl dark:border-purple-900/40 dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Current Balance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(["USD", "EUR", "GBP", "BDT", "BTC", "ETH", "USDT"] as const).map((curr) => (
                    <div key={curr} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800/40">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-600 dark:to-emerald-700 flex items-center justify-center text-xs font-bold text-white shadow-md">
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
