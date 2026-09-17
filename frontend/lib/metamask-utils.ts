import { ethers } from "ethers"

/**
 * MetaMask Integration Utilities
 * 
 * Provides functions for interacting with MetaMask wallet extension using ethers.js.
 * 
 * Features:
 * - Provider detection and validation
 * - Account connection and retrieval
 * - Network switching
 * - ETH balance queries
 * - Transaction sending
 * - Address formatting
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface WalletError extends Error {
  code?: string | number
}

// ============================================================================
// Constants
// ============================================================================

export const SUPPORTED_NETWORKS = {
  mainnet: "0x1",
  goerli: "0x5",
  sepolia: "0xaa36a7",
  polygon: "0x89",
  mumbai: "0x13881",
  bscTestnet: "0x61"
}

// ============================================================================
// Auto-Reconnect Prevention Utilities
// ============================================================================

export const STORAGE_KEY_PREVENT_RECONNECT = "remittancepay_prevent_auto_reconnect"

export const getPreventAutoReconnect = (): boolean => {
  if (typeof window === "undefined") return false
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREVENT_RECONNECT)
    return stored === "true"
  } catch {
    return false
  }
}

export const setPreventAutoReconnect = (value: boolean) => {
  if (typeof window === "undefined") return
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY_PREVENT_RECONNECT, "true")
    } else {
      localStorage.removeItem(STORAGE_KEY_PREVENT_RECONNECT)
    }
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Provider Management
// ============================================================================

/**
 * Gets the raw Ethereum provider object (window.ethereum or specific provider from array)
 * Useful for direct RPC calls without Ethers abstraction
 */
export const getRawEthereumProvider = (): any => {
  if (typeof window === "undefined") return null
  const ethereum = (window as any).ethereum
  if (!ethereum) return null

  if (ethereum.providers?.length) {
    const provider = ethereum.providers.find((p: any) => p.isMetaMask)
    if (provider) return provider

    // Fallback: Use the first provider if MetaMask specific one isn't found
    if (ethereum.providers[0]) return ethereum.providers[0]
  }

  // Return whatever is there, even if isMetaMask isn't explicitly true (some wallets mask it)
  return ethereum
}

/**
 * Gets the ethers BrowserProvider
 * Returns null if not available (SSR or MetaMask not installed)
 * Handles cases where multiple wallets are installed (Coinbase, Phantom, etc.)
 */
export const getProvider = (): ethers.BrowserProvider | null => {
  const rawProvider = getRawEthereumProvider()
  if (!rawProvider) return null
  return new ethers.BrowserProvider(rawProvider)
}

/**
 * Helper to wait for window.ethereum to be injected
 */
export const waitForProvider = async (timeoutMs = 5000): Promise<any | null> => {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const provider = getRawEthereumProvider()
    if (provider) return provider
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return null
}

// ... existing code ...

// ============================================================================
// Balance Queries
// ============================================================================

/**
 * Gets the ETH balance of an address
 * Returns balance as a string with 6 decimal places, or null if failed
 */
/**
 * Gets the ETH balance of an address with retry logic
 * Returns balance as a string with 6 decimal places, or null if failed
 */
export const getEthBalance = async (address: string): Promise<string | null> => {
  const maxRetries = 3
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      console.log(`[getEthBalance] Attempt ${retryCount + 1}/${maxRetries} for:`, address)

      // Wait for provider to be injected (up to 3s per attempt)
      const rawProvider = await waitForProvider(3000)
      if (!rawProvider) {
        console.warn("[getEthBalance] No provider found")
        return null
      }

      // Create a timeout promise specific to this request
      const timeoutPromise = new Promise<null>((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("Request timed out"))
        }, 5000)
      })

      // Actual fetch logic using raw RPC
      const fetchPromise = (async () => {
        // Direct RPC call - most robust method
        const rawBalanceHex = await rawProvider.request({
          method: 'eth_getBalance',
          params: [address, "latest"]
        })

        if (!rawBalanceHex) throw new Error("Empty response from provider")

        const balance = BigInt(rawBalanceHex)
        const ethBalance = ethers.formatEther(balance)
        const formatted = parseFloat(ethBalance)

        if (formatted < 0) return "0.000000"
        return formatted.toFixed(6)
      })()

      // Race the fetch against the timeout
      // @ts-ignore
      const result = await Promise.race([fetchPromise, timeoutPromise])
      return result as string
    } catch (error: any) {
      console.warn(`[getEthBalance] Attempt ${retryCount + 1} failed:`, error?.message || error)
      retryCount++
      // Wait before retrying (exponential backoff: 500ms, 1000ms, 2000ms)
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retryCount - 1)))
      }
    }
  }

  console.error("[getEthBalance] All attempts failed")
  return null
}

// ============================================================================
// Transaction Sending
// ============================================================================

/**
 * Sends ETH from the connected MetaMask account to a recipient
 */
export const sendEthTransaction = async (toAddress: string, amountInEth: string): Promise<string> => {
  const provider = getProvider()
  if (!provider) throw new Error("MetaMask not installed")

  try {
    const signer = await provider.getSigner()

    // Parse the amount to Wei
    const value = ethers.parseEther(amountInEth)

    // Send transaction
    const tx = await signer.sendTransaction({
      to: toAddress,
      value: value
    })

    // Wait for transaction to be mined (1 confirmation)
    await tx.wait()

    return tx.hash
  } catch (error: any) {
    if (error.code === "ACTION_REJECTED") {
      throw new Error("Transaction rejected by user")
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      throw new Error("Insufficient funds for transaction")
    }
    console.error("Transaction error:", error)
    throw error
  }
}

// ============================================================================
// Address Formatting
// ============================================================================

/**
 * Formats an Ethereum address to a shortened display format
 */
export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// ============================================================================
// Safe Request Wrapper
// ============================================================================

/**
 * Safely makes a request to the Ethereum provider, catching and logging any errors
 * rather than letting them crash the application.
 */
export const safeRequest = async (method: string, params: any[] = []): Promise<any | null> => {
  try {
    const provider = getRawEthereumProvider()
    if (!provider) {
      console.debug(`[safeRequest] Provider not found for method: ${method}`)
      return null
    }

    return await provider.request({ method, params })
  } catch (error: any) {
    // Log but don't throw
    console.warn(`[safeRequest] Error calling ${method}:`, error?.message || error)
    return null
  }
}
