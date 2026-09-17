"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type FontOption = "inter" | "poppins" | "manrope" | "space-grotesk" | "solaiman-lipi"

interface FontConfig {
  label: string
  stack: string
  className: string
}

const FONT_CONFIG: Record<FontOption, FontConfig> = {
  inter: {
    label: "Inter",
    stack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    className: "font-inter",
  },
  poppins: {
    label: "Poppins",
    stack: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    className: "font-poppins",
  },
  manrope: {
    label: "Manrope",
    stack: '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    className: "font-manrope",
  },
  "space-grotesk": {
    label: "Space Grotesk",
    stack: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    className: "font-grotesk",
  },
  "solaiman-lipi": {
    label: "SolaimanLipi",
    stack: '"SolaimanLipi", "Noto Sans Bengali", "Kalpurush", sans-serif',
    className: "font-solaiman-lipi",
  },
}

export const AVAILABLE_FONTS: Array<{ value: FontOption; label: string }> = Object.entries(FONT_CONFIG).map(
  ([value, { label }]) => ({ value: value as FontOption, label }),
)

interface FontContextValue {
  font: FontOption
  setFont: (font: FontOption) => void
}

const FontContext = createContext<FontContextValue | undefined>(undefined)

const STORAGE_KEY = "remittancepay_font"

const applyFont = (font: FontOption) => {
  if (typeof document === "undefined") return
  const config = FONT_CONFIG[font] ?? FONT_CONFIG.inter
  const stack = config.stack
  const classNames = Object.values(FONT_CONFIG).map(({ className }) => className)
  const root = document.documentElement
  root.style.setProperty("--app-font", stack)
  root.classList.remove(...classNames)
  root.classList.add(config.className)
  localStorage.setItem(STORAGE_KEY, font)
}

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = useState<FontOption>("inter")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(STORAGE_KEY) as FontOption | null
    const initialFont = stored && FONT_CONFIG[stored] ? stored : "inter"
    setFontState(initialFont)
    applyFont(initialFont)
    setMounted(true)
  }, [])

  const setFont = (nextFont: FontOption) => {
    if (!FONT_CONFIG[nextFont]) return
    setFontState(nextFont)
    applyFont(nextFont)
  }

  const value = useMemo(() => ({ font, setFont }), [font])



  // Always provide context to prevent useFont from throwing during SSR/Static Gen
  // The useEffect will handle the actual font application and localStorage sync
  return (
    <FontContext.Provider value={value}>
      {children}
    </FontContext.Provider>
  )
}

export function useFont() {
  const context = useContext(FontContext)
  if (!context) {
    throw new Error("useFont must be used within FontProvider")
  }
  return context
}
