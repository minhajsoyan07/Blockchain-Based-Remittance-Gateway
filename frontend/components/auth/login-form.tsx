"use client"

import type React from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { Logo } from "@/components/logo"

interface LoginFormProps {
  onSwitchToSignup: () => void
}

const sanitize = (value: string) => value.replace(/[<>"{}]/g, "")

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const identifierError = useMemo(() => {
    if (!identifier) return ""
    return identifier.trim().length >= 3 ? "" : "Enter at least 3 characters"
  }, [identifier])

  const passwordError = useMemo(() => {
    if (!password) return ""
    return password.trim().length >= 6 ? "" : "Password must be at least 6 characters"
  }, [password])

  const isFormValid = identifier.trim().length >= 3 && password.trim().length >= 6

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!isFormValid) {
      setError("Please provide your credentials to continue.")
      return
    }

    setIsLoading(true)

    try {
      await login(identifier.trim().toLowerCase(), password, rememberMe)
      router.push("/dashboard")
    } catch (err) {
      setError("Invalid Password/Email. Please verify and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 flex items-center justify-center p-4">
      {/* Thin gradient bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#556B2F] via-[#2d8a6e] to-[#0EA5E9] z-50" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[540px]"
      >
        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">

          {/* Header — gradient with logo */}
          <div className="bg-gradient-to-r from-[#556B2F] to-[#0EA5E9] px-8 py-6">
            <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Logo className="w-40 h-auto" />
            </div>
          </div>

          {/* Form Body */}
          <div className="px-8 py-8">
            <div className="mb-7 text-center">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Welcome Back</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to your RemittancePay account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              {/* Email / Username */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email or Username</label>
                <div className="group relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#556B2F]" />
                  <Input
                    type="text"
                    name="rpay_identifier_v1"
                    inputMode="email"
                    placeholder="Enter Email or Username"
                    value={identifier}
                    onChange={(event) => { setIdentifier(sanitize(event.target.value)); setError("") }}
                    className="h-12 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-11 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#556B2F]/50 rounded-lg"
                    autoComplete="off"
                    disabled={isLoading}
                  />
                </div>
                {identifierError && <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{identifierError}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-[#0EA5E9] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="group relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#556B2F]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="rpay_password_v1"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setError("") }}
                    className="h-12 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-11 pr-11 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#556B2F]/50 rounded-lg"
                    autoComplete="new-password"
                    disabled={isLoading}
                    data-1p-ignore
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{passwordError}</p>}
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-[#556B2F] focus:ring-[#556B2F]"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">Stay signed in</span>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-lg bg-gradient-to-r from-[#556B2F] to-[#0EA5E9] hover:opacity-90 text-sm font-bold text-white shadow-lg shadow-[#556B2F]/15 transition-all disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Log In"}
              </Button>

              {/* Divider */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-400 uppercase tracking-wide">or continue with</span>
                </div>
              </div>

              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-sm transition-all"
                onClick={() => { }}
              >
                <svg className="mr-2.5 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </form>
          </div>

          {/* Bottom Panel — like Facebook */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 px-8 py-5 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="font-bold text-[#556B2F] hover:underline"
              >
                Create New Account
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-5">
          © {new Date().getFullYear()} RemittancePay. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}
