"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    LayoutDashboard,
    Settings,
    History,
    MessageCircle,
    LogOut,
    Moon,
    Sun,
    TrendingUp,
    Menu,
    User,
} from "lucide-react"
import Link from "next/link"

const getInitials = (name: string) => {
    if (!name) return "U"
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

export function AppMenu() {
    const router = useRouter()
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const { resolvedTheme: theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            try {
                localStorage.removeItem("auth_token")
                window.location.href = "/"
            } catch (error) {
                window.location.href = "/"
            }
        }
    }

    const navigationLinks = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/transactions", label: "Transactions", icon: History },
        { href: "/analytics", label: "Analytics", icon: TrendingUp },
        { href: "/profile", label: "Profile", icon: User },
        { href: "/settings", label: "Settings", icon: Settings },
    ]

    const MenuContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className={`${isMobile ? "w-full" : "w-80"}`}>
            {/* User Profile Section */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14 border-2 border-blue-600">
                        <AvatarImage src={user?.profilePhoto || "/placeholder.svg"} alt={user?.fullName} />
                        <AvatarFallback className="bg-blue-600 text-white text-lg font-bold">
                            {getInitials(user?.fullName || "")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{user?.fullName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <div className="p-2">
                <div className="space-y-1">
                    {navigationLinks.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => isMobile && setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <Icon className="w-5 h-5" strokeWidth={2} />
                                <span className="font-medium">{label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm"
                >
                    <LogOut className="w-5 h-5" strokeWidth={2} />
                    <span className="font-semibold">Logout</span>
                </button>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop: Dropdown Menu */}
            <div className="hidden md:block">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl w-12 h-12 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg hover:shadow-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border-0"
                        >
                            <Menu className="w-6 h-6" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="p-0 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                        <MenuContent />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile: Sheet Menu */}
            <div className="md:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl w-12 h-12 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg hover:shadow-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border-0"
                        >
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="p-0 w-[300px]">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Menu</SheetTitle>
                        </SheetHeader>
                        <MenuContent isMobile />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}
