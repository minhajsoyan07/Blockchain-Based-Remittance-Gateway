"use client"

import { Logo } from "@/components/logo"
import { AppMenu } from "@/components/app-menu"
import { DigitalClock } from "@/components/digital-clock"

export function OliveHeader() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#556B2F] to-[#0EA5E9] shadow-lg mb-6 px-6 py-4 sm:px-8 text-white flex items-center justify-between border border-white/20">
      <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-sm hover:bg-white/20 transition-colors">
        <Logo className="w-48 h-auto" />
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <DigitalClock />
        </div>
        <AppMenu />
      </div>
    </div>
  )
}
