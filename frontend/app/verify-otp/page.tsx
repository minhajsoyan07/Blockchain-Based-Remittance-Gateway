"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Mail, Phone } from "lucide-react"
import Link from "next/link"

function VerifyOTPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const phone = searchParams.get("phone")
  const identifier = email || phone || ""
  const recoveryType = email ? "email" : "phone"

  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!identifier) {
      router.push("/forgot-password")
    }

    // Start countdown for resend
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [identifier, router])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value.replace(/\D/g, "")
    setOtp(newOtp)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || ""
    }
    setOtp(newOtp)
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join("")

    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit OTP code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          type: recoveryType,
          code: otpCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP code")
      }

      // Redirect to reset password page
      router.push(`/reset-password?${recoveryType}=${encodeURIComponent(identifier)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP. Please try again.")
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          type: recoveryType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP")
      }

      setCountdown(60)
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted || !identifier) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 pb-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 font-bold" strokeWidth={2.5} />
              <CardTitle className="text-xl text-slate-900 dark:text-white font-bold">Verify OTP</CardTitle>
            </div>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Enter the 6-digit code sent to your {recoveryType === "email" ? "email" : "phone"}
            </CardDescription>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 mt-2">
              {recoveryType === "email" ? (
                <Mail className="w-3 h-3 font-bold" strokeWidth={2.5} />
              ) : (
                <Phone className="w-3 h-3 font-bold" strokeWidth={2.5} />
              )}
              <span className="font-medium">{identifier}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* OTP Input Fields */}
            <div className="flex justify-center gap-2">
              {otp.map((value, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    if (el) {
                      inputRefs.current[index] = el
                    }
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={value}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 transition-all"
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/30 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 font-bold" strokeWidth={2.5} />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || isLoading}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </button>
              </p>
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={isLoading || otp.join("").length !== 6}
              className="w-full h-11 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify OTP
                  <ArrowRight className="ml-2 w-4 h-4 font-bold" strokeWidth={2.5} />
                </>
              )}
            </Button>

            {/* Back Links */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <Link
                href="/forgot-password"
                className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4 font-bold" strokeWidth={2.5} />
                Back to Recover Password
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-purple-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl">
            <CardContent className="pt-6">
              <div className="text-center text-slate-600 dark:text-slate-400">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </main>
    }>
      <VerifyOTPContent />
    </Suspense>
  )
}



