"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"

export interface Wallet {
  id: string
  name: string
  address: string
  network: string
  chainId: number
  status: 'active' | 'inactive'
  connectedAt: number
  lastActiveAt: number
  deviceId?: string
}

export interface User {
  id: string
  email: string
  fullName: string
  username: string

  walletAddress?: string | null
  nid?: string
  phone?: string
  address?: string
  dateOfBirth?: string
  profilePhoto?: string
  balances?: {
    USD: number
    BDT: number
    BTC: number
    ETH: number
    USDT: number
    EUR: number
    GBP: number
  }
  realEthBalance?: number
  gender?: string
  religion?: string
  occupation?: string
  nationalId?: string
  bio?: string
  website?: string
  facebook?: string
  linkedin?: string
  updatedAt?: string
  twoFactorEnabled?: boolean
  wallets?: Wallet[]
  hasWalletSecurityPassword?: boolean
  isVerified?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signup: (fullName: string, email: string, phone: string, password: string, dateOfBirth: string) => Promise<void>
  logout: () => void
  connectWallet: (address: string, walletName?: string, network?: string, chainId?: number, walletPassword?: string) => Promise<void>
  disconnectWallet: () => Promise<void>
  restoreWallet: (walletId: string, password: string) => Promise<void>
  removeWallet: (walletId: string, password?: string) => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
  updateRealEthBalance: (balance: number) => void
  refreshBalance: () => Promise<void>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Instant hydration from cache — avoids blank spinner on page load
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("remittancepay_user_cache")
        if (cached) return JSON.parse(cached)
      } catch { }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(() => {
    // If we have a cached user, skip the loading state entirely
    if (typeof window !== "undefined") {
      try {
        return !sessionStorage.getItem("remittancepay_user_cache")
      } catch { }
    }
    return true
  })
  const connectionPromiseRef = React.useRef<Promise<void> | null>(null)

  // Cache user data whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      if (user) {
        sessionStorage.setItem("remittancepay_user_cache", JSON.stringify(user))
      } else {
        sessionStorage.removeItem("remittancepay_user_cache")
      }
    } catch { }
  }, [user])

  const checkAuth = async () => {
    try {
      // SSR safety check
      if (typeof window === "undefined") {
        setIsLoading(false)
        return
      }

      const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const userData = await response.json()

        // Update user state directly from server data BUT preserve cached balance if wallet matches
        setUser((prevUser) => {
          if (!prevUser) return userData

          // If wallet address matches, keep the cached realEthBalance
          // server returns 0 or undefined for realEthBalance usually
          if (
            prevUser.walletAddress &&
            userData.walletAddress &&
            prevUser.walletAddress.toLowerCase() === userData.walletAddress.toLowerCase() &&
            prevUser.realEthBalance !== undefined &&
            prevUser.realEthBalance > 0
          ) {
            return {
              ...userData,
              realEthBalance: prevUser.realEthBalance
            }
          }

          return userData
        })
      } else {
        setUser(null)
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token")
          sessionStorage.removeItem("auth_token")
          sessionStorage.removeItem("remittancepay_user_cache")
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token")
        sessionStorage.removeItem("auth_token")
        sessionStorage.removeItem("remittancepay_user_cache")
      }
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    checkAuth()
  }, [])



  const refreshUser = async () => {
    await checkAuth()
  }

  const refreshBalance = useCallback(async () => {
    if (!user?.walletAddress) return

    try {
      const { getEthBalance, getPreventAutoReconnect } = await import("@/lib/metamask-utils")
      const newBalance = await getEthBalance(user.walletAddress)

      // If fetching failed (returned null), do NOT update the balance
      if (newBalance === null) return

      const numBalance = Number.parseFloat(newBalance)

      setUser((prevUser) => {
        if (!prevUser) return prevUser
        // Only update if balance actually changed to prevent unnecessary re-renders
        if (prevUser.realEthBalance === numBalance) return prevUser
        return {
          ...prevUser,
          realEthBalance: numBalance,
        }
      })
    } catch (error) {
      console.error("Failed to refresh balance:", error)
    }
  }, [user?.walletAddress])

  const refreshUserData = async () => {
    if (typeof window === "undefined") return

    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    if (!token) {
      setUser(null)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store", // Always fetch fresh data
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null)
          localStorage.removeItem("auth_token")
          sessionStorage.removeItem("auth_token")
        }
        return
      }

      const userData = await response.json()

      // ============================================================================
      // Clean user data - ensure walletAddress is properly handled
      // ============================================================================
      // If walletAddress doesn't exist or is empty, explicitly set to undefined
      if (!userData.walletAddress || typeof userData.walletAddress !== "string" || userData.walletAddress.trim() === "") {
        userData.walletAddress = undefined
      }

      setUser(prevUser => {
        const mergedUser = { ...userData }

        // Ensure walletAddress is correctly undefined if invalid
        if (!mergedUser.walletAddress || typeof mergedUser.walletAddress !== "string" || mergedUser.walletAddress.trim() === "") {
          mergedUser.walletAddress = undefined
        }

        // Preserve cached balance if wallet address matches
        if (
          prevUser &&
          prevUser.walletAddress &&
          mergedUser.walletAddress &&
          prevUser.walletAddress.toLowerCase() === mergedUser.walletAddress.toLowerCase() &&
          prevUser.realEthBalance !== undefined &&
          prevUser.realEthBalance > 0
        ) {
          mergedUser.realEthBalance = prevUser.realEthBalance
        }

        return mergedUser
      })
    } catch (error) {
      console.error("Failed to refresh user data:", error)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Login failed" }))
      throw new Error(errorData.error || "Login failed")
    }

    const data = await response.json()
    if (typeof window !== "undefined") {
      if (rememberMe) {
        localStorage.setItem("auth_token", data.token)
        sessionStorage.removeItem("auth_token") // Ensure no duplicate
      } else {
        sessionStorage.setItem("auth_token", data.token)
        localStorage.removeItem("auth_token") // Ensure no duplicate
      }
    }
    setUser(data.user)
  }

  const signup = async (fullName: string, email: string, phone: string, password: string, dateOfBirth: string) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, phone, password, dateOfBirth }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Signup failed" }))
      throw new Error(errorData.error || "Signup failed")
    }

    const data = await response.json()
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", data.token)
    }
    setUser(data.user)
  }

  // ============================================================================
  // Logout Function
  // ============================================================================
  const logout = useCallback(() => {
    try {
      // Clear user state immediately (optimistic update)
      setUser(null)

      // Clear authentication token from localStorage AND sessionStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("auth_token")
          sessionStorage.removeItem("auth_token")
          sessionStorage.removeItem("remittancepay_user_cache")
        } catch (storageError) {
          console.warn("Failed to remove auth token from storage:", storageError)
        }

        // Call logout API endpoint (non-blocking, doesn't wait for response)
        try {
          fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }).catch((fetchError) => {
            // Silently fail - client-side cleanup is sufficient
            console.warn("Logout API call failed (non-critical):", fetchError)
          })
        } catch (fetchError) {
          // Ignore fetch errors - already cleared client-side
          console.warn("Logout API request error (non-critical):", fetchError)
        }
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Ensure user is cleared even if errors occur
      setUser(null)
      // Try to clear storage as fallback
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("auth_token")
          sessionStorage.removeItem("auth_token")
        } catch { }
      }
    }
  }, [])

  const connectWallet = async (address: string, walletName?: string, network?: string, chainId?: number, walletPassword?: string) => {
    if (!user) {
      throw new Error("Please log in first to connect your wallet")
    }

    // Promise Memoization to handle concurrent connection attempts (Race Condition Fix)
    // If a connection is already in progress (e.g. from event listener), join it instead of failing.
    if (connectionPromiseRef.current) {
      console.log("Joining existing wallet connection request...")
      return connectionPromiseRef.current
    }

    // Create a new connection promise
    const connectionPromise = (async () => {
      // Setup timeout controller
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout for backend

      try {
        if (typeof window === "undefined") {
          throw new Error("Wallet connection is only available in the browser")
        }

        const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
        if (!token) {
          throw new Error("Authentication token not found. Please log in again.")
        }

        const response = await fetch("/api/wallet/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            walletAddress: address,
            walletName,
            network,
            chainId,
            walletPassword
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(errorData.error || "Failed to connect wallet")
        }

        const updatedUser = await response.json()
        setUser(updatedUser.user || updatedUser)
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error("Connection request timed out")
        }
        throw error
      } finally {
        clearTimeout(timeoutId)
        // Clear the promise ref when done (success or failure)
        connectionPromiseRef.current = null
      }
    })()

    // Store the promise
    connectionPromiseRef.current = connectionPromise

    // Return the promise so caller awaits it
    return connectionPromise
  }

  const disconnectWallet = async () => {
    if (!user) return

    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    if (!token) return

    const response = await fetch("/api/wallet/disconnect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || "Failed to disconnect wallet")
    }

    const updatedUser = await response.json()
    setUser(updatedUser.user || updatedUser)
  }

  const restoreWallet = async (walletId: string, password: string) => {
    if (!user) return

    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    if (!token) return

    const response = await fetch("/api/wallet/restore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ walletId, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || "Failed to restore wallet")
    }

    const updatedUser = await response.json()
    setUser(updatedUser.user || updatedUser)
  }

  const removeWallet = async (walletId: string, password?: string) => {
    if (!user) return

    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    if (!token) return

    const response = await fetch("/api/wallet/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ walletId, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || "Failed to remove wallet")
    }

    const updatedUser = await response.json()

    // Explicitly clear wallet data on successful removal
    if (updatedUser) {
      updatedUser.walletAddress = undefined
      updatedUser.realEthBalance = 0
    }

    setUser(updatedUser.user || updatedUser)
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error("Please log in first")
    }

    if (typeof window === "undefined") {
      throw new Error("Profile updates are only available in the browser")
    }

    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    if (!token) {
      throw new Error("Authentication token not found. Please log in again.")
    }

    // ============================================================================
    // Enhanced Profile Update with Retry Logic and Better Error Handling
    // ============================================================================
    let retries = 2
    while (retries > 0) {
      try {
        const response = await fetch("/api/auth/update-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          const errorMessage = errorData.error || "Failed to update profile"

          // Don't retry on validation errors
          if (response.status === 400 || response.status === 401) {
            throw new Error(errorMessage)
          }

          // Retry on server errors
          if (retries > 1) {
            retries--
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          }

          throw new Error(errorMessage)
        }

        const updatedUser = await response.json()

        // ============================================================================
        // Explicit Wallet Address Handling
        // ============================================================================
        // If wallet removal was requested, ensure it's completely removed
        if (updates.walletAddress === null || updates.walletAddress === "") {
          // Explicitly remove walletAddress from user object
          if (updatedUser.walletAddress !== undefined) {
            delete updatedUser.walletAddress
          }
          // CRITICAL: Reset realEthBalance to 0 when wallet is removed
          updatedUser.realEthBalance = 0
          // Ensure it's explicitly set to 0 (not undefined)
          if (updatedUser.realEthBalance === undefined) {
            updatedUser.realEthBalance = 0
          }
        }

        // Ensure walletAddress is undefined (not empty string) if not present
        // This prevents any issues with empty strings being treated as valid addresses
        if (updatedUser.walletAddress === undefined ||
          updatedUser.walletAddress === null ||
          (typeof updatedUser.walletAddress === "string" && updatedUser.walletAddress.trim() === "")) {
          updatedUser.walletAddress = undefined
        }

        // Single atomic state update - prevents multiple re-renders
        setUser(prevUser => {
          // Only update if there's an actual change to prevent unnecessary re-renders
          const prevWallet = prevUser?.walletAddress
          const newWallet = updatedUser.walletAddress
          const walletsMatch = (prevWallet === undefined && newWallet === undefined) ||
            (prevWallet === newWallet)

          if (prevUser &&
            walletsMatch &&
            prevUser.realEthBalance === updatedUser.realEthBalance &&
            prevUser.id === updatedUser.id) {
            // Check if other profile fields changed before returning prevUser
            const profileChanged =
              prevUser.fullName !== updatedUser.fullName ||
              prevUser.email !== updatedUser.email ||
              prevUser.phone !== updatedUser.phone ||
              prevUser.address !== updatedUser.address ||
              prevUser.dateOfBirth !== updatedUser.dateOfBirth ||
              prevUser.gender !== updatedUser.gender ||
              prevUser.profilePhoto !== updatedUser.profilePhoto;

            if (!profileChanged) {
              return prevUser // Return same reference if no change
            }
          }
          return updatedUser
        })
        return
      } catch (error: any) {
        retries--
        if (retries === 0) {
          throw error
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  const updateRealEthBalance = useCallback((balance: number) => {
    setUser((prevUser) => {
      if (!prevUser) return null
      // Only update if balance actually changed to prevent unnecessary re-renders
      if (prevUser.realEthBalance === balance) {
        return prevUser // Return same reference if no change
      }
      return { ...prevUser, realEthBalance: balance }
    })
  }, [])

  // Auto-sync with MetaMask
  useEffect(() => {
    if (!user || typeof window === "undefined" || !(window as any).ethereum) return

    const handleAccountsChanged = async (accounts: string[]) => {
      // Prevent handling events if we are manually connecting/processing
      if (connectionPromiseRef.current) return

      if (accounts.length > 0) {
        const address = accounts[0]

        // If the address is different from current active wallet, try to connect/switch
        if (!user.walletAddress || address.toLowerCase() !== user.walletAddress.toLowerCase()) {
          try {
            // CHECK: Should we prevent auto-reconnection?
            // Synchronous check first for speed
            if (typeof window !== "undefined") {
              const isPrevented = localStorage.getItem("remittancepay_prevent_auto_reconnect") === "true"
              if (isPrevented && !user.walletAddress) {
                console.log("[AuthContext] Auto-sync blocked: Reconnect prevented by user preference")
                return
              }
            }

            // We use the existing connectWallet logic which handles reactivation of existing wallets
            // and creation of new ones (if password allows)
            await connectWallet(address)
            // Refresh balance after switch
            const { getEthBalance } = await import("@/lib/metamask-utils")
            const newBalance = await getEthBalance(address)

            if (newBalance !== null) {
              updateRealEthBalance(Number.parseFloat(newBalance))
            }
          } catch (error: any) {
            console.error("Auto-sync wallet failed:", error)
            // We don't show error toasts here to avoid spamming user if they blindly switch accounts
            // just to check something, unless it's critical. 
            // However, if "Setup Password Required", we can't handle it here easily without UI.
          }
        }
      } else {
        // MetaMask disconnected all accounts
        if (user.walletAddress) {
          disconnectWallet()
        }
      }
    }

    // Check current status on mount/user-load
    const checkCurrentConnection = async () => {
      // IMMEDIATE CHECK: If auto-reconnect is prevented, DO NOT even ask MetaMask
      if (typeof window !== "undefined") {
        const isPrevented = localStorage.getItem("remittancepay_prevent_auto_reconnect") === "true"
        if (isPrevented && !user?.walletAddress) {
          console.log("[AuthContext] Auto-check aborted: Reconnect prevented by user.")
          return
        }
      }

      try {
        const { safeRequest } = await import("@/lib/metamask-utils")
        const accounts = await safeRequest('eth_accounts')

        if (accounts && Array.isArray(accounts) && accounts.length > 0) {
          handleAccountsChanged(accounts)
        }
      } catch (e) {
        console.error("Failed to check initial MM connection", e)
      }
    }

    const ethereum = (window as any).ethereum
    if (ethereum) {
      ethereum.on('accountsChanged', handleAccountsChanged)
      // Initial check
      checkCurrentConnection()
    }

    return () => {
      if (ethereum && ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [user?.id, user?.walletAddress, connectWallet, disconnectWallet, updateRealEthBalance])



  const contextValue = useMemo(() => ({
    user,
    isLoading,
    login,
    signup,
    logout,
    connectWallet,
    disconnectWallet,
    restoreWallet,
    removeWallet,
    updateProfile,
    refreshUser,
    updateRealEthBalance,
    refreshBalance,
    refreshUserData,
  }), [
    user,
    isLoading,
    login,
    signup,
    logout,
    connectWallet,
    disconnectWallet,
    restoreWallet,
    removeWallet,
    updateProfile,
    refreshUser,
    updateRealEthBalance,
    refreshBalance,
    refreshUserData
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
