/**
 * Dashboard Page Component - Redesigned
 * 
 * Professional UI with:
 * - Three-dot menu replacing navbar
 * - BTC/ETH/USDT prominently displayed
 * - Optimized spacing and layout
 * - SolaimanLipi font for ৳ symbol
 * 
 * @module app/dashboard/page
 */

"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTransactions } from "@/hooks/use-transactions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MetaMaskButton } from "@/components/metamask-button"
import { RemittancePayContact } from "@/components/remittancepay-contact"
import { OliveHeader } from "@/components/olive-header"
import {
  Send,
  History,
  Settings,
  Wallet,
  TrendingUp,
  Plus,
  Minus,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  LogOut,
  RefreshCw,
  Loader2,
  Check,
  Lock as LockIcon,
  Trash2,
  Coins,
} from "lucide-react"
import Link from "next/link"
import { getExchangeRates, convertCurrency, getCurrencySymbol, type ExchangeRates } from "@/lib/currency-utils"
import { getEthBalance, setPreventAutoReconnect, formatAddress } from "@/lib/metamask-utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const DashboardPerformanceChart = dynamic(
  () => import("@/components/dashboard-performance-chart").then((mod) => mod.DashboardPerformanceChart),
  {
    ssr: false,
    loading: () => (
      <Card className="border border-border bg-card rounded-xl shadow-lg">
        <CardHeader className="pb-0 space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
        <CardContent className="pt-4">
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    ),
  },
)

import { DashboardMoneyFlow } from "@/components/dashboard-money-flow"
import { DebugWallet } from "@/components/debug-wallet"

