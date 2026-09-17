"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Wallet, ExternalLink, Copy, Check, Trash2, Lock } from "lucide-react"
import { connectMetaMask, formatAddress, getConnectedAccount, safeRequest } from "@/lib/metamask-utils"
import { useAuth } from "@/lib/auth-context"

// ============================================================================
// Persistent Storage for Auto-Reconnect Prevention
// ============================================================================
/**
 * Stores the auto-reconnect prevention flag in localStorage
 * This persists across page refreshes and component remounts
 */
const STORAGE_KEY = "remittancepay_prevent_auto_reconnect"

const getPreventAutoReconnect = (): boolean => {
  if (typeof window === "undefined") return false
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "true"
  } catch {
    return false
  }
}

const setPreventAutoReconnect = (value: boolean) => {
  if (typeof window === "undefined") return
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY, "true")
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Ignore storage errors
  }
}

export function MetaMaskButton() {
  const { user, connectWallet, removeWallet, updateProfile, refreshUserData, refreshBalance } = useAuth()
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  // Password Modal & Removal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [walletPassword, setWalletPassword] = useState("")
  const [helperText, setHelperText] = useState("")
  const [passwordMode, setPasswordMode] = useState<'connect' | 'remove'>('connect')
  const [pendingAddress, setPendingAddress] = useState<string | null>(null)
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null)

  // Developer debug states (visible in dev/debug mode)
  const [debugProviderPresent, setDebugProviderPresent] = useState<boolean | null>(null)
  const [debugChainId, setDebugChainId] = useState<string | null>(null)
  const [debugAccounts, setDebugAccounts] = useState<string[] | null>(null)
  const [lastConnectDurationMs, setLastConnectDurationMs] = useState<number | null>(null)
  const [lastConnectError, setLastConnectError] = useState<string | null>(null)

  // ============================================================================
  // Persistent Auto-Reconnect Prevention (syncs with localStorage)
  // ============================================================================
  // Persistent Auto-Reconnect Prevention (syncs with localStorage)
  // ============================================================================
  const [preventAutoReconnect, setPreventAutoReconnectState] = useState(() => getPreventAutoReconnect())
  // FIX: Use a ref to track the latest value for event listeners that don't re-bind
  const preventAutoReconnectRef = useRef(preventAutoReconnect)

  const isRemovingRef = useRef(false)
  // Fix ref type to be mutable (avoid readonly error by ensuring types align)
  const lastWalletAddressRef = useRef<string | null | undefined>(user?.walletAddress)
  const eventListenersSetupRef = useRef(false)

  // Sync state with localStorage on mount and update ref
  useEffect(() => {
    const stored = getPreventAutoReconnect()
    setPreventAutoReconnectState(stored)
    preventAutoReconnectRef.current = stored
  }, [])

  // Keep ref in sync with state
  useEffect(() => {
    preventAutoReconnectRef.current = preventAutoReconnect
  }, [preventAutoReconnect])

  // ============================================================================
  // Wallet Connection Status Check - COMPLETELY DISABLED if auto-reconnect prevented
  // ============================================================================
  useEffect(() => {
    // ABSOLUTE FIRST CHECK: If auto-reconnect is prevented, DO NOTHING
    if (preventAutoReconnectRef.current && !user?.walletAddress) {
      setCurrentAddress(null)
      // Do not set up any event listeners or checks
      return
    }

    // Skip if we're in the middle of removing wallet
    if (isRemovingRef.current) {
      return
    }

    // Only run if wallet address actually changed (not undefined -> undefined)
    const currentWalletAddress = user?.walletAddress
    if (lastWalletAddressRef.current === currentWalletAddress) {
      // If no change and no wallet, ensure prevent flag is respected
      if (!currentWalletAddress && preventAutoReconnectRef.current) {
        setCurrentAddress(null)
        return
      }
    }

    // If wallet was just removed (went from string to undefined), set prevent flag
    if (lastWalletAddressRef.current && typeof lastWalletAddressRef.current === "string" &&
      (!currentWalletAddress || currentWalletAddress === undefined)) {
      // Wallet was removed - PERMANENTLY prevent auto-reconnection
      setPreventAutoReconnectState(true)
      setPreventAutoReconnect(true)
      preventAutoReconnectRef.current = true
      lastWalletAddressRef.current = undefined
      setCurrentAddress(null)
      return
    }

    lastWalletAddressRef.current = currentWalletAddress

    // Only check MetaMask if user has wallet AND auto-reconnect is NOT prevented
    const checkCurrentAddress = async () => {
      // MULTIPLE CHECKS: Never proceed if auto-reconnect is prevented
      if (preventAutoReconnectRef.current) {
        setCurrentAddress(null)
        return
      }

      if (!user?.walletAddress) {
        setCurrentAddress(null)
        return
      }

      try {
        const address = await getConnectedAccount()
        if (preventAutoReconnectRef.current) {
          setCurrentAddress(null)
          return
        }

        if (address) {
          // Only set if it matches user's wallet in profile
          if (user.walletAddress && user.walletAddress.toLowerCase() === address.toLowerCase()) {
            setCurrentAddress(address)
          } else {
            setCurrentAddress(null)
          }
        } else {
          setCurrentAddress(null)
        }
      } catch (error) {
        console.warn("Failed to check current wallet address:", error)
        setCurrentAddress(null)
      }
    }

    // Only run check if auto-reconnect is NOT prevented
    if (!preventAutoReconnectRef.current) {
      checkCurrentAddress()
    }

    // ============================================================================
    // MetaMask Event Listeners - COMPLETELY DISABLED if auto-reconnect prevented
    // ============================================================================
    // We strictly check eventListenersSetupRef to avoid duplicate listeners.
    // Because we use preventAutoReconnectRef inside, we don't need to depend on state changes to re-bind.
    if (typeof window !== "undefined" && (window as any).ethereum && !eventListenersSetupRef.current) {
      const handleAccountsChanged = (accounts: string[]) => {
        // ABSOLUTE FIRST CHECK: Never process if auto-reconnect is prevented
        // FIX: Read from REF to get the latest value even if closure is stale
        if (preventAutoReconnectRef.current) {
          console.log("Auto-reconnect prevented (event blocked)")
          setCurrentAddress(null)
          return
        }

        if (isRemovingRef.current) {
          return
        }

        // If explicitly disconnected in MM
        if (accounts.length === 0) {
          setCurrentAddress(null)
          return
        }

        if (!user?.walletAddress) {
          setCurrentAddress(null)
          return
        }

        const accountAddress = accounts[0]
        if (user.walletAddress && user.walletAddress.toLowerCase() === accountAddress.toLowerCase()) {
          setCurrentAddress(accountAddress)
        } else {
          setCurrentAddress(null)
        }
      }

      const handleConnect = () => {
        // CRITICAL: MetaMask connect event - NEVER auto-connect if prevented
        if (preventAutoReconnectRef.current) {
          return
        }

        if (!user?.walletAddress) {
          return
        }

        getConnectedAccount()
          .then(address => {
            if (preventAutoReconnectRef.current) {
              setCurrentAddress(null)
              return
            }
            if (address && user?.walletAddress && address.toLowerCase() === user.walletAddress.toLowerCase()) {
              setCurrentAddress(address)
            } else {
              setCurrentAddress(null)
            }
          })
          .catch(() => {
            setCurrentAddress(null)
          })
      }

      const handleChainChanged = () => {
        // Only reload if not prevented and user has wallet
        // if (!preventAutoReconnectRef.current && !isRemovingRef.current && user?.walletAddress) {
        //   window.location.reload()
        // }
      }

        ; (window as any).ethereum.on("accountsChanged", handleAccountsChanged)
        ; (window as any).ethereum.on("connect", handleConnect)
        ; (window as any).ethereum.on("chainChanged", handleChainChanged)

      eventListenersSetupRef.current = true

      return () => {
        if ((window as any).ethereum) {
          ; (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged)
            ; (window as any).ethereum.removeListener("connect", handleConnect)
            ; (window as any).ethereum.removeListener("chainChanged", handleChainChanged)
        }
        eventListenersSetupRef.current = false
      }
    }
  }, [user?.walletAddress, user]) // Removed preventAutoReconnect from dep array to rely on Ref logic for listeners

  // ============================================================================
  // Manual Wallet Connection Handler - ONLY way to connect wallet
  // ============================================================================
  const [connectionStatus, setConnectionStatus] = useState<string>("")

  const handleConnect = useCallback(async () => {
    console.log("handleConnect STARTED")
    // Track timing and provide debug info
    setLastConnectError(null)
    setLastConnectDurationMs(null)
    setConnectionStatus("Initializing...")

    // If preventAutoReconnect is set, clear it so user-initiated connect works
    if (preventAutoReconnect) {
      console.log("Clearing preventAutoReconnect flag")
      setPreventAutoReconnectState(false)
      setPreventAutoReconnect(false)
    }

    setIsConnecting(true)
    setError("")

    // ----------------------------------------------------------------------
    // Safety Timeout: Force stop loading after 15 seconds
    // ----------------------------------------------------------------------
    const safetyTimeout = setTimeout(() => {
      console.warn("SAFETY TIMEOUT FIRED (15s)")
      setIsConnecting((prev) => {
        if (prev) {
          console.warn("Wallet connection timed out (safety check)")
          setError("Connection timed out. Please try again.")
          setConnectionStatus("")
          return false
        }
        return prev
      })
    }, 15000)

    const t0 = performance.now()
    try {
      if (!user) {
        throw new Error("Please log in first before connecting your wallet")
      }

      const ethereum = (window as any).ethereum
      const providerPresent = !!ethereum
      setDebugProviderPresent(providerPresent)

      if (!providerPresent || !ethereum.isMetaMask) {
        throw new Error("MetaMask is not detected. Please install MetaMask and disable other wallet extensions.")
      }

      // CRITICAL: Prompt MetaMask immediately using the direct user gesture.
      // CRITICAL: Prompt MetaMask immediately using the direct user gesture.
      let address: string
      try {
        setConnectionStatus("Requesting MetaMask...")

        // Helpful message if it takes too long
        const hintTimeout = setTimeout(() => {
          setConnectionStatus("Please open MetaMask manually...")
        }, 3000)

        try {
          // DIRECT REQUEST: Skip "silent" checks. User clicked the button, so we Demand the wallet.
          const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[]

          clearTimeout(hintTimeout)

          if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found. Please unlock MetaMask and try again.")
          }
          address = accounts[0]
          setDebugAccounts(accounts || [])
        } catch (reqErr: any) {
          clearTimeout(hintTimeout)
          throw reqErr
        }

      } catch (err: any) {
        console.error("MetaMask interaction error:", err)
        if (err?.code === 4001) {
          throw new Error("Connection request rejected. Please approve the connection in MetaMask.")
        } else if (err?.code === -32002) {
          throw new Error("Check MetaMask: A connection request is already pending.")
        } else if (err?.code === -32603) {
          throw new Error("MetaMask error. Please unlock your wallet and try again.")
        }
        console.error("MetaMask connection error:", err)
        throw err
      }

      // Non-blocking chain ID check
      try {
        const chainId = await safeRequest("eth_chainId")
        if (chainId) setDebugChainId(chainId as string)
      } catch (e) {
        setDebugChainId(null)
      }

      const t1 = performance.now()
      setLastConnectDurationMs(Math.round(t1 - t0))

      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error("Invalid wallet address returned from MetaMask")
      }

      setCurrentAddress(address)
      console.log("MetaMask connected, authenticating with backend...", address)

      // Connect wallet to backend
      let retries = 2
      while (retries > 0) {
        console.log("Backend auth attempt", 3 - retries)
        if (getPreventAutoReconnect()) {
          throw new Error("Wallet connection cancelled")
        }
        try {
          setConnectionStatus("Authenticating...")
          await connectWallet(address)
          console.log("Backend auth success")
          break
        } catch (connectError: any) {
          const errorMsg = connectError?.message || ""
          const errorString = String(connectError)

          console.log("Connect error caught:", { errorMsg, errorString })

          const isPasswordRequired =
            errorMsg.toLowerCase().includes("password required") ||
            errorString.toLowerCase().includes("password required") ||
            (connectError?.code === "SETUP_PASSWORD_REQUIRED")

          if (isPasswordRequired) {
            console.log("Password requirement detected, opening modal")
            clearTimeout(safetyTimeout) // Clear timeout if we open modal
            setIsConnecting(false)
            setPendingAddress(address)
            setWalletPassword("")
            setHelperText("To secure your wallet for the first time, please set a security password.")
            setPasswordMode('connect')
            setIsPasswordModalOpen(true)
            return // Exit handleConnect, wait for user input
          }

          retries--
          if (retries === 0) {
            throw connectError
          }
          console.log("Retrying backend auth in 1s...")
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      setPreventAutoReconnectState(false)
      setPreventAutoReconnect(false)
      lastWalletAddressRef.current = address

      try {
        setConnectionStatus("Finalizing...")
        console.log("Refreshing user data...")
        await refreshUserData()
        console.log("Refreshing balance...")
        await refreshBalance()
        console.log("Finalization complete")
      } catch (refreshError) {
        console.warn("Failed to refresh user data after connection:", refreshError)
      }

    } catch (err: any) {
      console.error("Top level connection error:", err)
      const errorMessage = err instanceof Error ? err.message : err?.message || "Failed to connect wallet"

      if (!isPasswordModalOpen) {
        setError(errorMessage)
        setLastConnectError(errorMessage)
      }
    } finally {
      console.log("handleConnect FINALLY block")
      clearTimeout(safetyTimeout)
      const t2 = performance.now()
      setLastConnectDurationMs(prev => prev ?? Math.round(t2 - t0))

      if (!isPasswordModalOpen) {
        console.log("Setting isConnecting = false")
        setIsConnecting(false)
        setConnectionStatus("")
      }
    }
  }, [user, connectWallet, refreshUserData, refreshBalance, preventAutoReconnect, isPasswordModalOpen])

  const handlePasswordSubmit = async () => {
    if (!walletPassword || walletPassword.length < 4) {
      setHelperText("Password must be at least 4 characters")
      return
    }

    // Connect Mode
    if (passwordMode === 'connect') {
      if (!pendingAddress) {
        setIsPasswordModalOpen(false)
        return
      }

      setIsConnecting(true)
      setHelperText("")

      try {
        // Retry connection WITH password
        await connectWallet(pendingAddress, undefined, undefined, undefined, walletPassword)

        setIsPasswordModalOpen(false)
        setPreventAutoReconnectState(false)
        setPreventAutoReconnect(false)
        lastWalletAddressRef.current = pendingAddress
        setCurrentAddress(pendingAddress)

        try {
          await refreshUserData()
        } catch (refreshError) {
          console.warn("Failed to refresh user data after connection:", refreshError)
        }

      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : "Failed to connect with password"
        setHelperText(errorMessage)
        console.error("Wallet connection error (with password):", errorMessage, err)
      } finally {
        setIsConnecting(false)
      }
    }
    // Remove Mode
    else if (passwordMode === 'remove') {
      if (!pendingRemovalId && !user?.hasWalletSecurityPassword) {
        // Should not happen if logic is correct, but safe fallback
        setIsPasswordModalOpen(false)
        return
      }

      setIsRemoving(true)
      setHelperText("")

      console.log("Removing wallet with password...")
      try {
        // Find ID if not set (fallback)
        let idToRemove = pendingRemovalId
        if (!idToRemove) {
          console.log("No pendingRemovalId, searching user wallets...")
          const currentWallet = user?.wallets?.find(w =>
            w.address.toLowerCase() === user?.walletAddress?.toLowerCase()
          )
          idToRemove = currentWallet?.id ?? null
          console.log("Found wallet ID from list:", idToRemove)
        }

        if (idToRemove) {
          // CRITICAL: Set prevent flag BEFORE removing to block AuthContext auto-reconnect logic
          setPreventAutoReconnectState(true)
          setPreventAutoReconnect(true)
          await removeWallet(idToRemove, walletPassword)
        } else {
          // Fallback
          setPreventAutoReconnectState(true)
          setPreventAutoReconnect(true)
          // CRITICAL FIX: Use null, not undefined. JSON.stringify drops undefined keys!
          await updateProfile({ walletAddress: null })
        }

        setIsPasswordModalOpen(false)

        // Success cleanup
        setCurrentAddress(null)
        lastWalletAddressRef.current = undefined
        setPreventAutoReconnectState(true)
        setPreventAutoReconnect(true)

        try {
          await refreshUserData()
          await refreshBalance()
        } catch (e) { console.warn(e) }

      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : "Failed to remove wallet with password"
        setHelperText(errorMessage)
      } finally {
        setIsRemoving(false)
      }
    }
  }

  // ============================================================================
  // Wallet Removal Handler - Sets permanent prevent flag
  // ============================================================================
  const handleRemoveWallet = useCallback(async () => {
    if (!user) {
      setError("Please log in first")
      return
    }

    if (!user.walletAddress) {
      setError("No wallet connected to remove")
      return
    }

    if (isRemovingRef.current) {
      console.log("Remove ignored: isRemovingRef is true")
      return
    }

    console.log("Starting wallet removal...", {
      hasUser: !!user,
      walletAddress: user?.walletAddress,
      hasPassword: user?.hasWalletSecurityPassword
    })

    setIsRemoving(true)
    isRemovingRef.current = true

    // CRITICAL: Set prevent flag IMMEDIATELY and PERSISTENTLY
    setPreventAutoReconnectState(true)
    setPreventAutoReconnect(true) // Store in localStorage
    setError("")

    try {

      // CRITICAL: Request MetaMask to REVOKE permissions
      // This ensures the next "Connect" click forces a fresh login popup, 
      // fixing the "not properly removing" issue the user observed.
      if ((window as any).ethereum) {
        try {
          console.log("Attempting to revoke MetaMask permissions...")
          await safeRequest("wallet_revokePermissions", [{ eth_accounts: {} }])
          console.log("MetaMask permissions revoked.")
        } catch (revokeErr) {
          console.warn("Could not revoke permissions (not supported by all wallets):", revokeErr)
          // Continue with internal removal anyway
        }
      }

      // Clear local state immediately
      setCurrentAddress(null)
      lastWalletAddressRef.current = undefined

      // Remove wallet from profile (use undefined to clear optional field)
      // Check if we can find the specific wallet ID to remove it completely
      const currentWallet = user.wallets?.find(w =>
        w.address.toLowerCase() === user.walletAddress?.toLowerCase()
      )

      if (currentWallet) {
        // Check if password required
        if (user.hasWalletSecurityPassword) {
          setPendingRemovalId(currentWallet.id)
          setWalletPassword("")
          setHelperText("Please enter your security password to confirm removal.")
          setPasswordMode('remove')
          setIsPasswordModalOpen(true)
          setIsRemoving(false) // Stop spinner, wait for modal
          isRemovingRef.current = false // Allow interactions
          return
        }

        // If we found the specific wallet record, fully remove it
        console.log("Removing wallet via removeWallet:", currentWallet.id)
        await removeWallet(currentWallet.id)
      } else {
        // Fallback: just unset the active wallet address if we can't find the record
        console.log("Wallet record not found, unsetting via updateProfile")
        await updateProfile({ walletAddress: undefined })
      }

      // Ensure prevent flag stays set
      setPreventAutoReconnectState(true)
      setPreventAutoReconnect(true)

      // Auto refresh user data once after successful wallet removal
      try {
        await refreshUserData()
        // Also refresh balance to ensure it clears to 0
        await refreshBalance()
      } catch (refreshError) {
        console.warn("Failed to refresh user data after removal:", refreshError)
        // Don't fail the removal if refresh fails
      }


      // Auto refresh entire dashboard page once after wallet removal
      // This ensures all wallet-related values are cleared (balance, etc.)
      // Fast and reliable reload
      // if (typeof window !== "undefined" && window.location.pathname === "/dashboard") {
      //   // Immediate reload - faster and ensures all state is cleared
      //   setTimeout(() => {
      //     window.location.reload()
      //   }, 300)
      // }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to remove wallet"
      setError(errorMessage)
      console.error("Wallet removal error:", errorMessage, err)

      // Keep prevent flag even on error - user removed wallet
      setPreventAutoReconnectState(true)
      setPreventAutoReconnect(true)
    } finally {
      setIsRemoving(false)
      setTimeout(() => {
        isRemovingRef.current = false
      }, 1000)
    }
  }, [user, updateProfile, refreshUserData])

  const handleCopyAddress = useCallback(() => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [user?.walletAddress])

  const hasWallet = !isRemoving &&
    user?.walletAddress &&
    typeof user.walletAddress === "string" &&
    user.walletAddress.trim() !== ""

  // Render main content based on state
  const renderContent = () => {
    // 1. Loading State (Removing)
    if (isRemoving) {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-center px-4 py-6 bg-secondary/30 rounded-lg border border-border">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-primary font-medium">Removing wallet...</p>
            </div>
          </div>
        </div>
      )
    }

    // 2. Connected State
    if (hasWallet) {
      return (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Connected Wallet</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
                    {formatAddress(user.walletAddress!)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCopyAddress}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full address: <span className="font-mono text-slate-700 dark:text-slate-300 break-all">{user.walletAddress!}</span>
              </p>
            </div>
          </div>

          <Button
            onClick={handleRemoveWallet}
            disabled={isRemoving}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 py-5 rounded-xl font-semibold transition-all duration-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isRemoving ? "Removing..." : "Remove Wallet"}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>
      )
    }

    // 3. Disconnected State (Default)
    return (
      <div className="space-y-2">
        <Button
          type="button"
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isConnecting ? (connectionStatus || "Connecting...") : "Add MetaMask Wallet"}
        </Button>
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive font-medium">{error}</p>
            {error.includes("not installed") && (
              <a
                href="https://metamask.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-destructive mt-2 hover:underline"
              >
                Visit https://metamask.io to install MetaMask
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {!error.includes("not installed") && (
              <p className="text-xs text-destructive/70 mt-1">
                Make sure MetaMask is unlocked and you&apos;re on a supported network
              </p>
            )}
          </div>
        )}
        {/* Developer debug panel — only shown during development or after a debug run */}
        <div className="mt-2 text-center">
          {(error || isConnecting || isRemoving) && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm("Force Reset: This will clear temporary connection data. Continue?")) {
                  setPreventAutoReconnect(true);
                  setPreventAutoReconnectState(true);
                  localStorage.removeItem("remittancepay_prevent_auto_reconnect");
                  setCurrentAddress(null);
                  setIsConnecting(false);
                  setConnectionStatus("");
                  setError("");
                  window.location.reload();
                }
              }}
              className="text-[11px] text-slate-400 hover:text-red-500 underline decoration-dotted transition-colors cursor-pointer"
            >
              Stuck? Force Reset
            </button>
          )}
        </div>

        {(process.env.NODE_ENV !== "production" || debugProviderPresent !== null || lastConnectDurationMs !== null) && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">MetaMask Debug</p>
            <div className="grid grid-cols-1 gap-1">
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Provider present:</span><span className="font-mono">{String(debugProviderPresent)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Chain ID:</span><span className="font-mono">{debugChainId ?? "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Accounts:</span><span className="font-mono break-all">{(debugAccounts && debugAccounts.length) ? debugAccounts.join(", ") : "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Last connect (ms):</span><span className="font-mono">{lastConnectDurationMs ?? "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Last error:</span><span className="font-mono break-all">{lastConnectError ?? "-"}</span></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Final Render: Content + Hoisted Dialog
  return (
    <>
      {renderContent()}

      {/* Password Modal - Always rendered outside conditional content returns */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              {passwordMode === 'connect' ? 'Wallet Security' : 'Confirm Removal'}
            </DialogTitle>
            <DialogDescription>
              {passwordMode === 'connect'
                ? "First time connecting this wallet? Check your wallet ownership by setting a one-time security password."
                : "Enter your wallet security password to confirm the removal of this wallet."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-password-modal">Set Security Password</Label>
              <Input
                id="wallet-password-modal"
                type="password"
                placeholder="Enter your security password"
                value={walletPassword}
                onChange={(e) => setWalletPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePasswordSubmit()
                  }
                }}
              />
              {passwordMode === 'connect' && (
                <p className="text-xs text-muted-foreground">
                  You will need this password to authorize high-value transactions.
                </p>
              )}
            </div>

            {helperText && (
              <p className={`text-sm font-medium ${helperText.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {helperText}
              </p>
            )}

            {passwordMode === 'connect' && pendingAddress && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Connecting To</p>
                <p className="text-xs font-mono break-all">{pendingAddress}</p>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between flex-row gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePasswordSubmit}
              disabled={!walletPassword || isConnecting || isRemoving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isConnecting || isRemoving ? "Processing..." : (passwordMode === 'connect' ? "Confirm & Connect" : "Confirm & Remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
