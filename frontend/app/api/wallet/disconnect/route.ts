import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"
import { parseUserIdFromToken } from "@/lib/auth-utils"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization")
        const token = authHeader?.replace("Bearer ", "")
        if (!token) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const userId = parseUserIdFromToken(token)
        if (!userId) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        const allUsers = users.get()
        const user = allUsers[userId]
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Deactivate current wallet
        if (user.walletAddress && user.wallets) {
            const currentWallet = user.wallets.find(w => w.address.toLowerCase() === user.walletAddress?.toLowerCase())
            if (currentWallet) {
                currentWallet.status = 'inactive'
            }
        }

        user.walletAddress = undefined // Clear active wallet address

        users.save(allUsers)

        return NextResponse.json({
            success: true,
            user: {
                ...user,
                password: undefined,
                walletSecurityPassword: undefined,
                hasWalletSecurityPassword: !!user.walletSecurityPassword
            }
        }, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
            }
        })

    } catch (error) {
        console.error("Disconnect wallet error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
