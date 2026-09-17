"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"

interface BackButtonProps {
    className?: string
}

export function BackButton({ className }: BackButtonProps) {
    const router = useRouter()

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className={cn(
                "rounded-xl w-12 h-12 bg-gradient-to-br from-orange-400 to-white dark:from-orange-600 dark:to-slate-800 text-black shadow-lg hover:shadow-xl hover:opacity-90 transition-all",
                className
            )}
        >
            <ArrowLeft className="w-6 h-6" />
        </Button>
    )
}
