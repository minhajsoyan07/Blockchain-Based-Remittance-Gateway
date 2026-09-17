"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return null

    return <LoginForm onSwitchToSignup={() => router.push("/signup")} />
}