const getInitials = (name: string) => {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function Dashboard() {
  const router = useRouter()
  const { user, isLoading, logout, updateRealEthBalance, refreshUserData, connectWallet, removeWallet } = useAuth()
  const { transactions, fetchTransactions } = useTransactions()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Wallet Management State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)
  const [walletPassword, setWalletPassword] = useState("")
  const [helperText, setHelperText] = useState("")
  const [pendingAddress, setPendingAddress] = useState<string | null>(null)
  const [removalWalletId, setRemovalWalletId] = useState<string | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [copied, setCopied] = useState(false)

  const [selectedCurrency, setSelectedCurrency] = useState("USD")
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Initialize from user context to prevent "flash of zero"
  const [metamaskBalance, setMetamaskBalance] = useState<string>(
    user?.realEthBalance !== undefined ? Math.max(0, user.realEthBalance).toString() : "0"
  )
  const balanceRefreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    let isActive = true
    const initializeRates = async () => {
      try {
        const rates = await getExchangeRates()
        if (isActive) {
          setExchangeRates(rates)
        }
      } catch (error) {
        console.error("[dashboard] Failed to initialize exchange rates", error)
      }
    }
    initializeRates()
    return () => {
      isActive = false
    }
  }, [])

  const fetchMetaMaskBalance = useCallback(async () => {
    if (!user?.walletAddress ||
      typeof user.walletAddress !== "string" ||
      user.walletAddress.trim() === "") {
      setMetamaskBalance("0")
      return
    }
    try {
      const balance = await getEthBalance(user.walletAddress)

      // If balance fetch failed (null), keep existing balance
      if (balance === null) return

      setMetamaskBalance(balance)
      const newBalance = Math.max(0, Number.parseFloat(balance))
      if (user.realEthBalance !== newBalance) {
        updateRealEthBalance(newBalance)
      }
    } catch (error) {
      console.error("Failed to fetch MetaMask balance:", error)
      // Do NOT set to 0 on error, keep previous state
    }
  }, [user?.walletAddress, user?.realEthBalance, updateRealEthBalance])

  useEffect(() => {
    const walletAddress = user?.walletAddress

    if (!walletAddress || typeof walletAddress !== "string" || walletAddress.trim() === "") {
      setMetamaskBalance("0")
      if (user?.realEthBalance !== undefined && user.realEthBalance > 0) {
        updateRealEthBalance(0)
      }

      if (balanceRefreshIntervalRef.current) {
        clearInterval(balanceRefreshIntervalRef.current)
        balanceRefreshIntervalRef.current = null
      }
      return
    }

    const fetchBalance = async () => {
      try {
        const balance = await getEthBalance(walletAddress)

        // If balance fetch failed (null), keep existing balance
        if (balance === null) return

        setMetamaskBalance(balance)
        const newBalance = Math.max(0, Number.parseFloat(balance))
        updateRealEthBalance(newBalance)
      } catch (error) {
        console.error("Failed to fetch MetaMask balance:", error)
        // Do NOT set to 0 on error, keep previous state
      }
    }

    fetchBalance()

    const interval = setInterval(() => {
      fetchBalance()
    }, 30000) // Changed from 10000ms to 30000ms (30 seconds)

    balanceRefreshIntervalRef.current = interval

    return () => {
      if (balanceRefreshIntervalRef.current) {
        clearInterval(balanceRefreshIntervalRef.current)
        balanceRefreshIntervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.walletAddress])

  const fetchExchangeRates = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const rates = await getExchangeRates()
      setExchangeRates(rates)
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Wallet Functions
  const handleConnectNewWallet = async () => {
    setIsConnectingWallet(true)
    setHelperText("")
    try {
      const ethereum = (window as any).ethereum
      if (!ethereum || !ethereum.isMetaMask) {
        toast.error("MetaMask is not installed")
        window.open("https://metamask.io", "_blank")
        return
      }

      // 1. Force account selection (Request permissions to open MetaMask modal)
      let accounts: string[] = []
      try {
        // This forces MetaMask to show the account picker
        await ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }]
        })

        // After permission is granted/updated, get the accounts
        accounts = await ethereum.request({ method: "eth_requestAccounts" })
      } catch (err: any) {
        if (err?.code === 4001) {
          // User rejected the request
          setIsConnectingWallet(false)
          return
        }
        // Fallback for wallets that strictly might not support wallet_requestPermissions
        console.warn("wallet_requestPermissions failed, falling back to requestAccounts", err)
        accounts = await ethereum.request({ method: "eth_requestAccounts" })
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found")
      }
      const address = accounts[0]

      // 2. Try to connect (might require password)
      let retries = 2
      while (retries > 0) {
        try {
          // Attempt connection (without password first)
          await connectWallet(address)

          toast.success("Wallet connected successfully")
          // Clear any prevent flag
          setPreventAutoReconnect(false)
          break
        } catch (connectError: any) {
          const errorMsg = connectError?.message || ""
          const errorString = String(connectError)

          const isPasswordRequired =
            errorMsg.toLowerCase().includes("password required") ||
            errorString.toLowerCase().includes("password required") ||
            (connectError?.code === "SETUP_PASSWORD_REQUIRED")

          if (isPasswordRequired) {
            // Open password modal
            setPendingAddress(address)
            setWalletPassword("")
            setHelperText("To secure your wallet for the first time, please set a security password.")
            setIsPasswordModalOpen(true)
            return // Exit function, wait for password submit
          }

          retries--
          if (retries === 0) throw connectError
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } catch (error: unknown) {
      console.error("Wallet connection error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to connect wallet")
    } finally {
      setIsConnectingWallet(false)
    }
  }

  const handlePasswordSubmit = async () => {
    if (!walletPassword || walletPassword.length < 4) {
      setHelperText("Password must be at least 4 characters")
      return
    }

    // Handle Removal Verification
    if (removalWalletId) {
      setIsRemoving(true)
      setHelperText("")
      try {
        await removeWallet(removalWalletId, walletPassword)
        toast.success("Wallet removed successfully")
        setIsPasswordModalOpen(false)
        setRemovalWalletId(null)
        setWalletPassword("")

        // Refresh data
        await refreshUserData()
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to remove wallet";
        if (msg.toLowerCase().includes("password")) {
          setHelperText("Incorrect security password")
        } else {
          console.error("Removal error:", error)
          toast.error(msg)
          setHelperText(msg)
        }
      } finally {
        setIsRemoving(false)
      }
      return
    }

    if (!pendingAddress) {
      setIsPasswordModalOpen(false)
      return
    }

    setIsConnectingWallet(true)
    setHelperText("")

    try {
      await connectWallet(pendingAddress, undefined, undefined, undefined, walletPassword)

      toast.success("Wallet connected successfully")
      setIsPasswordModalOpen(false)
      setPreventAutoReconnect(false)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to connect"
      setHelperText(msg)
      toast.error(msg)
    } finally {
      setIsConnectingWallet(false)
      setPendingAddress(null)
    }
  }

  const handleRemoveWalletAction = async () => {
    if (!user?.walletAddress) return

    // Find the wallet ID
    const currentWallet = user.wallets?.find(w =>
      w.address.toLowerCase() === user.walletAddress?.toLowerCase()
    )

    // Check if security password is required - REMOVED for easier UX
    // if (user?.hasWalletSecurityPassword) {
    //   setRemovalWalletId(currentWallet?.id || "fallback_id")
    //   setWalletPassword("")
    //   setHelperText("Please enter your wallet security password to confirm removal.")
    //   setIsPasswordModalOpen(true)
    //   return
    // }

    if (!confirm("Are you sure you want to remove this wallet?")) return

    // Set prevent flag immediately to stop auto-reconnect
    setPreventAutoReconnect(true)
    setIsRemoving(true)

    try {
      if (currentWallet?.id) {
        await removeWallet(currentWallet.id)
      } else {
        // Fallback if no ID found but user has address (shouldn't happen often)
        await removeWallet("fallback_id")
      }
      toast.success("Wallet removed successfully")
      await refreshUserData()
    } catch (error) {
      toast.error("Failed to remove wallet")
      // Keep flag true just in case
      setPreventAutoReconnect(true)
    } finally {
      setIsRemoving(false)
    }
  }

  const handleCopyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const totalPortfolioUSD = useMemo(() => {
    if (!exchangeRates) return 0

    const hasWallet = user?.walletAddress &&
      typeof user.walletAddress === "string" &&
      user.walletAddress.trim() !== ""
    const ethBalance = hasWallet ? (user?.realEthBalance ?? 0) : 0
    const usdBalance = user?.balances?.USD || 0
    const eurBalance = user?.balances?.EUR || 0
    const gbpBalance = user?.balances?.GBP || 0
    const bdtBalance = user?.balances?.BDT || 0
    const btcBalance = user?.balances?.BTC || 0
    const usdtBalance = user?.balances?.USDT || 0

    return (
      usdBalance +
      convertCurrency(eurBalance, "EUR", "USD", exchangeRates) +
      convertCurrency(gbpBalance, "GBP", "USD", exchangeRates) +
      convertCurrency(bdtBalance, "BDT", "USD", exchangeRates) +
      convertCurrency(btcBalance, "BTC", "USD", exchangeRates) +
      convertCurrency(ethBalance, "ETH", "USD", exchangeRates) +
      convertCurrency(usdtBalance, "USDT", "USD", exchangeRates)
    )
  }, [
    exchangeRates,
    user?.balances?.USD,
    user?.balances?.EUR,
    user?.balances?.GBP,
    user?.balances?.BDT,
    user?.balances?.BTC,
    user?.balances?.ETH,
    user?.balances?.USDT,
    user?.realEthBalance,
    user?.walletAddress,
  ])

  const totalBalance = useMemo(() => {
    if (!exchangeRates) return 0
    return convertCurrency(totalPortfolioUSD, "USD", selectedCurrency, exchangeRates)
  }, [exchangeRates, selectedCurrency, totalPortfolioUSD])

  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 2)
  }, [transactions])

  const completedTransactions = useMemo(
    () => transactions.filter((tx) => tx.status === "completed"),
    [transactions],
  )

  const { chartData, chartTotalUsd } = useMemo(() => {
    if (!exchangeRates) {
      return { chartData: [], chartTotalUsd: 0 }
    }

    const now = new Date()
    const summary = new Map<string, number>()

    completedTransactions.forEach((tx) => {
      const date = new Date(tx.timestamp)
      const monthsDifference = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
      if (monthsDifference < 0 || monthsDifference >= 5) {
        return
      }

      const year = date.getFullYear()
      const month = date.getMonth()
      const key = `${year}-${month}`
      const usdAmount = convertCurrency(tx.amount, tx.currency, "USD", exchangeRates)
      if (!isNaN(usdAmount) && isFinite(usdAmount) && usdAmount > 0) {
        summary.set(key, (summary.get(key) || 0) + usdAmount)
      }
    })

    const months: { label: string; subtitle: string; barValue: number; lineValue: number; date: string }[] = []
    for (let i = 4; i >= 0; i--) {
      const target = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = target.getFullYear()
      const month = target.getMonth()
      const key = `${year}-${month}`
      const value = summary.get(key) || 0
      const formattedValue = Number(value.toFixed(2))
      const subtitle = target.toLocaleString("en-US", { month: "short" })
      months.push({
        label: `${subtitle} ${year}`,
        subtitle,
        barValue: formattedValue,
        lineValue: formattedValue,
        date: target.toISOString(),
      })
    }

    const totalUsd = months.reduce((sum, item) => sum + item.barValue, 0)

    return { chartData: months, chartTotalUsd: totalUsd }
  }, [completedTransactions, exchangeRates])

  const formatTimeAgo = useCallback((timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }, [])

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true })
  }, [])

  const handleLogout = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("auth_token")
        window.location.href = "/"
      } catch (error) {
        window.location.href = "/"
      }
    }
  }, [])

  const handleRefresh = useCallback(() => {
    fetchExchangeRates()
    fetchMetaMaskBalance()
    fetchTransactions(true)
  }, [fetchExchangeRates, fetchMetaMaskBalance, fetchTransactions])

  useEffect(() => {
    fetchExchangeRates()
    const interval = setInterval(fetchExchangeRates, 30000) // Changed from 5000ms to 30000ms (30 seconds)
    return () => clearInterval(interval)
  }, [fetchExchangeRates])

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const firstName = user.fullName?.split(" ")[0] ?? user.fullName;

  // Calculate crypto balances in USD
  const btcBalanceUSD = exchangeRates ? convertCurrency(user?.balances?.BTC || 0, "BTC", "USD", exchangeRates) : 0
  const ethBalanceUSD = exchangeRates ? convertCurrency(user?.realEthBalance ?? 0, "ETH", "USD", exchangeRates) : 0
  const usdtBalanceUSD = exchangeRates ? convertCurrency(user?.balances?.USDT || 0, "USDT", "USD", exchangeRates) : 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DebugWallet />
        <OliveHeader />
        {/* Profile Section - Purple Cover Style */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-purple-700 to-indigo-700 text-white overflow-hidden">
          <CardContent className="p-0">
            <div className="px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24 border-4 border-slate-50 dark:border-slate-800 shadow-lg">
                    <AvatarImage src={user?.profilePhoto || "/placeholder.svg"} alt={user?.fullName} className="object-cover" />
                    <AvatarFallback className="bg-blue-600 text-white text-3xl font-bold">
                      {getInitials(user?.fullName || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">{user?.fullName}</h2>
                    <div className="flex flex-col gap-1 text-sm text-purple-100">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-purple-200">Email:</span>
                        <span>{user?.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-purple-200">Wallet:</span>
                        <span className="font-mono bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white border border-white/20">
                          {user?.walletAddress ? formatAddress(user.walletAddress) : "Not Connected"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Main Balance Card - Solid Professional Blue */}
            <Card className="overflow-hidden border-0 shadow-lg rounded-2xl relative bg-blue-600 text-white">
              <CardContent className="p-6 relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 font-medium mb-1 flex items-center gap-2">
                      Total Balance
                    </p>
                    <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
                      {selectedCurrency === "BDT" ? (
                        <span className="taka-symbol font-bold mr-2">{getCurrencySymbol(selectedCurrency)}</span>
                      ) : (
                        getCurrencySymbol(selectedCurrency)
                      )}
                      {convertCurrency(totalPortfolioUSD, "USD", selectedCurrency, exchangeRates || undefined).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Crypto Balances Section */}
                <div className="space-y-3 border-t border-white/20 pt-4">
                  <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Cryptocurrency</p>
                  <div className="space-y-2">
                    {/* BTC */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-white font-bold">₿</span>
                        </div>
                        <div>
                          <p className="text-xs text-blue-100 font-semibold">Bitcoin</p>
                          <p className="text-sm font-bold">{(user?.balances?.BTC || 0).toFixed(6)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-100">≈ ${btcBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {/* ETH */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-white font-bold">Ξ</span>
                        </div>
                        <div>
                          <p className="text-xs text-blue-100 font-semibold">Ethereum</p>
                          <p className="text-sm font-bold">{(user?.realEthBalance ?? 0).toFixed(4)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-100">≈ ${ethBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {/* USDT */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-white font-bold">₮</span>
                        </div>
                        <div>
                          <p className="text-xs text-blue-100 font-semibold">Tether</p>
                          <p className="text-sm font-bold">{(user?.balances?.USDT || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-100">≈ ${usdtBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                    <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold mb-1">Income</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-300" />
                      <span className="text-lg font-bold">
                        {selectedCurrency === "BDT" ? (
                          <span className="taka-symbol font-bold mr-1">{getCurrencySymbol(selectedCurrency)}</span>
                        ) : (
                          getCurrencySymbol(selectedCurrency)
                        )}
                        {convertCurrency(0, "USD", selectedCurrency, exchangeRates || undefined).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                    <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold mb-1">Expense</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-300 rotate-180" />
                      <span className="text-lg font-bold">
                        {selectedCurrency === "BDT" ? (
                          <span className="taka-symbol font-bold mr-1">{getCurrencySymbol(selectedCurrency)}</span>
                        ) : (
                          getCurrencySymbol(selectedCurrency)
                        )}
                        {convertCurrency(completedTransactions.reduce((sum, tx) => {
                          const usdAmount = exchangeRates ? convertCurrency(tx.amount, tx.currency, "USD", exchangeRates) : 0
                          return sum + usdAmount
                        }, 0), "USD", selectedCurrency, exchangeRates || undefined).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Select Currency</p>
                  <div className="flex flex-wrap gap-2">
                    {["USD", "EUR", "GBP", "BDT"].map((curr) => (
                      <button
                        key={curr}
                        onClick={() => setSelectedCurrency(curr)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedCurrency === curr
                          ? "bg-white text-blue-600 shadow-sm"
                          : "bg-white/10 text-white hover:bg-white/20"
                          } `}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>





            {/* Recent Transactions */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" />
                    Recent Activity
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20" asChild>
                    <Link href="/transactions">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentTransactions.slice(0, 5).map((tx) => {
                    // Logic to determine transaction details
                    let type = "Transfer";
                    let recipient = tx.toAddress;
                    let Icon = ArrowLeftRight;
                    let amountColor = "text-slate-900 dark:text-white";
                    let iconBg = "bg-slate-100 dark:bg-slate-800";
                    let iconColor = "text-slate-600 dark:text-slate-400";
                    let amountPrefix = "";

                    const isDeposit = tx.toAddress === "System" || tx.description?.toLowerCase().includes("deposit");
                    const isWithdrawal = tx.description?.toLowerCase().includes("withdraw");

                    if (isDeposit) {
                      type = "Deposit";
                      recipient = "RemittancePay Wallet";
                      Icon = ArrowDownLeft;
                      amountColor = "text-green-600 dark:text-green-400";
                      iconBg = "bg-green-100 dark:bg-green-900/30";
                      iconColor = "text-green-600 dark:text-green-400";
                      amountPrefix = "+";
                    } else if (isWithdrawal) {
                      type = "Withdrawal";
                      // Try to parse details from metadata or description
                      if (tx.metadata?.details) {
                        const details = tx.metadata.details;
                        if (details.includes("Bank:")) recipient = details.split(",")[0];
                        else if (details.includes("Wallet:")) recipient = `${details.split("Wallet: ")[1].substring(0, 6)}...${details.split("Wallet: ")[1].substring(38)}`;
                        else recipient = "External Account";
                      } else {
                        recipient = "External Account";
                      }
                      Icon = ArrowUpRight;
                      amountColor = "text-slate-900 dark:text-white";
                      iconBg = "bg-orange-100 dark:bg-orange-900/30";
                      iconColor = "text-orange-600 dark:text-orange-400";
                      amountPrefix = "-";
                    } else if (user?.walletAddress && tx.toAddress.toLowerCase() === user.walletAddress.toLowerCase()) {
                      // Incoming Transfer (Received)
                      type = "Received";
                      recipient = "From: " + (tx.fromUserId || "External Wallet");
                      Icon = ArrowDownLeft;
                      amountColor = "text-emerald-600 dark:text-emerald-400";
                      iconBg = "bg-emerald-100 dark:bg-emerald-900/30";
                      iconColor = "text-emerald-600 dark:text-emerald-400";
                      amountPrefix = "+";
                    } else {
                      // Standard Transfer
                      type = "Sent";
                      if (tx.toAddress.startsWith("0x")) {
                        recipient = `${tx.toAddress.substring(0, 6)}...${tx.toAddress.substring(tx.toAddress.length - 4)}`;
                      }
                      Icon = ArrowUpRight;
                      amountColor = "text-slate-900 dark:text-white";
                      iconBg = "bg-blue-100 dark:bg-blue-900/30";
                      iconColor = "text-blue-600 dark:text-blue-400";
                      amountPrefix = "-";
                    }

                    return (
                      <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${iconBg} ${iconColor}`}>
                            <Icon className="w-6 h-6" strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-base">{type}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              {new Date(tx.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              <span className="mx-1">•</span>
                              {new Date(tx.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                              <span className="mx-1">•</span>
                              {recipient}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-base ${amountColor}`}>
                            {amountPrefix}{Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {tx.currency}
                          </p>
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${tx.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              tx.status === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {recentTransactions.length === 0 && (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No recent transactions found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>



            <RemittancePayContact />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Send", icon: Send, href: "/send", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", hover: "hover:shadow-purple-200/50 dark:hover:shadow-purple-900/20" },
                { label: "Add Money", icon: Plus, href: "/add-money", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", hover: "hover:shadow-purple-200/50 dark:hover:shadow-purple-900/20" },
                { label: "Withdraw", icon: Minus, href: "/withdraw", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", hover: "hover:shadow-purple-200/50 dark:hover:shadow-purple-900/20" },
                { label: "Exchange", icon: ArrowLeftRight, href: "/exchange", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", hover: "hover:shadow-purple-200/50 dark:hover:shadow-purple-900/20" },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <Card className={`group hover:shadow-xl transition-all duration-300 border ${action.border} hover:-translate-y-1 overflow-hidden relative ${action.hover}`}>
                    <CardContent className="p-4 flex flex-col items-center justify-center gap-3 relative z-10 h-full">
                      <div className={`p-3 rounded-2xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform duration-300 shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/5`}>
                        <action.icon className="w-6 h-6" strokeWidth={2} />
                      </div>
                      <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Wallet Connection */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Web3 Wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* <MetaMaskButton /> - Replaced with custom logic for dashboard consistency */}
                {!user?.walletAddress ? (
                  <Button
                    onClick={handleConnectNewWallet}
                    disabled={isConnectingWallet}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-md h-12 rounded-xl transition-all"
                  >
                    {isConnectingWallet ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5 mr-2" />
                        Add MetaMask Wallet
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Wallet className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Connected Wallet</p>
                            <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
                              {formatAddress(user.walletAddress)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleCopyAddress}
                          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                          title="Copy address"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="pt-3 mt-1 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          <span className="font-mono">{user.walletAddress}</span>
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleRemoveWalletAction}
                      disabled={isRemoving}
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 py-5 rounded-xl font-semibold bg-transparent"
                    >
                      {isRemoving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Wallet
                        </>
                      )}
                    </Button>
                  </div>
                )}


              </CardContent>
            </Card>



            <DashboardPerformanceChart
              data={chartData}
              totalUsd={chartTotalUsd}
              isLoading={!exchangeRates}
              transactions={transactions}
              exchangeRates={exchangeRates}
            />

            <DashboardMoneyFlow
              transactions={transactions}
              exchangeRates={exchangeRates}
            />
          </div>
        </div>
      </div>

      {/* Password Verification Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Security Verification</DialogTitle>
            <DialogDescription>
              {helperText || "Please enter your security password to continue."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-password">Wallet Password</Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="wallet-password"
                  type="password"
                  placeholder="Enter your security password"
                  className="pl-9"
                  value={walletPassword}
                  onChange={(e) => setWalletPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePasswordSubmit()
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} disabled={isConnectingWallet || isRemoving}>
              {(isConnectingWallet || isRemoving) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
