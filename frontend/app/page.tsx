"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Globe } from "lucide-react"
import { Logo } from "@/components/logo"
import { useFont } from "@/lib/font-context"

export default function GuestDashboard() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { setFont } = useFont()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setFont("solaiman-lipi")
    if (!isLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router, setFont])

  if (!isMounted || isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-[#556B2F] border-t-transparent animate-spin" />
      </main>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">

      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-[#556B2F] to-[#0EA5E9] text-white">
        <div className="max-w-[1100px] mx-auto flex h-[72px] items-center justify-between px-8">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-sm hover:bg-white/15 transition-colors">
            <Logo className="w-44 h-auto" />
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-[13px] font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5">
              Log in
            </Link>
            <Button asChild size="sm" className="rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 px-5 h-9 text-[13px] font-semibold text-white">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col">
        <div className="max-w-[1100px] mx-auto px-8 w-full flex-1 flex flex-col justify-center py-12 lg:py-16">

          {/* Hero Text */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 px-3 py-1 mb-5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Blockchain Powered</span>
            </div>

            <h1 className="text-4xl sm:text-[2.75rem] font-extrabold tracking-tight leading-[1.15] text-slate-900 dark:text-white">
              Send money across{" "}
              <span className="bg-gradient-to-r from-[#556B2F] via-[#2d8a6e] to-[#0EA5E9] bg-clip-text text-transparent">borders, instantly</span>
            </h1>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Fast, secure &amp; transparent international transfers powered by Ethereum.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <Button asChild className="rounded-lg bg-gradient-to-r from-[#556B2F] to-[#0EA5E9] hover:opacity-90 px-6 h-10 text-[13px] font-semibold text-white shadow-md shadow-[#556B2F]/15">
                <Link href="/signup">
                  Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-lg px-6 h-10 text-[13px] font-semibold border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80">
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[900px] mx-auto w-full">
            {[
              {
                icon: <Zap className="h-4 w-4" />,
                title: "Instant Settlements",
                desc: "On-chain transactions settle in seconds with real-time tracking.",
                iconBg: "bg-amber-500",
              },
              {
                icon: <Shield className="h-4 w-4" />,
                title: "Bank-Grade Security",
                desc: "End-to-end encrypted transfers with MetaMask wallet integration.",
                iconBg: "bg-[#556B2F]",
              },
              {
                icon: <Globe className="h-4 w-4" />,
                title: "Multi-Currency",
                desc: "Support for ETH, USD, BDT, EUR, GBP and more currencies.",
                iconBg: "bg-[#0EA5E9]",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
                <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center text-white mb-3`}>
                  {item.icon}
                </div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-[1.5]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-[1100px] mx-auto px-8 py-4 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} RemittancePay</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Log In</Link>
            <Link href="/signup" className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
