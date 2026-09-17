/**
 * Dashboard Performance Chart Component
 * 
 * Displays a professional graph chart with:
 * - Monthly transaction volume bars (different colors per month)
 * - Trend analysis line overlay
 * - Graph paper background pattern
 * - Real-time analysis metrics
 * - Interactive tooltips with color indicators
 * 
 * @module components/dashboard-performance-chart
 */

"use client"

import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Line,
  Cell,
} from "recharts"
import { BadgeCheck, TrendingUp, Activity, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { convertCurrency } from "@/lib/currency-utils"

// ============================================================================
// Type Definitions
// ============================================================================
interface DashboardChartDatum {
  label: string
  subtitle: string
  barValue: number
  lineValue: number
  date: string
}

interface Transaction {
  id: string
  fromUserId: string
  toAddress: string
  amount: number
  gasFee: number
  currency: string
  status: "pending" | "completed" | "failed"
  timestamp: number
  txHash?: string
  description?: string
}

interface DashboardPerformanceChartProps {
  data: DashboardChartDatum[]
  totalUsd: number
  isLoading?: boolean
  transactions?: Transaction[]
  exchangeRates?: any
}

// ============================================================================
// Chart Configuration
// ============================================================================
// Color palette: Each bar gets a unique color while maintaining theme consistency
const barColors = [
  '#ef4444', // Red - matches X-axis color
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Green - matches Y-axis color
  '#3b82f6', // Blue - matches trend line color
]

// ============================================================================
// Utility Functions
// ============================================================================
// Filters and sorts data to get the last 5 months
function getLastFiveMonths(data: DashboardChartDatum[]): DashboardChartDatum[] {
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return sorted.slice(-5)
}

export function DashboardPerformanceChart({ data, totalUsd, isLoading, transactions = [], exchangeRates }: DashboardPerformanceChartProps) {
  const [timePeriod, setTimePeriod] = useState<"minute" | "hour" | "day" | "week" | "month">("day")
  // ============================================================================
  // Data Processing
  // ============================================================================
  const lastFive = useMemo(() => getLastFiveMonths(data), [data])
  const hasData = lastFive.length > 0
  const chartValueLabel = "Monthly Transaction Volume"
  const lineValueLabel = "Trend Analysis"

  // ============================================================================
  // Analysis Calculations
  // ============================================================================
  // Computes statistical metrics: max value, average, growth rate, peak month
  const analysisData = useMemo(() => {
    if (!hasData || lastFive.length === 0) return null

    const values = lastFive.map(item => item.barValue)
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values.filter(v => v > 0)) || 0
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length
    const growthRate = values.length > 1 && values[values.length - 2] > 0
      ? ((values[values.length - 1] - values[values.length - 2]) / values[values.length - 2] * 100).toFixed(1)
      : '0'
    const maxMonthIndex = values.indexOf(maxValue)
    const maxMonth = lastFive[maxMonthIndex]?.subtitle || 'N/A'
    const totalTransactions = values.filter(v => v > 0).length

    return {
      maxValue,
      minValue,
      avgValue,
      growthRate,
      maxMonth,
      totalTransactions,
      totalMonths: values.length
    }
  }, [lastFive, hasData])

  // ============================================================================
  // Money Flow Calculations: Incoming/Outgoing based on time period
  // ============================================================================
  const moneyFlow = useMemo(() => {
    if (!transactions || transactions.length === 0 || !exchangeRates) {
      return { incoming: 0, outgoing: 0, net: 0 }
    }

    const now = Date.now()
    let timeThreshold = 0

    switch (timePeriod) {
      case "minute":
        timeThreshold = now - 60 * 1000 // Last 60 seconds
        break
      case "hour":
        timeThreshold = now - 60 * 60 * 1000 // Last 60 minutes
        break
      case "day":
        timeThreshold = now - 24 * 60 * 60 * 1000 // Last 24 hours
        break
      case "week":
        timeThreshold = now - 7 * 24 * 60 * 60 * 1000 // Last 7 days
        break
      case "month":
        timeThreshold = now - 30 * 24 * 60 * 60 * 1000 // Last 30 days
        break
      default:
        timeThreshold = now - 24 * 60 * 60 * 1000 // Default to day
    }

    // Filter transactions: only completed transactions within time period
    // Ensure timestamp is valid and in milliseconds
    const filteredTransactions = transactions.filter((tx) => {
      if (!tx || tx.status !== "completed") {
        return false
      }

      // Validate timestamp exists and is a valid number
      if (!tx.timestamp || typeof tx.timestamp !== "number" || isNaN(tx.timestamp)) {
        return false
      }

      // Ensure timestamp is within reasonable range (not too old or in future)
      // Timestamps should be in milliseconds, and not be more than 10 years old or in the future
      const minTimestamp = now - (10 * 365 * 24 * 60 * 60 * 1000) // 10 years ago
      const maxTimestamp = now + (24 * 60 * 60 * 1000) // Allow 1 day in future for timezone issues

      if (tx.timestamp < minTimestamp || tx.timestamp > maxTimestamp) {
        return false
      }

      // Check if transaction is within the selected time period
      return tx.timestamp >= timeThreshold
    })

    let incoming = 0
    let outgoing = 0

    filteredTransactions.forEach((tx) => {
      // Skip invalid transactions
      if (!tx.amount || tx.amount <= 0 || isNaN(tx.amount)) {
        return
      }

      // Convert to USD using utility function
      let usdAmount = tx.amount
      if (tx.currency && tx.currency !== "USD" && exchangeRates) {
        try {
          const converted = convertCurrency(tx.amount, tx.currency as any, "USD", exchangeRates)
          if (isNaN(converted) || !isFinite(converted) || converted < 0) {
            // Skip if conversion failed or invalid
            return
          }
          usdAmount = converted
        } catch (e) {
          // Skip if conversion fails
          return
        }
      }

      // Ensure valid USD amount
      if (isNaN(usdAmount) || !isFinite(usdAmount) || usdAmount < 0) {
        return
      }

      // Convert gas fee to USD
      let usdGasFee = 0
      if (tx.gasFee && tx.gasFee > 0) {
        if (tx.currency && tx.currency !== "USD" && exchangeRates) {
          try {
            const converted = convertCurrency(tx.gasFee, tx.currency as any, "USD", exchangeRates)
            if (!isNaN(converted) && isFinite(converted) && converted >= 0) {
              usdGasFee = converted
            }
          } catch (e) {
            // Default to 0 if conversion fails
            usdGasFee = 0
          }
        } else {
          usdGasFee = tx.gasFee
        }
      }

      // Determine if incoming or outgoing based on transaction type and properties
      // CRITICAL: Transactions from the user's perspective (they are the sender)
      // Outgoing: transactions where user sends money (has toAddress + gasFee, or description indicates sending)
      // Incoming: transactions where user receives money (add money, deposits, credits)

      const desc = (tx.description || "").toLowerCase().trim()
      const hasToAddress = tx.toAddress && typeof tx.toAddress === "string" && tx.toAddress.trim() !== "" && tx.toAddress.startsWith("0x")
      const hasGasFee = tx.gasFee && tx.gasFee > 0

      // PRIORITY 1: Check description keywords (most reliable)
      const isOutgoingByDesc =
        desc.includes("send") ||
        desc.includes("transfer") ||
        desc.includes("withdraw") ||
        desc.includes("sent") ||
        desc.includes("payment")

      const isIncomingByDesc =
        desc.includes("add") ||
        desc.includes("deposit") ||
        desc.includes("credit") ||
        desc.includes("receive") ||
        desc.includes("received") ||
        desc.includes("refund")

      // PRIORITY 2: If description doesn't clearly indicate, use transaction properties
      // Send transactions ALWAYS have toAddress (recipient) AND gasFee (network fee)
      // This is the most reliable indicator for outgoing transactions
      if (isOutgoingByDesc) {
        // Explicitly marked as outgoing in description
        outgoing += usdAmount + usdGasFee
      } else if (isIncomingByDesc) {
        // Explicitly marked as incoming in description
        incoming += usdAmount
      } else if (hasToAddress && hasGasFee) {
        // Has recipient address AND gas fee = definitely outgoing (send transaction)
        outgoing += usdAmount + usdGasFee
      } else if (hasToAddress && !hasGasFee && !desc.includes("add") && !desc.includes("deposit")) {
        // Has recipient address but no gas fee, and not marked as add/deposit = likely outgoing
        outgoing += usdAmount
      } else if (hasGasFee && !desc.includes("exchange")) {
        // Has gas fee (usually means network transaction) = outgoing
        outgoing += usdAmount + usdGasFee
      } else {
        // Default: No clear indicators, assume incoming (safer default for user balance tracking)
        incoming += usdAmount
      }
    })

    return {
      incoming: Math.max(0, incoming),
      outgoing: Math.max(0, outgoing),
      net: incoming - outgoing,
    }
  }, [transactions, timePeriod, exchangeRates])

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-sm">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
              Performance Overview
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your transaction activity over the last 5 months
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-200 dark:border-emerald-800/50">
            <BadgeCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
            Live Data
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50 dark:border-indigo-800/30">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wide">Total Volume</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
              ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
              All completed transactions total value
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
              Trend Analysis
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed">
              Track your transaction patterns and overall activity growth over time.
            </p>
          </div>
        </div>

        {/* Monthly Transaction Volume Color Guide */}
        {hasData && (
          <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
              Monthly Transaction Volume Colors
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {lastFive.map((item, index) => (
                <div key={`color-guide-${index}`} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm shadow-sm border border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: barColors[index] }}
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {item.subtitle}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative aspect-square w-full max-h-[480px] rounded-xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden shadow-lg bg-gradient-to-br from-white via-slate-50/30 to-white dark:from-slate-900 dark:via-slate-950/50 dark:to-slate-900">
          {/* Graph Paper Background Pattern */}
          <div
            className="absolute inset-0 z-0 opacity-60 dark:opacity-30"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(148, 163, 175, 0.12) 4px, rgba(148, 163, 175, 0.12) 5px),
                repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(148, 163, 175, 0.12) 4px, rgba(148, 163, 175, 0.12) 5px),
                repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(107, 114, 128, 0.18) 19px, rgba(107, 114, 128, 0.18) 20px),
                repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(107, 114, 128, 0.18) 19px, rgba(107, 114, 128, 0.18) 20px),
                repeating-linear-gradient(0deg, transparent, transparent 99px, rgba(75, 85, 99, 0.25) 99px, rgba(75, 85, 99, 0.25) 100px),
                repeating-linear-gradient(90deg, transparent, transparent 99px, rgba(75, 85, 99, 0.25) 99px, rgba(75, 85, 99, 0.25) 100px)
              `
            }}
          />
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 animate-pulse">
              <div className="w-16 h-16 rounded-lg border-2 border-indigo-200 dark:border-indigo-800" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-4">Preparing analytics…</p>
            </div>
          ) : !hasData ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <Activity className="w-12 h-12 text-indigo-300 dark:text-indigo-600 mb-3" strokeWidth={2.5} />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No transaction data yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Completed transactions will appear in this performance chart.
              </p>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 z-0" />
              <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                <ComposedChart data={lastFive} margin={{ top: 25, left: 70, right: 25, bottom: 65 }}>
                  <defs>
                    {barColors.map((color, index) => (
                      <linearGradient key={`gradient-${index}`} id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="2 2"
                    stroke="#94a3b8"
                    strokeOpacity={0.4}
                    className="dark:stroke-slate-600 dark:opacity-30"
                    vertical={true}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="subtitle"
                    tickLine={false}
                    axisLine={{ stroke: "#ef4444", strokeWidth: 2 }}
                    tick={{ fontSize: 12, fill: "#ef4444", fontWeight: 600 }}
                    label={{
                      value: "Time Period (Months)",
                      position: "bottom",
                      offset: 10,
                      style: {
                        textAnchor: "middle",
                        fill: "#ef4444",
                        fontSize: 11,
                        fontWeight: 600
                      }
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: "#10b981", strokeWidth: 2 }}
                    tick={{ fontSize: 11, fill: "#10b981", fontWeight: 600 }}
                    tickFormatter={(value) => {
                      if (value >= 1000) {
                        return `$${(value / 1000).toFixed(0)}k`
                      }
                      return `$${value.toFixed(0)}`
                    }}
                    width={55}
                    label={{
                      value: "Transaction Volume (USD)",
                      position: "left",
                      angle: -90,
                      offset: 5,
                      style: {
                        textAnchor: "middle",
                        fill: "#10b981",
                        fontSize: 11,
                        fontWeight: 600
                      }
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(59, 130, 246, 0.08)", stroke: "#3b82f6", strokeWidth: 1.5 }}
                    content={(props: any) => {
                      const { active, payload } = props
                      if (active && payload && payload.length) {
                        const barPayload = payload.find((p: any) => p.dataKey === 'barValue')
                        const linePayload = payload.find((p: any) => p.dataKey === 'lineValue')
                        return (
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                              {payload[0]?.payload?.subtitle || 'N/A'}
                            </p>
                            {barPayload && (
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className="w-3 h-3 rounded-sm border border-slate-300 dark:border-slate-600"
                                  style={{
                                    backgroundColor: barColors[lastFive.findIndex(item => item.barValue === barPayload.value)] || barPayload.color
                                  }}
                                />
                                <span className="text-xs text-slate-500 dark:text-slate-400">Volume:</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  ${(barPayload.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                              </div>
                            )}
                            {linePayload && (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white" />
                                <span className="text-xs text-slate-500 dark:text-slate-400">Trend:</span>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                  ${(linePayload.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: "#475569",
                      fontSize: 12,
                      paddingTop: "15px",
                      paddingBottom: "5px"
                    }}
                    iconType="square"
                    className="dark:fill-slate-400"
                    verticalAlign="top"
                    align="center"
                    content={(props) => {
                      const { payload } = props
                      return (
                        <div className="flex items-center justify-center gap-6 flex-wrap pt-3">
                          {payload?.map((entry: any, index: number) => {
                            if (entry.dataKey === 'barValue') {
                              // Show individual month colors for Monthly Transaction Volume
                              return lastFive.map((item, idx) => (
                                <div key={`legend-month-${idx}`} className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-sm"
                                    style={{ backgroundColor: barColors[idx] }}
                                  />
                                  <span className="text-xs text-slate-600 dark:text-slate-400">
                                    {item.subtitle}
                                  </span>
                                </div>
                              ))
                            }
                            // Show Trend Analysis with blue line
                            return (
                              <div key={entry.value} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white" />
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                  {entry.value}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="barValue"
                    name={chartValueLabel}
                    barSize={52}
                    radius={[12, 12, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={800}
                  >
                    {lastFive.map((item, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#barGradient-${index})`}
                        stroke={barColors[index]}
                        strokeWidth={1.5}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="lineValue"
                    name={lineValueLabel}
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2.5 }}
                    activeDot={{ r: 8, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 3 }}
                    strokeDasharray="0"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Analysis Section */}
        {hasData && analysisData && (
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Peak Month</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{analysisData.maxMonth}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                ${analysisData.maxValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Avg/Month</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                ${analysisData.avgValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {analysisData.totalTransactions}/{analysisData.totalMonths} active
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase">Growth Rate</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {analysisData.growthRate}%
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Month-over-month
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">Trend</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {parseFloat(analysisData.growthRate) > 0 ? '↑ Rising' : parseFloat(analysisData.growthRate) < 0 ? '↓ Declining' : '→ Stable'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {lastFive[lastFive.length - 1]?.subtitle}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

