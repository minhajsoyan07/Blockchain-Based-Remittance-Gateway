"use client"

import { useState, useEffect } from "react"

export function DigitalClock() {
    const [time, setTime] = useState<Date | null>(null)

    useEffect(() => {
        setTime(new Date())
        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    if (!time) return null

    return (
        <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-white shadow-lg min-w-[160px]">
            <div className="text-2xl font-bold tracking-wider font-mono">
                {time.toLocaleTimeString("en-US", {
                    hour12: true,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })}
            </div>
            <div className="text-xs font-medium text-blue-100 uppercase tracking-widest">
                {time.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                })}
            </div>
        </div>
    )
}
