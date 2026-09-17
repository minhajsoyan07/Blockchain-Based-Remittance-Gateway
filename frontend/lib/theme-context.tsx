"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type ResolvedTheme = "light" | "dark"
type ThemeMode = ResolvedTheme | "system"

interface ThemeContextType {
  mode: ThemeMode
  resolvedTheme: ResolvedTheme
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = "remittancepay_theme"

const getSystemPreference = (): ResolvedTheme =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"

const applyThemeClass = (theme: ResolvedTheme) => {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)

  document.body.classList.remove("light", "dark")
  document.body.classList.add(theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system")
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark")

  useEffect(() => {
    if (typeof window === "undefined") return

    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null) ?? "system"
    setMode(stored)
    const initialResolved = stored === "system" ? getSystemPreference() : stored
    setResolvedTheme(initialResolved)
    applyThemeClass(initialResolved)

    if (stored === "system") {
      const listener = (event: MediaQueryListEvent) => {
        const nextResolved = event.matches ? "dark" : "light"
        setResolvedTheme(nextResolved)
        applyThemeClass(nextResolved)
      }
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", listener)
      return () => mediaQuery.removeEventListener("change", listener)
    }
  }, [])

  const setTheme = (nextMode: ThemeMode) => {
    setMode(nextMode)
    localStorage.setItem(THEME_STORAGE_KEY, nextMode)
    const nextResolved = nextMode === "system" ? getSystemPreference() : nextMode
    setResolvedTheme(nextResolved)
    applyThemeClass(nextResolved)
  }

  const toggleTheme = () => {
    const nextResolved = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(nextResolved)
  }

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
