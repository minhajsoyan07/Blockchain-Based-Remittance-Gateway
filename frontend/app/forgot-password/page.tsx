"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, ArrowLeft, Shield, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [recoveryType, setRecoveryType] = useState<"email" | "phone">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [identifierValid, setIdentifierValid] = useState(false)
  const [otpCode, setOtpCode] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  const validatePhone = (value: string) => {
    const digits = value.replace(/\D/g, "")
    return digits.length >= 10 && digits.length <= 15
  }

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setIdentifier(value)
    if (recoveryType === "email") {
      setIdentifierValid(validateEmail(value))
    } else {
      setIdentifierValid(validatePhone(value))
    }
    setError("")
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!identifier) {
      setError(`Please enter your ${recoveryType === "email" ? "email address" : "phone number"}`)
      return
    }

    if (!identifierValid) {
      setError(`Please enter a valid ${recoveryType === "email" ? "email address" : "phone number"}`)
      return
    }

    setIsLoading(true)

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
        throw new Error(data.error || "Failed to send OTP")
      }

      // Store OTP code from response to display in UI
      if (data.otpCode) {
        setOtpCode(data.otpCode)
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 pb-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 font-bold" strokeWidth={2.5} />
              <CardTitle className="text-xl text-slate-900 dark:text-white font-bold">Recover Password</CardTitle>
            </div>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Enter your email or phone number to receive an OTP code
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Recovery Type Selector */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setRecoveryType("email")
                  setIdentifier("")
                  setIdentifierValid(false)
                  setError("")
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${recoveryType === "email"
                  ? "bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4 font-bold" strokeWidth={2.5} />
                  Email
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRecoveryType("phone")
                  setIdentifier("")
                  setIdentifierValid(false)
                  setError("")
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${recoveryType === "phone"
                  ? "bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4 font-bold" strokeWidth={2.5} />
                  Phone
                </div>
              </button>
            </div>

            {success ? (
              <div className="space-y-4">
                <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 p-4 rounded-lg border border-green-200 dark:border-green-500/30">
                  <div className="flex items-start gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 font-bold" strokeWidth={2.5} />
                    <div className="flex-1">
                      <p className="font-semibold mb-1">OTP Generated Successfully!</p>
                      <p className="text-xs mb-3">
                        {recoveryType === "email"
                          ? `For testing purposes, your OTP code is displayed below. In production, this would be sent to ${identifier}.`
                          : `For testing purposes, your OTP code is displayed below. In production, this would be sent to ${identifier}.`}
                      </p>
                    </div>
                  </div>
                  {otpCode && (
                    <div className="bg-white dark:bg-slate-700 p-4 rounded-lg border-2 border-purple-500 dark:border-purple-400 text-center">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium">Your OTP Code:</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 tracking-widest font-mono mb-3">{otpCode}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">This code expires in 10 minutes</p>
                    </div>
                  )}
                  <Button
                    onClick={() => router.push(`/verify-otp?${recoveryType}=${encodeURIComponent(identifier)}`)}
                    className="w-full h-11 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mt-4"
                  >
                    Continue to Verify OTP
                    <ArrowRight className="ml-2 w-4 h-4 font-bold" strokeWidth={2.5} />
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Identifier Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    {recoveryType === "email" ? (
                      <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400 font-bold" strokeWidth={2.5} />
                    ) : (
                      <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400 font-bold" strokeWidth={2.5} />
                    )}
                    {recoveryType === "email" ? "Email Address" : "Phone Number"}
                  </label>
                  <div className="relative">
                    <Input
                      type={recoveryType === "email" ? "email" : "tel"}
                      placeholder={
                        recoveryType === "email" ? "your.email@example.com" : "+1234567890 or 01712345678"
                      }
                      value={identifier}
                      onChange={handleIdentifierChange}
                      className={`pl-10 pr-10 h-11 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 ${error && !identifierValid
                        ? "border-red-500 dark:border-red-500"
                        : identifierValid
                          ? "border-green-500 dark:border-green-500"
                          : "border-slate-300 dark:border-slate-600"
                        } text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all`}
                      required
                      disabled={isLoading}
                    />
                    {recoveryType === "email" ? (
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 font-bold" strokeWidth={2.5} />
                    ) : (
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 font-bold" strokeWidth={2.5} />
                    )}
                    {identifierValid && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 font-bold" strokeWidth={2.5} />
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/30 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 font-bold" strokeWidth={2.5} />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !identifier || !identifierValid}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP Code
                      <ArrowRight className="ml-2 w-4 h-4 font-bold" strokeWidth={2.5} />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Back to Login */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4 font-bold" strokeWidth={2.5} />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

