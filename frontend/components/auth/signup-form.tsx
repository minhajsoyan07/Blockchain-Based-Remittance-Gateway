"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LockKeyhole, Phone, UserRound, Calendar } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { Logo } from "@/components/logo"

interface SignupFormProps {
  onSwitchToLogin: () => void
}

const sanitize = (value: string) => value.replace(/[<>",{}]/g, "")
const onlyLetters = (value: string) => value.replace(/[^a-zA-Z\s'-]/g, "")
const onlyDigits = (value: string) => value.replace(/[^0-9+]/g, "")

const passwordStrength = (value: string) => {
  if (!value) return { level: 0, label: "Weak" }
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value)) score += 1
  if (/[0-9]/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  const labels = ["Weak", "Medium", "Strong", "Elite"]
  return { level: score, label: labels[Math.min(score, labels.length - 1)] }
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { signup } = useAuth()
  const router = useRouter()

  const passwordMeta = useMemo(() => passwordStrength(password), [password])

  const formValid =
    fullName &&
    email &&
    phone &&
    dateOfBirth &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    agree

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!formValid) {
      if (!fullName) { setError("Full Name is required"); return }
      if (!email) { setError("Email is required"); return }
      if (!phone) { setError("Phone is required"); return }
      if (!dateOfBirth) { setError("Date of Birth is required"); return }
      if (!password) { setError("Password is required"); return }
      if (password !== confirmPassword) { setError("Passwords do not match"); return }
      if (!agree) { setError("You must agree to the Terms of Service"); return }
      return
    }
    setIsLoading(true)
    try {
      await signup(fullName, email, phone, password, dateOfBirth)
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message)
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

          {/* Header — logo only */}
          <div className="bg-gradient-to-r from-[#556B2F] to-[#0EA5E9] px-8 py-6">
            <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Logo className="w-40 h-auto" />
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <div className="mb-7 text-center">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create Account</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Join RemittancePay — send money globally</p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
                <div className="group relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#556B2F]" />
                  <Input
                    type="text"
                    placeholder="Enter Full Name"
                    value={fullName}
                    onChange={(event) => { setFullName(onlyLetters(event.target.value)); setError("") }}
                    className="h-12 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-11 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#556B2F]/50 rounded-lg"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <Input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(event) => { setEmail(sanitize(event.target.value)); setError("") }}
                  className="h-12 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#556B2F]/50 rounded-lg"
                  disabled={isLoading}
                />
              </div>

              {/* Phone + DOB */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                  <div className="group relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#556B2F]" />
                    <Input
                      type="tel"
                      placeholder="Phone"
                      value={phone}
                      onChange={(event) => { setPhone(onlyDigits(event.target.value)); setError("") }}
                      className="h-12 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-11 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#556B2F]/50 rounded-lg"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <div className="group relative">
                    <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#556B2F]" />
                    <Input
                      type="date"
                      value={dateOfBirth}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(event) => { setDateOfBirth(event.target.value); setError("") }}
                      className="h-12 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-11 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#556B2F]/50 rounded-lg"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <div className="group relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#556B2F]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setError("") }}
                    className="h-12 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-11 pr-11 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#556B2F]/50 rounded-lg"
                    disabled={isLoading}
                  />
                  <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
                <div className="group relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#556B2F]" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(event) => { setConfirmPassword(event.target.value); setError("") }}
                    className="h-12 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pl-11 pr-11 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#556B2F]/50 rounded-lg"
                    disabled={isLoading}
                  />
                  <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Password Strength */}
              {password && (
                <div className="space-y-1">
                  <div className="flex h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-full transition-all duration-500 ${passwordMeta.level === 0 ? "bg-slate-200 dark:bg-slate-700 w-0"
                      : passwordMeta.level === 1 ? "bg-red-500 w-1/4"
                        : passwordMeta.level === 2 ? "bg-amber-500 w-2/4"
                          : passwordMeta.level === 3 ? "bg-blue-500 w-3/4"
                            : "bg-emerald-500 w-full"
                      }`} />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-right">
                    Strength: <span className="font-semibold text-slate-700 dark:text-slate-300">{passwordMeta.label}</span>
                  </p>
                </div>
              )}

              {/* Terms */}
              <div className="flex items-start gap-2.5 pt-0.5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-[#556B2F] focus:ring-[#556B2F]"
                />
                <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                  I agree to the{" "}
                  <a href="#" className="font-semibold text-[#556B2F] hover:underline">Terms of Service</a>{" "}
                  and{" "}
                  <a href="#" className="font-semibold text-[#556B2F] hover:underline">Privacy Policy</a>
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-lg bg-gradient-to-r from-[#556B2F] to-[#0EA5E9] hover:opacity-90 text-sm font-bold text-white shadow-lg shadow-[#556B2F]/15 transition-all disabled:opacity-50"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

            </form>
          </div>

          {/* Bottom Panel — like Facebook */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 px-8 py-5 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <button type="button" onClick={onSwitchToLogin} className="font-bold text-[#556B2F] hover:underline">
                Log In
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
