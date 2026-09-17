"use client"

import { WalletManager } from "@/components/wallet/wallet-manager"
import { Separator } from "@/components/ui/separator"
import { User, Shield, Wallet, Bell, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string
        title: string
        icon: React.ReactNode
    }[]
    activeTab: string
    onTabChange: (tab: string) => void
}

function SidebarNav({ className, items, activeTab, onTabChange, ...props }: SidebarNavProps) {
    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <Button
                    key={item.href}
                    variant={activeTab === item.title ? "secondary" : "ghost"}
                    className={cn(
                        "justify-start gap-2",
                        activeTab === item.title && "bg-muted hover:bg-muted"
                    )}
                    onClick={() => onTabChange(item.title)}
                >
                    {item.icon}
                    {item.title}
                </Button>
            ))}
        </nav>
    )
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("Wallets")
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return null

    const sidebarNavItems = [
        {
            title: "Profile",
            href: "/dashboard/settings/profile",
            icon: <User size={18} />,
        },
        {
            title: "Security",
            href: "/dashboard/settings/security",
            icon: <Shield size={18} />,
        },
        {
            title: "Wallets",
            href: "/dashboard/settings",
            icon: <Wallet size={18} />,
        },
        {
            title: "Billing",
            href: "/dashboard/settings/billing",
            icon: <CreditCard size={18} />,
        },
        {
            title: "Notifications",
            href: "/dashboard/settings/notifications",
            icon: <Bell size={18} />,
        },
    ]

    return (
        <div className="hidden space-y-6 p-10 pb-16 md:block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <SidebarNav
                        items={sidebarNavItems}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </aside>
                <div className="flex-1 lg:max-w-4xl">
                    {activeTab === "Wallets" && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-medium">Wallet Management</h3>
                                <p className="text-sm text-muted-foreground">
                                    Connect and manage your cryptocurrency wallets securely.
                                </p>
                            </div>
                            <Separator />
                            <WalletManager />
                        </div>
                    )}
                    {activeTab !== "Wallets" && (
                        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground animate-fade-in">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                {sidebarNavItems.find(i => i.title === activeTab)?.icon}
                            </div>
                            <h3 className="text-lg font-medium">Coming Soon</h3>
                            <p>The {activeTab} settings are currently under development.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
