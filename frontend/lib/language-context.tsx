"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

type Language = "en" | "bn" | "es"

interface LanguageConfig {
  label: string
  locale: string
  className: string
}

const LANGUAGE_CONFIG: Record<Language, LanguageConfig> = {
  en: { label: "English", locale: "en", className: "lang-en" },
  bn: { label: "বাংলা", locale: "bn", className: "lang-bn" },
  es: { label: "Español", locale: "es", className: "lang-es" },
}

export const AVAILABLE_LANGUAGES: Array<{ value: Language; label: string }> = Object.entries(LANGUAGE_CONFIG).map(
  ([value, { label }]) => ({ value: value as Language, label }),
)

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const STORAGE_KEY = "remittancepay_language"

const applyLanguage = (language: Language) => {
  if (typeof document === "undefined") return

  const config = LANGUAGE_CONFIG[language] ?? LANGUAGE_CONFIG.en
  const root = document.documentElement
  const classNames = Object.values(LANGUAGE_CONFIG).map(({ className }) => className)

  root.setAttribute("lang", config.locale)
  root.classList.remove(...classNames)
  root.classList.add(config.className)

  localStorage.setItem(STORAGE_KEY, language)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem(STORAGE_KEY) as Language | null
    const initialLanguage = stored && LANGUAGE_CONFIG[stored] ? stored : "en"
    setLanguageState(initialLanguage)
    applyLanguage(initialLanguage)
    setMounted(true)
  }, [])

  const setLanguage = (nextLanguage: Language) => {
    if (!LANGUAGE_CONFIG[nextLanguage]) return
    setLanguageState(nextLanguage)
    applyLanguage(nextLanguage)
  }

  const value = useMemo(() => ({ language, setLanguage }), [language])

  if (!mounted) {
    return <>{children}</>
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
