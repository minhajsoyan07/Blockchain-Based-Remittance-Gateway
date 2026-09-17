"use client"

import { useState } from "react"
import { useAuth, type Wallet } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet as WalletIcon, Trash2, Power, Plus, ShieldCheck, Copy, Check, ExternalLink } from "lucide-react"
import { PasswordModal } from "./password-modal"
import { toast } from "sonner"
import { connectMetaMask, formatAddress, setPreventAutoReconnect } from "@/lib/metamask-utils"
import { cn } from "@/lib/utils"

export function WalletManager() {
    const { user, connectWallet, restoreWallet, removeWallet, disconnectWallet, refreshBalance } = useAuth()
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [passwordMode, setPasswordMode] = useState<'setup' | 'verify' | 'remove'>('verify')
    const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
    const [pendingWalletData, setPendingWalletData] = useState<{ address: string, chainId: number } | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [removalWalletId, setRemovalWalletId] = useState<string | null>(null)

    const handleConnectNew = async () => {
        try {
            const { address, chainId } = await connectMetaMask()

            try {
                await connectWallet(address, undefined, undefined, chainId)
                toast.success("Wallet connected successfully")
                // Fetch ETH balance immediately after connection
                await refreshBalance()
            } catch (error: unknown) {
                if (error instanceof Error && (error.message?.includes("Setup Password Required") || error.message?.includes("SETUP_PASSWORD_REQUIRED"))) {
                    setPendingWalletData({ address, chainId })
                    setPasswordMode('setup')
                    setIsPasswordModalOpen(true)
                } else if (error instanceof Error && error.message?.includes("Wallet already saved")) {
                    toast.error(error.message)
                } else {
                    toast.error(error instanceof Error ? `Failed to connect wallet: ${error.message}` : "Failed to connect wallet")
                }
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? `Failed to connect MetaMask: ${error.message}` : "Failed to connect MetaMask")
        }
    }

    const handleRestore = (walletId: string) => {
        setSelectedWalletId(walletId)
        setPasswordMode('verify')
        setIsPasswordModalOpen(true)
    }

    const handleRemove = async (walletId: string) => {
        if (confirm("Are you sure you want to remove this wallet? This action cannot be undone.")) {
            // Check if user has wallet security password set
            if (user?.hasWalletSecurityPassword) {
                // Need password verification - open modal
                setRemovalWalletId(walletId)
                setPasswordMode('remove')
                setIsPasswordModalOpen(true)
            } else {
                // No password required - remove directly
                setPreventAutoReconnect(true)
                try {
                    await removeWallet(walletId)
                    toast.success("Wallet removed successfully")
                } catch (error: unknown) {
                    toast.error(error instanceof Error ? `Failed to remove wallet: ${error.message}` : "Failed to remove wallet")
                    setPreventAutoReconnect(true)
                }
            }
        }
    }

    const handlePasswordSubmit = async (password: string) => {
        try {
            if (passwordMode === 'setup' && pendingWalletData) {
                await connectWallet(pendingWalletData.address, undefined, undefined, pendingWalletData.chainId, password)
                toast.success("Wallet connected and password set successfully")
                setPendingWalletData(null)
                // Fetch ETH balance immediately after connection
                await refreshBalance()
            } else if (passwordMode === 'verify' && selectedWalletId) {
                await restoreWallet(selectedWalletId, password)
                toast.success("Wallet restored successfully")
                setSelectedWalletId(null)
                // Fetch ETH balance immediately after restore
                await refreshBalance()
            } else if (passwordMode === 'remove' && removalWalletId) {
                // Set prevent flag before removal
                setPreventAutoReconnect(true)
                await removeWallet(removalWalletId, password)
                toast.success("Wallet removed successfully")
                setRemovalWalletId(null)
            }
        } catch (error: unknown) {
            throw new Error(error instanceof Error ? error.message : "Operation failed")
        }
    }

    const handleDisconnect = async () => {
        try {
            await disconnectWallet()
            toast.success("Wallet disconnected")
        } catch (error: unknown) {
            toast.error(error instanceof Error ? `Failed to disconnect: ${error.message}` : "Failed to disconnect")
        }
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        toast.success("Address copied to clipboard")
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (!user) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Saved Wallets</h2>
                    <p className="text-muted-foreground">Manage your connected cryptocurrency wallets.</p>
                </div>
                <Button onClick={handleConnectNew} className="gap-2 shadow-lg hover:shadow-xl transition-all">
                    <Plus size={16} /> Connect New Wallet
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {user.wallets?.map((wallet) => (
                    <Card
                        key={wallet.id}
                        className={cn(
                            "relative overflow-hidden transition-all duration-300 hover:shadow-lg group border-2",
                            wallet.status === 'active'
                                ? "border-primary/50 bg-gradient-to-br from-background to-primary/5 dark:from-background dark:to-primary/10"
                                : "hover:border-primary/20"
                        )}
                    >
                        {wallet.status === 'active' && (
                            <div className="absolute top-0 right-0 p-3">
                                <Badge variant="default" className="bg-primary text-primary-foreground shadow-sm animate-fade-in">Active</Badge>
                            </div>
                        )}

                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-3 rounded-xl transition-colors",
                                    wallet.status === 'active' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:text-foreground"
                                )}>
                                    <WalletIcon size={24} />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">{wallet.name}</CardTitle>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold text-muted-foreground">
                                            {formatAddress(wallet.address)}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(wallet.address, wallet.id)}
                                            className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                                            title="Copy Address"
                                        >
                                            {copiedId === wallet.id ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Network</p>
                                    <p className="text-sm font-medium flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        {wallet.network}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Connected</p>
                                    <p className="text-sm font-medium">
                                        {new Date(wallet.connectedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                {wallet.status === 'active' ? (
                                    <Button variant="outline" className="flex-1 gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors" onClick={handleDisconnect}>
                                        <Power size={14} /> Disconnect
                                    </Button>
                                ) : (
                                    <Button variant="default" className="flex-1 gap-2 shadow-sm" onClick={() => handleRestore(wallet.id)}>
                                        <ShieldCheck size={14} /> Connect
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    onClick={() => handleRemove(wallet.id)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {(!user.wallets || user.wallets.length === 0) && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-center text-muted-foreground bg-muted/5 hover:bg-muted/10 transition-colors">
                        <div className="p-4 bg-muted rounded-full mb-4 animate-float">
                            <WalletIcon size={48} className="opacity-50" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No wallets saved</h3>
                        <p className="mb-6 max-w-sm mx-auto">Connect a cryptocurrency wallet to start managing your digital assets securely.</p>
                        <Button onClick={handleConnectNew} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
                            <Plus size={18} /> Connect First Wallet
                        </Button>
                    </div>
                )}
            </div>

            <PasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => {
                    setIsPasswordModalOpen(false)
                    setPendingWalletData(null)
                    setSelectedWalletId(null)
                    setRemovalWalletId(null)
                }}
                onSubmit={handlePasswordSubmit}
                mode={passwordMode === 'remove' ? 'verify' : passwordMode}
                title={
                    passwordMode === 'setup' ? "Secure Your Wallet" :
                        passwordMode === 'remove' ? "Confirm Wallet Removal" :
                            "Unlock Wallet"
                }
                description={
                    passwordMode === 'setup'
                        ? "Set a password to secure your wallet list. You'll need this to restore wallets later."
                        : passwordMode === 'remove'
                            ? "Enter your wallet security password to confirm removal of this wallet."
                            : "Enter your wallet security password to restore this wallet."
                }
            />
        </div >
    )
}
