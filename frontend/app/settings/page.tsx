"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, Palette, Bell, Globe, Moon, Sun, Monitor, Info, Sparkles, Building2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { OliveHeader } from "@/components/olive-header"
import { siteConfig } from "@/config/site"
import { checkPasswordStrength, getAuthToken } from "@/lib/auth-utils"

export default function SettingsPage() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { mode, setTheme } = useTheme()

    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
        twoFactorAuth: false,
    })
    const [isSaving, setIsSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState("")

    // Change password state
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [passwordSuccess, setPasswordSuccess] = useState("")
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | "">("")
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/")
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("remittancepay_notifications")
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    setSettings(parsed)
                } catch (error) {
                    console.error("Failed to parse saved notifications:", error)
                }
            }
        }
    }, [])

    const handleSaveSettings = async () => {
        setIsSaving(true)
        setSaveMessage("")
        try {
            localStorage.setItem("remittancepay_notifications", JSON.stringify(settings))
            setSaveMessage("Settings saved successfully!")
            setTimeout(() => setSaveMessage(""), 3000)
        } catch (error) {
            console.error("Failed to save settings:", error)
            setSaveMessage("Failed to save settings")
            setTimeout(() => setSaveMessage(""), 3000)
        } finally {
            setIsSaving(false)
        }
    }

    const handleNewPasswordChange = (value: string) => {
        setNewPassword(value)
        setPasswordStrength(checkPasswordStrength(value))
        setPasswordError("")
    }

    const getPasswordStrengthColor = () => {
        if (passwordStrength === "strong") return "text-emerald-500"
        if (passwordStrength === "medium") return "text-amber-500"
        if (passwordStrength === "weak") return "text-red-500"
        return "text-slate-400"
    }

    const handleChangePassword = async () => {
        setPasswordError("")
        setPasswordSuccess("")

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("Please fill in all fields")
            return
        }

        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters long")
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match")
            return
        }

        if (currentPassword === newPassword) {
            setPasswordError("New password must be different from current password")
            return
        }

        setIsChangingPassword(true)

        try {
            const token = getAuthToken()
            if (!token) {
                setPasswordError("You must be logged in to change your password")
                return
            }

            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to change password")
            }

            setPasswordSuccess("Password changed successfully!")
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setPasswordStrength("")

            setTimeout(() => {
                setIsChangePasswordOpen(false)
                setPasswordSuccess("")
            }, 2000)
        } catch (err) {
            setPasswordError(err instanceof Error ? err.message : "Failed to change password. Please try again.")
        } finally {
            setIsChangingPassword(false)
        }
    }

    const resetPasswordDialog = () => {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setPasswordError("")
        setPasswordSuccess("")
        setPasswordStrength("")
    }

    if (!isMounted || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Loading Settings...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <OliveHeader />

                {/* Header */}
                <Card className="mb-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-6 sm:p-8">
                        <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">Settings</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Manage your preferences and account security
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar / Appearance */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                            <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 font-bold text-base">
                                    <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Appearance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Theme
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'dark', label: 'Dark', icon: Moon },
                                            { value: 'system', label: 'System', icon: Monitor }
                                        ].map(({ value, label, icon: Icon }) => (
                                            <button
                                                key={value}
                                                onClick={() => setTheme(value as "dark" | "system")}
                                                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all text-sm font-medium ${mode === value
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5 mb-1.5" strokeWidth={2} />
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* About RemittancePay Card */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shadow-sm">
                            <CardHeader className="border-b border-blue-200 dark:border-slate-700 pb-4">
                                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 font-bold text-base">
                                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    About RemittancePay
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {/* Company Description */}
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {siteConfig.description}
                                    </p>
                                </div>

                                {/* Founder Info */}
                                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-blue-200 dark:border-slate-700">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
                                            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Founders</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                                {siteConfig.founders.map((founder, i) => (
                                                    <span key={i}>
                                                        {founder}
                                                        {i < siteConfig.founders.length - 1 && <> & <br /></>}
                                                    </span>
                                                ))}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Version Info */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/50 border border-blue-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Version</span>
                                    </div>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{siteConfig.version}</span>
                                </div>

                                {/* Key Features */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Key Features
                                    </p>
                                    <div className="space-y-2">
                                        {siteConfig.features.map((feature, index) => (
                                            <div key={index} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Login & Security Card */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                            <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 font-bold text-base">
                                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Login & Security
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Password</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Update your password regularly</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsChangePasswordOpen(true)}
                                        className="rounded-xl border-slate-300 dark:border-slate-600"
                                    >
                                        Change
                                    </Button>
                                </div>

                                {/* Password Change Dialog */}
                                <Dialog
                                    open={isChangePasswordOpen}
                                    onOpenChange={(open) => {
                                        setIsChangePasswordOpen(open)
                                        if (!open) resetPasswordDialog()
                                    }}
                                >
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Change Password</DialogTitle>
                                            <DialogDescription>
                                                Ensure your account is using a long, random password to stay secure.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Current Password</Label>
                                                <Input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="h-10"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>New Password</Label>
                                                <Input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                                                    className="h-10"
                                                />
                                                {newPassword && (
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-300 ${passwordStrength === "weak"
                                                                    ? "w-1/3 bg-red-500"
                                                                    : passwordStrength === "medium"
                                                                        ? "w-2/3 bg-amber-500"
                                                                        : "w-full bg-emerald-500"
                                                                    }`}
                                                            />
                                                        </div>
                                                        <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                                                            {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Confirm Password</Label>
                                                <Input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="h-10"
                                                />
                                            </div>
                                            {passwordError && (
                                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                                                    {passwordError}
                                                </div>
                                            )}
                                            {passwordSuccess && (
                                                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm">
                                                    {passwordSuccess}
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                                                {isChangingPassword ? "Updating..." : "Update Password"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Two-Step Verification</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                            Add an extra layer of security
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.twoFactorAuth}
                                        onCheckedChange={(c: boolean) => setSettings({ ...settings, twoFactorAuth: c })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notifications Card */}
                        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                            <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
                                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 font-bold text-base">
                                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Notifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Email Notifications</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                            Receive transactional emails
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.emailNotifications}
                                        onCheckedChange={(c: boolean) => setSettings({ ...settings, emailNotifications: c })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">SMS Notifications</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                            Receive SMS alerts
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.smsNotifications}
                                        onCheckedChange={(c: boolean) => setSettings({ ...settings, smsNotifications: c })}
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    {saveMessage && (
                                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                            {saveMessage}
                                        </span>
                                    )}
                                    <Button
                                        onClick={handleSaveSettings}
                                        disabled={isSaving}
                                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                                    >
                                        {isSaving ? "Saving..." : "Save Preferences"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    )
}
