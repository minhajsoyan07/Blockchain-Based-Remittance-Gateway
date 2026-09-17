"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  Download,
  Bell,
  Shield,
  BarChart3,
  Target,
  Clock,
  Zap,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
  Activity,
} from "lucide-react"
import Link from "next/link"

interface DashboardFeaturesProps {
  transactionsCount: number
  totalTransactions: number
  monthlySpending: number
}

export function DashboardFeatures({ transactionsCount, totalTransactions, monthlySpending }: DashboardFeaturesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Analytics Card */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400 font-bold" strokeWidth={2.5} />
            Analytics
          </CardTitle>
          <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
            Track your spending and income
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">This Month</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">${monthlySpending.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 font-bold" strokeWidth={2.5} />
          </div>
          <Link href="/analytics">
            <Button variant="outline" size="sm" className="w-full">
              View Analytics
              <ArrowUpCircle className="w-4 h-4 ml-2 font-bold" strokeWidth={2.5} />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400 font-bold" strokeWidth={2.5} />
            Quick Actions
          </CardTitle>
          <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
            Frequently used features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/send">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <ArrowUpCircle className="w-4 h-4 mr-2 font-bold" strokeWidth={2.5} />
              Quick Send
            </Button>
          </Link>
          <Link href="/add-money">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <ArrowDownCircle className="w-4 h-4 mr-2 font-bold" strokeWidth={2.5} />
              Add Funds
            </Button>
          </Link>
          <Link href="/exchange">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <ArrowLeftRight className="w-4 h-4 mr-2 font-bold" strokeWidth={2.5} />
              Exchange Currency
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 font-bold" strokeWidth={2.5} />
            Activity
          </CardTitle>
          <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
            Recent account activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500 font-bold" strokeWidth={2.5} />
              <span className="text-sm text-slate-700 dark:text-slate-300">Total Transactions</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{totalTransactions}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500 font-bold" strokeWidth={2.5} />
              <span className="text-sm text-slate-700 dark:text-slate-300">This Week</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{transactionsCount}</span>
          </div>
          <Link href="/transactions">
            <Button variant="outline" size="sm" className="w-full mt-2">
              View All
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

