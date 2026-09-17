"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock } from "lucide-react"

interface PasswordModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (password: string) => Promise<void>
    mode: 'setup' | 'verify'
    title?: string
    description?: string
}

export function PasswordModal({ isOpen, onClose, onSubmit, mode, title, description }: PasswordModalProps) {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!password) {
            setError("Password is required")
            return
        }

        if (mode === 'setup' && password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (mode === 'setup' && password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        setIsLoading(true)
        try {
            await onSubmit(password)
            setPassword("")
            setConfirmPassword("")
            onClose()
        } catch (err: any) {
            setError(err.message || "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title || (mode === 'setup' ? "Set Wallet Password" : "Enter Wallet Password")}</DialogTitle>
                    <DialogDescription>
                        {description || (mode === 'setup'
                            ? "Create a secure password to protect your wallets. You will need this to restore or access them later."
                            : "Please enter your wallet security password to continue.")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={mode === 'setup' ? "Create a password" : "Enter your password"}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {mode === 'setup' && (
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-500 flex items-center gap-2">
                            <Lock size={14} />
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Processing..." : (mode === 'setup' ? "Set Password" : "Unlock")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
