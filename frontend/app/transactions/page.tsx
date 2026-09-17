"use client"

import { useEffect, useState, useMemo, Suspense, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTransactions } from "@/hooks/use-transactions"
import { getExchangeRates, type ExchangeRates, DEFAULT_RATES } from "@/lib/currency-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { TransactionList } from "@/components/transaction-list"
import { OliveHeader } from "@/components/olive-header"
import { History, TrendingUp, Zap, CheckCircle, DollarSign, RefreshCw, AlertCircle } from "lucide-react"

export default function TransactionsPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const {
    transactions,
    isLoading: isLoadingTransactions,
    error,
    isRefreshing,
    userInfoMap,
    fetchTransactions,
  } = useTransactions()
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent")
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "failed">("all")
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_RATES)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const fetchedRates = await getExchangeRates()
        setRates(fetchedRates)
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error)
        // Fallback already set by useState(DEFAULT_RATES)
      }
    }
    fetchExchangeRates()
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchTransactions()
    }
  }, [user?.id, fetchTransactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => (filterStatus === "all" ? true : tx.status === filterStatus))
  }, [transactions, filterStatus])

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      return sortBy === "recent" ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    })
  }, [filteredTransactions, sortBy])

  const stats = useMemo(() => {
    const completedTransactions = transactions.filter((tx) => tx.status === "completed")
    const pendingTransactions = transactions.filter((tx) => tx.status === "pending")
    const failedTransactions = transactions.filter((tx) => tx.status === "failed")
    const totalSent = completedTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const totalFees = completedTransactions.reduce((sum, tx) => {
      // Ensure gasFee is valid, default to 2% of amount if missing
      const gasFee = tx.gasFee !== undefined && tx.gasFee !== null && !isNaN(Number(tx.gasFee))
        ? Number(tx.gasFee)
        : Number.parseFloat((tx.amount * 0.02).toFixed(6))
      return sum + gasFee
    }, 0)
    const averageFee = completedTransactions.length > 0 ? totalFees / completedTransactions.length : 0

    return {
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      totalSent,
      totalFees,
      averageFee,
    }
  }, [transactions])

  const handleRefresh = useCallback(() => {
    fetchTransactions(true)
  }, [fetchTransactions])

  // ============================================================================
  // Logout Handler
  // ============================================================================
  /**
   * Handles user logout with safe navigation
   * Must be defined BEFORE any conditional returns to comply with React hooks rules
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

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 dark:from-slate-950 dark:via-emerald-950/60 dark:to-teal-950/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto mb-4"></div>
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
      <div className="max-w-7xl mx-auto p-4">
        <OliveHeader />
        {/* Header */}
        <Card className="mb-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-6 sm:p-8 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-3">
                <History className="h-4 w-4" />
                Transaction History
              </div>
              <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">
                View and manage all your transactions
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Complete transaction records with detailed information, status tracking, and real-time updates
              </p>
            </div>
            <BackButton />
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-white text-sm flex items-center gap-2 font-semibold uppercase tracking-wide">
                <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                Total Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {Number(stats.totalSent.toFixed(4))} ETH
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2">
                {stats.completedTransactions.length} completed
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-white text-sm flex items-center gap-2 font-semibold uppercase tracking-wide">
                <Zap className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                Total Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {Number(stats.totalFees.toFixed(6))} ETH
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2">
                Avg: {Number(stats.averageFee.toFixed(6))} ETH
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-white text-sm flex items-center gap-2 font-semibold uppercase tracking-wide">
                <CheckCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.completedTransactions.length}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2">
                {transactions.length > 0
                  ? ((stats.completedTransactions.length / transactions.length) * 100).toFixed(0)
                  : 0}
                % success rate
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-900 dark:text-white text-sm flex items-center gap-2 font-semibold uppercase tracking-wide">
                <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{transactions.length}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2">
                {stats.pendingTransactions.length} pending • {stats.failedTransactions.length} failed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "recent" | "oldest")}
                  className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "all" | "completed" | "pending" | "failed")}
                  className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700">
                  Showing {sortedTransactions.length} of {transactions.length}
                </span>
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  size="sm"
                  variant="outline"
                  className="border border-slate-300 dark:border-slate-700"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 font-bold">
              <History className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              Transaction Details
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 font-medium mt-1">
              Complete transaction information with sender, receiver, amounts in USDT & BDT, and fees
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {isLoadingTransactions ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto mb-3"></div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Loading transactions...</p>
              </div>
            ) : sortedTransactions.length === 0 ? (
              <div className="text-center py-16">
                <History className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">No transactions found</p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  {transactions.length === 0
                    ? "Your transactions will appear here once you send ETH"
                    : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="text-center py-8">
                    <div className="w-6 h-6 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin mx-auto"></div>
                  </div>
                }
              >
                <TransactionList
                  transactions={sortedTransactions}
                  userInfoMap={userInfoMap}
                  rates={rates}
                  currentUserAddress={user?.walletAddress || undefined}
                />
              </Suspense>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
