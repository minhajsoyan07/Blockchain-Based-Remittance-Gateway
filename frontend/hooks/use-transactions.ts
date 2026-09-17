"use client"

import { useState, useCallback, useEffect } from "react"
import { transactionCache, userInfoCache } from "@/lib/transaction-cache"

interface Transaction {
  id: string
  fromUserId: string
  fromAddress?: string
  toAddress: string
  amount: number
  gasFee: number
  currency: string
  status: "pending" | "completed" | "failed"
  timestamp: number
  txHash?: string
  description?: string
  executionTime?: number
  type?: string
  recipient?: string
  metadata?: {
    details?: string
    [key: string]: unknown
  }
}

interface UserInfo {
  id: string
  fullName: string
  email: string
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userInfoMap, setUserInfoMap] = useState<Record<string, UserInfo>>({})

  const fetchUserInfoBatch = useCallback(async (userIds: string[]) => {
    const cachedEntries = userIds
      .map((id) => {
        const cached = userInfoCache.get(id)
        return cached ? { userId: id, data: cached as UserInfo } : null
      })
      .filter((entry): entry is { userId: string; data: UserInfo } => entry !== null)

    if (cachedEntries.length) {
      setUserInfoMap((prev) => ({ ...prev, ...Object.fromEntries(cachedEntries.map((entry) => [entry.userId, entry.data])) }))
    }

    const newUserIds = userIds.filter((id) => !userInfoCache.has(id))
    if (newUserIds.length === 0) return

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const responses = await Promise.allSettled(
        newUserIds.map(async (userId) => {
          const response = await fetch(`/api/auth/get-user-info?userId=${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`)
          }

          const data = (await response.json()) as UserInfo
          userInfoCache.set(userId, data)
          return { userId, data }
        }),
      )

      const aggregated: Record<string, UserInfo> = {}

      responses.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          aggregated[result.value.userId] = result.value.data
        } else if (result.status === "rejected") {
          console.error("Failed to fetch user info:", result.reason)
        }
      })

      if (Object.keys(aggregated).length > 0) {
        setUserInfoMap((prev) => ({ ...prev, ...aggregated }))
      }
    } catch (error) {
      console.error("Failed to fetch user info batch:", error)
    }
  }, [])

  const fetchTransactions = useCallback(
    async (forceRefresh = false) => {
      try {
        if (!forceRefresh) {
          const cached = transactionCache.get("user_transactions")
          if (cached) {
            const cachedData = cached as Transaction[];
            cachedData.sort((a, b) => b.timestamp - a.timestamp);
            setTransactions(cachedData)
            setIsLoading(false)
            return
          }
        }

        setIsRefreshing(true)
        const token = localStorage.getItem("auth_token")
        if (!token) {
          throw new Error("Not authenticated")
        }

        const response = await fetch("/api/transactions/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch transactions")
        }

        const data = (await response.json()) as Transaction[]
        // Client-side sort safety
        if (data && Array.isArray(data)) {
          data.sort((a, b) => b.timestamp - a.timestamp)
        }
        transactionCache.set("user_transactions", data || [])
        setTransactions(data || [])

        if (data && data.length > 0) {
          const userIds = [...new Set(data.map((tx: Transaction) => tx.fromUserId))]
          await fetchUserInfoBatch(userIds)
        }

        setError("")
      } catch (err) {
        console.error("Error fetching transactions:", err)
        setError(err instanceof Error ? err.message : "Failed to load transactions")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [fetchUserInfoBatch],
  )

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return {
    transactions,
    isLoading,
    error,
    isRefreshing,
    userInfoMap,
    fetchTransactions,
  }
}
