"use client"

import { useState, useEffect } from "react"
import { SignupForm } from "@/components/auth/signup-form"
import { useRouter } from "next/navigation"

export default function SignupPage() {
    const router = useRouter()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return null

    return <SignupForm onSwitchToLogin={() => router.push("/login")} />
}
