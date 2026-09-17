"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertCircle, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, Mail, Phone } from "lucide-react"
import Link from "next/link"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const phone = searchParams.get("phone")
  const identifier = email || phone || ""
  const recoveryType = email ? "email" : "phone"

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!identifier) {
      router.push("/forgot-password")
    }
  }, [identifier, router])

  const checkPasswordStrength = (value: string): "weak" | "medium" | "strong" | null => {
    if (value.length === 0) return null
    if (value.length < 8) return "weak"
    const hasUpper = /[A-Z]/.test(value)
    const hasLower = /[a-z]/.test(value)
    const hasNumber = /[0-9]/.test(value)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value)
    const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
    if (criteriaCount >= 3 && value.length >= 12) return "strong"
    if (criteriaCount >= 2) return "medium"
    return "weak"
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    setPasswordStrength(checkPasswordStrength(value))
    setError("")
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength === "strong") return "text-green-600 dark:text-green-400"
    if (passwordStrength === "medium") return "text-yellow-600 dark:text-yellow-400"
    if (passwordStrength === "weak") return "text-red-600 dark:text-red-400"
    return "text-slate-400"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength === "strong") return "Strong"
    if (passwordStrength === "medium") return "Medium"
    if (passwordStrength === "weak") return "Weak"
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          type: recoveryType,
          newPassword: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.")
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
              <CardTitle className="text-xl text-slate-900 dark:text-white font-bold">Reset Password</CardTitle>
            </div>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Create a new secure password for your account
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
            {success ? (
              <div className="space-y-4">
                <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 p-4 rounded-lg border border-green-200 dark:border-green-500/30 flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 font-bold" strokeWidth={2.5} />
                  <div>
                    <p className="font-semibold mb-1">Password Reset Successful!</p>
                    <p className="text-xs">Your password has been updated. Redirecting to login...</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 font-bold" strokeWidth={2.5} />
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={password}
                      onChange={handlePasswordChange}
                      className="pl-10 pr-10 h-11 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all"
                      required
                      disabled={isLoading}
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 font-bold" strokeWidth={2.5} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 font-bold" strokeWidth={2.5} />
                      ) : (
                        <Eye className="w-4 h-4 font-bold" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                  {password && (
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${getPasswordStrengthColor()}`}>
                        {getPasswordStrengthText() && `Password Strength: ${getPasswordStrengthText()}`}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {password.length}/8+ characters
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0 font-bold" strokeWidth={2.5} />
                    <span>Use 8+ characters with mix of letters, numbers, and symbols</span>
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 font-bold" strokeWidth={2.5} />
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setError("")
                      }}
                      className={`pl-10 pr-10 h-11 text-sm bg-slate-50 dark:bg-slate-700/50 border-2 ${confirmPassword && password !== confirmPassword
                        ? "border-red-500 dark:border-red-500"
                        : confirmPassword && password === confirmPassword
                          ? "border-green-500 dark:border-green-500"
                          : "border-slate-300 dark:border-slate-600"
                        } text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all`}
                      required
                      disabled={isLoading}
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 font-bold" strokeWidth={2.5} />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 font-bold" strokeWidth={2.5} />
                      ) : (
                        <Eye className="w-4 h-4 font-bold" strokeWidth={2.5} />
                      )}
                    </button>
                    {confirmPassword && password === confirmPassword && (
                      <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 font-bold" strokeWidth={2.5} />
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
                  disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="ml-2 w-4 h-4 font-bold" strokeWidth={2.5} />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Back Link */}
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

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  )
}




