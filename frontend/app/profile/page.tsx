"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type User } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OliveHeader } from "@/components/olive-header"
import { Badge } from "@/components/ui/badge"
import {
  User as UserIcon,
  Wallet,
  Loader2,
  CheckCircle,
  Edit2,
  Lock,
  Trash2,
  Copy,
  ExternalLink,
  Shield,
  Activity,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { setPreventAutoReconnect } from "@/lib/metamask-utils"
import { motion } from "framer-motion"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading, updateProfile, logout, connectWallet, removeWallet, restoreWallet, refreshBalance, disconnectWallet } = useAuth()

  // Global Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<User>>({})

  // Photo Upload State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Wallet Management State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)

  // Wallet Password State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [walletPassword, setWalletPassword] = useState("")
  const [helperText, setHelperText] = useState("")
  const [pendingAddress, setPendingAddress] = useState<string | null>(null)
  const [removalWalletId, setRemovalWalletId] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Initialize form data when entering edit mode
  useEffect(() => {
    if (isEditing && user) {
      setFormData({
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const updates: Partial<User> = { ...formData }
      if (previewUrl) {
        updates.profilePhoto = previewUrl
      }

      await updateProfile(updates)
      toast.success("Profile updated successfully")
      setIsEditing(false)
      setPreviewUrl(null)
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setPreviewUrl(null)
    setFormData({})
  }

  // Wallet Functions
  const handleConnectNewWallet = async () => {
    setIsConnectingWallet(true)
    setHelperText("")
    try {
      const ethereum = (window as any).ethereum
      if (!ethereum || !ethereum.isMetaMask) {
        toast.error("MetaMask is not installed")
        window.open("https://metamask.io", "_blank")
        return
      }

      // 1. Force account selection (Request permissions to open MetaMask modal)
      let accounts: string[] = []
      try {
        // This forces MetaMask to show the account picker
        await ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }]
        })

        // After permission is granted/updated, get the accounts
        accounts = await ethereum.request({ method: "eth_requestAccounts" })
      } catch (err: any) {
        if (err?.code === 4001) {
          // User rejected the request
          setIsConnectingWallet(false)
          return
        }
        // Fallback for wallets that strictly might not support wallet_requestPermissions
        console.warn("wallet_requestPermissions failed, falling back to requestAccounts", err)
        accounts = await ethereum.request({ method: "eth_requestAccounts" })
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found")
      }
      const address = accounts[0]

      // 2. Try to connect (might require password)
      let retries = 2
      while (retries > 0) {
        try {
          // Attempt connection (without password first)
          await connectWallet(address)

          toast.success("Wallet connected successfully")
          setIsWalletModalOpen(false)
          // Clear any prevent flag
          setPreventAutoReconnect(false)
          break
        } catch (connectError: any) {
          const errorMsg = connectError?.message || ""
          const errorString = String(connectError)

          const isPasswordRequired =
            errorMsg.toLowerCase().includes("password required") ||
            errorString.toLowerCase().includes("password required") ||
            (connectError?.code === "SETUP_PASSWORD_REQUIRED")

          if (isPasswordRequired) {
            // Open password modal
            setPendingAddress(address)
            setWalletPassword("")
            setHelperText("To secure your wallet for the first time, please set a security password.")
            setIsPasswordModalOpen(true)
            return // Exit function, wait for password submit
          }

          retries--
          if (retries === 0) throw connectError
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } catch (error: unknown) {
      console.error("Wallet connection error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to connect wallet")
    } finally {
      setIsConnectingWallet(false)
    }
  }

  const handlePasswordSubmit = async () => {
    if (!walletPassword || walletPassword.length < 4) {
      setHelperText("Password must be at least 4 characters")
      return
    }

    // Handle Removal Verification
    if (removalWalletId) {
      setIsSaving(true) // Reuse loading state or add new one
      setHelperText("")
      try {
        await removeWallet(removalWalletId, walletPassword)
        toast.success("Wallet removed successfully")
        setIsPasswordModalOpen(false)
        setRemovalWalletId(null)
        setWalletPassword("")
      } catch (error: unknown) {
        // Fix: Check if error message indicates invalid password
        const msg = error instanceof Error ? error.message : "Failed to remove wallet";
        if (msg.toLowerCase().includes("password")) {
          setHelperText("Incorrect security password")
        } else {
          console.error("Removal error:", error)
          toast.error(msg)
          setHelperText(msg)
        }
      } finally {
        setIsSaving(false)
      }
      return
    }

    if (!pendingAddress) {
      setIsPasswordModalOpen(false)
      return
    }

    setIsConnectingWallet(true)
    setHelperText("")

    try {
      await connectWallet(pendingAddress, undefined, undefined, undefined, walletPassword)

      toast.success("Wallet connected successfully")
      setIsPasswordModalOpen(false)
      setIsWalletModalOpen(false)
      setPreventAutoReconnect(false)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to connect"
      setHelperText(msg)
      toast.error(msg)
    } finally {
      setIsConnectingWallet(false)
    }
  }

  const handleRestoreWallet = async (wallet: any) => {
    if (!confirm(`Switch to wallet ${wallet.address}?`)) return

    setIsConnectingWallet(true)
    try {
      await restoreWallet(wallet.id, "password")
      toast.success("Wallet switched successfully")
    } catch (error) {
      try {
        await connectWallet(wallet.address)
        toast.success("Wallet connected successfully")
      } catch (e) {
        toast.error("Failed to switch wallet")
      }
    } finally {
      setIsConnectingWallet(false)
    }
  }

  const handleRemoveWallet = async (walletId: string) => {
    if (!confirm("Are you sure you want to remove this wallet?")) return

    // Check if security password is required - REMOVED for easier UX
    // if (user?.hasWalletSecurityPassword) {
    //   setRemovalWalletId(walletId)
    //   setWalletPassword("")
    //   setHelperText("Please enter your wallet security password to confirm removal.")
    //   setIsPasswordModalOpen(true)
    //   return
    // }

    // Set prevent flag immediately to stop auto-reconnect
    setPreventAutoReconnect(true)

    try {
      await removeWallet(walletId)
      toast.success("Wallet removed successfully")
    } catch (error) {
      toast.error("Failed to remove wallet")
      // Keep flag true just in case
      setPreventAutoReconnect(true)
    }
  }

  const handleDisconnectWallet = async () => {
    if (!user?.walletAddress) return

    if (!confirm("Are you sure you want to disconnect your wallet?")) return

    setIsConnectingWallet(true)
    try {
      // Use the dedicated disconnect API to ensure wallet status is updated correctly
      await disconnectWallet()

      toast.success("Wallet disconnected successfully")
    } catch (error) {
      console.error("Disconnect error:", error)
      toast.error("Failed to disconnect wallet")
    } finally {
      setIsConnectingWallet(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Address copied to clipboard")
  }

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true)
    try {
      await refreshBalance()
      toast.success("Balance refreshed")
    } catch (error) {
      toast.error("Failed to refresh balance")
    } finally {
      setIsRefreshingBalance(false)
    }
  }

  if (!isMounted || isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <OliveHeader />

        {/* Hero / Header Section - Colorful Gradient like Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden shadow-xl border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
          <div className="relative px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <Avatar className="w-28 h-28 border-4 border-white/30 shadow-2xl ring-4 ring-white/20">
                  <AvatarImage src={previewUrl || user.profilePhoto} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
                    {getInitials(user.fullName || "User")}
                  </AvatarFallback>
                </Avatar>

                {isEditing && (
                  <label className="absolute bottom-1 right-1 p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-lg border-2 border-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                  </label>
                )}
              </motion.div>

              <div className="flex-1 text-center sm:text-left text-white space-y-2">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight drop-shadow-md">{user.fullName}</h1>
                  {user.isVerified && (
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md px-2 py-0.5 shadow-lg text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                <p className="text-blue-100 text-base font-medium">{user.email}</p>
                <div className="flex justify-center sm:justify-start">
                  <span className="text-xs font-mono bg-black/20 text-blue-100 px-2 py-1 rounded-md border border-white/10">
                    ID: <span className="text-white select-all">{user.id}</span>
                  </span>
                </div>
              </div>

              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="bg-white text-indigo-600 hover:bg-blue-50 shadow-lg rounded-full px-6"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-full">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isSaving} size="sm" className="bg-white text-indigo-600 hover:bg-blue-50 rounded-full shadow-lg">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8">
          {/* Main Column */}
          <div className="space-y-8">

            {/* Personal Information Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <UserIcon className="w-6 h-6 text-blue-600" /> Personal Information
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Manage your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Full Name */}
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Full Name</p>
                    {isEditing ? (
                      <Input
                        value={formData.fullName || ""}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        className="max-w-md"
                      />
                    ) : (
                      <p className="text-slate-700 dark:text-slate-300 text-lg">{user.fullName}</p>
                    )}
                  </div>

                  {/* Email (Read Only) */}
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Email Address</p>
                    <div className="flex justify-between items-center">
                      <p className="text-slate-700 dark:text-slate-300 text-lg">{user.email}</p>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500"><Lock className="w-3 h-3 mr-1" /> Read-only</Badge>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Date of Birth</p>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.dateOfBirth || ""}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        className="max-w-md"
                      />
                    ) : (
                      <p className="text-slate-700 dark:text-slate-300 text-lg">
                        {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("en-GB").replace(/\//g, "-") : "Not set"}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Gender</p>
                    {isEditing ? (
                      <select
                        value={formData.gender || ""}
                        onChange={(e) => handleInputChange("gender", e.target.value)}
                        className="w-full max-w-md h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-slate-700 dark:text-slate-300 text-lg">{user.gender || "Not set"}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Phone Number</p>
                    {isEditing ? (
                      <Input
                        value={formData.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className="max-w-md"
                      />
                    ) : (
                      <p className="text-slate-700 dark:text-slate-300 text-lg">{user.phone || "Not set"}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Address</p>
                    {isEditing ? (
                      <Input
                        value={formData.address || ""}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="max-w-md"
                      />
                    ) : (
                      <p className="text-slate-700 dark:text-slate-300 text-lg">{user.address || "Not set"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>


        </div>
      </div>
    </main >
  )
}
