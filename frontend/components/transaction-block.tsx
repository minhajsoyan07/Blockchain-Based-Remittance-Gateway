"use client"

import { CheckCircle, Clock, XCircle, Copy, ExternalLink, ArrowRight, ChevronDown, Wallet, DollarSign, Activity } from "lucide-react"
import { useState, useCallback, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { convertCurrency, type ExchangeRates } from "@/lib/currency-utils"

interface TransactionBlockProps {
  serialNumber: number
  id: string
  txHash: string
  fromUserId: string
  fromAddress?: string
  toAddress: string
  amount: number
  gasFee: number
  currency: string
  status: "pending" | "completed" | "failed"
  timestamp: number
  executionTime?: number
  rates: ExchangeRates
  senderName?: string
  senderEmail?: string
  receiverName?: string
  receiverEmail?: string
  description?: string
}

function TransactionBlockComponent({
  serialNumber,
  id,
  txHash,
  fromUserId,
  fromAddress,
  toAddress,
  amount,
  gasFee,
  currency,
  status,
  timestamp,
  executionTime,
  rates,
  senderName,
  senderEmail,
  receiverName,
  receiverEmail,
  description,
  currentUserAddress,
}: TransactionBlockProps & { currentUserAddress?: string }) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  // Direction Logic: Incoming vs Outgoing
  const isIncoming = useMemo(() => {
    if (!currentUserAddress || !toAddress) return false
    return toAddress.toLowerCase() === currentUserAddress.toLowerCase()
  }, [toAddress, currentUserAddress])

  const calculations = useMemo(() => {
    const amountInUSD = convertCurrency(amount, currency, "USD", rates)
    const amountInBDT = convertCurrency(amount, currency, "BDT", rates)
    const gasFeeInUSD = convertCurrency(gasFee, currency, "USD", rates)
    const gasFeeInBDT = convertCurrency(gasFee, currency, "BDT", rates)
    const totalInUSD = amountInUSD + gasFeeInUSD
    const totalInBDT = amountInBDT + gasFeeInBDT

    return {
      gasFeeInUSD,
      gasFeeInBDT,
      amountInUSD,
      amountInBDT,
      totalInUSD,
      totalInBDT,
    }
  }, [amount, gasFee, currency, rates])

  const shortenHash = useCallback((hash: string, length = 6) => {
    if (!hash) return "N/A"
    if (hash.length <= length * 2) return hash
    return `${hash.slice(0, length)}...${hash.slice(-length)}`
  }, [])

  // Smart sender label: prioritize name > address > branded fallback
  const senderLabel = useMemo(() => {
    if (senderName && senderName.trim()) return senderName.trim()
    if (fromUserId && fromUserId.startsWith("RPAY")) return fromUserId
    if (fromAddress && fromAddress.trim()) return shortenHash(fromAddress, 6)
    return "RPay Wallet"
  }, [senderName, fromUserId, fromAddress, shortenHash])

  // Sub-label showing RPay code or shortened address underneath the name
  const senderSubLabel = useMemo(() => {
    if (senderName && senderName.trim() && fromUserId) return fromUserId
    if (fromAddress && fromAddress.trim()) return shortenHash(fromAddress, 6)
    return null
  }, [senderName, fromUserId, fromAddress, shortenHash])

  const senderFullRef = useMemo(() => {
    if (fromAddress && fromAddress.trim()) return fromAddress
    if (senderName && senderName.trim()) return senderName
    return fromUserId || "RPay Wallet"
  }, [senderName, fromAddress, fromUserId])

  // Smart receiver label: prioritize receiverName > shortened address
  const receiverLabel = useMemo(() => {
    if (receiverName && receiverName.trim()) return receiverName.trim()
    return shortenHash(toAddress, 6)
  }, [receiverName, toAddress, shortenHash])

  const receiverSubLabel = useMemo(() => {
    if (receiverName && receiverName.trim()) return shortenHash(toAddress, 6)
    return null
  }, [receiverName, toAddress, shortenHash])

  const copyToClipboard = useCallback((text: string, field: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }, [])

  // Dynamic Styles based on Status - VIBRANT & COLORFUL
  const statusStyles = useMemo(() => {
    // If incoming, override styles to Green/Received theme
    if (isIncoming && status === 'completed') {
      return {
        card: "bg-white dark:bg-slate-900 border-l-[6px] border-l-emerald-500 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10",
        bgGradient: "bg-gradient-to-r from-emerald-50/80 via-white to-transparent dark:from-emerald-900/20 dark:via-slate-900",
        iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40",
        badge: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30",
        text: "text-emerald-700 dark:text-emerald-400"
      }
    }

    switch (status) {
      case "completed":
        return {
          card: "bg-white dark:bg-slate-900 border-l-[6px] border-l-blue-500 shadow-sm hover:shadow-lg hover:shadow-blue-500/10",
          bgGradient: "bg-gradient-to-r from-blue-50/80 via-white to-transparent dark:from-blue-900/20 dark:via-slate-900",
          iconBg: "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40",
          badge: "bg-blue-100/80 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30",
          text: "text-blue-700 dark:text-blue-400"
        }
      case "pending":
        return {
          card: "bg-white dark:bg-slate-900 border-l-[6px] border-l-amber-500 shadow-sm hover:shadow-lg hover:shadow-amber-500/10",
          bgGradient: "bg-gradient-to-r from-amber-50/80 via-white to-transparent dark:from-amber-900/20 dark:via-slate-900",
          iconBg: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/40",
          badge: "bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30",
          text: "text-amber-700 dark:text-amber-400"
        }
      case "failed":
        return {
          card: "bg-white dark:bg-slate-900 border-l-[6px] border-l-red-500 shadow-sm hover:shadow-lg hover:shadow-red-500/10",
          bgGradient: "bg-gradient-to-r from-red-50/80 via-white to-transparent dark:from-red-900/20 dark:via-slate-900",
          iconBg: "bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/40",
          badge: "bg-red-100/80 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30",
          text: "text-red-700 dark:text-red-400"
        }
    }
  }, [status, isIncoming])

  const getStatusIcon = useCallback((s: string) => {
    switch (s) {
      case "completed": return <CheckCircle className="w-5 h-5" />
      case "pending": return <Clock className="w-5 h-5" />
      case "failed": return <XCircle className="w-5 h-5" />
      default: return null
    }
  }, [])

  return (
    <div
      className={`group relative mb-3 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-300 overflow-hidden ${statusStyles.card} ${isExpanded
        ? 'shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 scale-[1.01] z-10'
        : 'hover:shadow-md hover:scale-[1.002]'
        }`}
    >
      {/* Main Card Content */}
      <div
        className={`p-4 cursor-pointer relative ${statusStyles.bgGradient}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">

          {/* Left: Icon & Main Info */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Vibrant Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${statusStyles.iconBg} transform group-hover:scale-110 transition-transform duration-300`}>
              {getStatusIcon(status)}
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                  {isIncoming ? `Received ${currency}` : `Sent ${currency}`}
                </h4>
                <span className={`px-2 py-[2px] rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyles.badge}`}>
                  {status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="font-mono bg-white/50 dark:bg-slate-800/50 px-1.5 rounded text-slate-600 dark:text-slate-300">
                  {new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className="text-slate-300">•</span>
                <span>{new Date(timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                {executionTime && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                      {executionTime < 1000 ? `${executionTime}ms` : `${(executionTime / 1000).toFixed(2)}s`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Amount & Currency */}
          <div className="flex flex-col items-end w-full sm:w-auto mt-2 sm:mt-0">
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black tracking-tighter ${isIncoming ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                {isIncoming ? "+" : "-"}{amount.toFixed(4)}
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{currency}</span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                ≈ ${calculations.amountInUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span
                className="text-xs font-bold"
                style={{ fontFamily: '"SolaimanLipi", sans-serif', color: status === 'failed' ? '#ef4444' : '#10b981' }}
              >
                ৳ {calculations.amountInBDT.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Details (Show on Desktop) */}
        {!isExpanded && (
          <div className="hidden sm:flex items-center justify-between mt-3 pt-3 border-t border-slate-100/50 dark:border-slate-800/50">
            <div className="flex items-center gap-4 text-xs bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg w-full">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Flow:</span>
                <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{senderLabel}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{receiverLabel}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ref:</span>
                <span className="font-mono text-slate-500">{shortenHash(txHash, 8)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Expand Toggle */}
        <div className="absolute top-4 right-4 sm:hidden">
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded View - Compact Dashboard */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl"
          >
            <div className="p-5 space-y-5">

              {/* Compact Split Row: Flow & Hash */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Money Flow */}
                <div className="bg-white dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full pointer-events-none" />
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Money Flow
                  </h5>
                  <div className="flex items-center justify-between gap-2 relative z-10">
                    {/* Sender */}
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[100px] lg:max-w-[140px]" title={senderFullRef}>
                          {senderLabel}
                        </p>
                        {senderSubLabel && (
                          <p className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 truncate max-w-[100px] lg:max-w-[140px]">
                            {senderSubLabel}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                    {/* Recipient */}
                    <div className="flex items-center gap-3 w-full justify-end">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[100px] lg:max-w-[140px]" title={toAddress}>
                          {receiverLabel}
                        </p>
                        {receiverSubLabel && (
                          <p className="text-[10px] font-mono text-emerald-500 dark:text-emerald-400 truncate max-w-[100px] lg:max-w-[140px]">
                            {receiverSubLabel}
                          </p>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Hash */}
                <div className="bg-white dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Transaction Hash</span>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1.5 rounded text-slate-600 dark:text-slate-300 truncate w-full">
                      {txHash}
                    </code>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); copyToClipboard(txHash, "hash") }} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-500 transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                      {txHash.startsWith("0x") && (
                        <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-md transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Section: Cost Breakdown (Grid-3) */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Cost Breakdown
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Amount */}
                  <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 transition-colors flex flex-col justify-between h-full">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Transfer Amount</p>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{amount.toFixed(6)} {currency}</p>
                      <p className="text-xs font-semibold text-slate-500">${calculations.amountInUSD.toLocaleString()}</p>
                      <p className="text-sm font-bold text-emerald-600 font-solaiman">৳ {calculations.amountInBDT.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Fee */}
                  <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-orange-300 transition-colors flex flex-col justify-between h-full">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Network Fee</p>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{gasFee.toFixed(6)} {currency}</p>
                      <p className="text-xs font-semibold text-slate-500">${calculations.gasFeeInUSD.toFixed(4)}</p>
                      <p className="text-sm font-bold text-orange-600 font-solaiman">৳ {calculations.gasFeeInBDT.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Total - Premium Highlight */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-400 transition-colors relative overflow-hidden flex flex-col justify-between h-full group/total">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 group-hover/total:text-indigo-500 transition-colors">
                      {isIncoming ? "Total Received" : "Total Deducted"}
                    </p>
                    <div className="space-y-1 relative z-10">
                      <p className={`text-xl font-black ${isIncoming ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                        {isIncoming ? "+" : ""}{(amount + (isIncoming ? 0 : gasFee)).toFixed(6)} <span className="text-sm font-bold opacity-80">{currency}</span>
                      </p>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">${calculations.totalInUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white font-solaiman">৳ {calculations.totalInBDT.toLocaleString()}</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const TransactionBlock = memo(TransactionBlockComponent)
