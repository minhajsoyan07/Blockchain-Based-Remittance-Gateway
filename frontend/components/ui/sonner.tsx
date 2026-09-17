"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
import { useEffect } from "react"
import React from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    useEffect(() => {
        // FILTER: Suppress the persistent "1 error" toast and other noise
        // Prevent multiple patches
        if ((toast.error as any).__isPatched) return;

        const originalError = toast.error
        toast.error = (message: any, data?: any) => {
            // Check for the specific "1 error" string or exact "1"
            if (message === "1 error" || message === "1" || message === 1) {
                console.warn("Suppressed known '1 error' artifact");
                return "";
            }
            // Also partial match if it's a specific known pattern
            if (typeof message === 'string' && message.toLowerCase().trim() === "1 error") {
                return "";
            }

            return originalError(message, data)
        }
            ; (toast.error as any).__isPatched = true;
    }, [])

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
