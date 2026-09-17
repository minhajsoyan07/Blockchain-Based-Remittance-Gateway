"use client"

import { useMemo, useState } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Activity, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { convertCurrency } from "@/lib/currency-utils"

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

interface DashboardMoneyFlowProps {
    transactions?: Transaction[]
    exchangeRates?: any
}

export function DashboardMoneyFlow({ transactions = [], exchangeRates }: DashboardMoneyFlowProps) {
    const [timePeriod, setTimePeriod] = useState<"minute" | "hour" | "day" | "week" | "month">("day")

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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" strokeWidth={2.5} />
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Money Flow</CardTitle>
                    </div>
                    {/* Time Period Selector */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        {(["minute", "hour", "day", "week", "month"] as const).map((period) => (
                            <button
                                key={period}
                                onClick={() => setTimePeriod(period)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${timePeriod === period
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    }`}
                            >
                                {period.charAt(0).toUpperCase() + period.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-5 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Incoming Money */}
                        <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowDownCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Incoming</p>
                            </div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">
                                ${moneyFlow.incoming.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                Last {timePeriod}
                            </p>
                        </div>

                        {/* Outgoing Money */}
                        <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowUpCircle className="w-4 h-4 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                                <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase">Outgoing</p>
                            </div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">
                                ${moneyFlow.outgoing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                Last {timePeriod}
                            </p>
                        </div>
                    </div>

                    {/* Net Flow */}
                    <div className="flex flex-col justify-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">Net Flow Analysis</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Total Net Flow</span>
                            <p className={`text-2xl font-bold ${moneyFlow.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {moneyFlow.net >= 0 ? '+' : ''}${moneyFlow.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${moneyFlow.net >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                style={{ width: '100%' }} // Simplified visualization
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
