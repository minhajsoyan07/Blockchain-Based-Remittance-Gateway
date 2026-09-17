"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const LazyAiAssistant = dynamic(
  () => import("@/components/ai-assistant").then((mod) => ({ default: mod.AiAssistant })),
  {
    ssr: false,
    loading: () => null,
  },
)

export function DeferredAiAssistant() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (!user) {
      setShouldRender(false)
      return
    }

    let timeoutId: number | null = null

    const idleCallback = (window as any).requestIdleCallback as
      | ((cb: () => void, options?: { timeout?: number }) => number)
      | undefined

    if (idleCallback) {
      const handle = idleCallback(() => setShouldRender(true), { timeout: 1500 })
      return () => {
        const cancelIdleCallback = (window as any).cancelIdleCallback as ((handle: number) => void) | undefined
        if (cancelIdleCallback) {
          cancelIdleCallback(handle)
        }
      }
    }

    timeoutId = window.setTimeout(() => setShouldRender(true), 800)

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [user])

  if (!user || pathname === "/chatbot" || !shouldRender) {
    return null
  }

  return <LazyAiAssistant />
}
