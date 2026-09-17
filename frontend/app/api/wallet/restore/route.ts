import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"
import { parseUserIdFromToken } from "@/lib/auth-utils"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { walletId, password } = body

        if (!walletId || !password) {
            return NextResponse.json({ error: "Wallet ID and password required" }, { status: 400 })
        }

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

        // Verify Password
        if (user.walletSecurityPassword !== password) {
            return NextResponse.json({ error: "Invalid wallet password" }, { status: 403 })
        }

        // Find wallet
        const wallet = user.wallets?.find(w => w.id === walletId)
        if (!wallet) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
        }

        // Deactivate others
        user.wallets?.forEach(w => w.status = 'inactive')

        // Activate target
        wallet.status = 'active'
        wallet.lastActiveAt = Date.now()
        user.walletAddress = wallet.address

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
        console.error("Restore wallet error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
