"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTransactions } from "@/hooks/use-transactions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { OliveHeader } from "@/components/olive-header"
import { TrendingUp, TrendingDown, ArrowLeft, Download, Calendar, BarChart3, DollarSign, Menu } from "lucide-react"
import Link from "next/link"
import { getExchangeRates, type ExchangeRates } from "@/lib/currency-utils"

export default function AnalyticsPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const { transactions } = useTransactions()
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d")
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
    const fetchRates = async () => {
      const rates = await getExchangeRates()
      setExchangeRates(rates)
    }
    fetchRates()
  }, [])

  const filteredTransactions = useMemo(() => {
    const now = Date.now()
    const rangeMs = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      "all": Infinity,
    }

    return transactions.filter((tx) => {
      if (timeRange === "all") return true
      return now - tx.timestamp < rangeMs[timeRange]
    })
  }, [transactions, timeRange])

  const stats = useMemo(() => {
    const completed = filteredTransactions.filter((tx) => tx.status === "completed")
    const totalSent = completed.reduce((sum, tx) => {
      if (tx.currency === "ETH" && exchangeRates) {
        return sum + tx.amount * (1 / exchangeRates.ETH)
      }
      return sum + tx.amount
    }, 0)
    const totalFees = completed.reduce((sum, tx) => {
      if (tx.currency === "ETH" && exchangeRates) {
        return sum + tx.gasFee * (1 / exchangeRates.ETH)
      }
      return sum + tx.gasFee
    }, 0)
    const avgAmount = completed.length > 0 ? totalSent / completed.length : 0

    return {
      totalTransactions: filteredTransactions.length,
      completedTransactions: completed.length,
      totalSent,
      totalFees,
      avgAmount,
    }
  }, [filteredTransactions, exchangeRates])

  const handleExport = useCallback(() => {
    const csv = [
      ["Date", "Description", "Amount", "Currency", "Status", "Hash"].join(","),
      ...filteredTransactions.map((tx) => {
        const date = new Date(tx.timestamp).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
        return [date, tx.description || "", tx.amount.toString(), tx.currency, tx.status, tx.txHash || ""].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredTransactions])

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <OliveHeader />
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 shadow-xl mb-8 text-white overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-white">Analytics</h1>
                <p className="text-base text-blue-100 mt-1">Track your financial activity</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button onClick={handleExport} variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border-0">
                <Download className="w-4 h-4 mr-2 font-bold" strokeWidth={2.5} />
                Export CSV
              </Button>
              <BackButton />
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              className={
                timeRange === range
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "All Time"}
            </Button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Transactions</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalTransactions}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400 font-bold" strokeWidth={2.5} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Sent</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    ${stats.totalSent.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 font-bold" strokeWidth={2.5} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Fees</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    ${stats.totalFees.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400 font-bold" strokeWidth={2.5} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg Transaction</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    ${stats.avgAmount.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-purple-600 dark:text-purple-400 font-bold" strokeWidth={2.5} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Summary */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 font-bold" strokeWidth={2.5} />
              Transaction Summary
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
              Overview of your transaction activity for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Completed</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.completedTransactions}</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/50 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {filteredTransactions.filter((tx) => tx.status === "pending").length}
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {filteredTransactions.filter((tx) => tx.status === "failed").length}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Success Rate</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {stats.totalTransactions > 0
                    ? ((stats.completedTransactions / stats.totalTransactions) * 100).toFixed(0)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}



