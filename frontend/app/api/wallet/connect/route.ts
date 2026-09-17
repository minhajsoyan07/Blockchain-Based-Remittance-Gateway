import { type NextRequest, NextResponse } from "next/server"
import { users, type Wallet } from "@/lib/mock-db"
import { parseUserIdFromToken } from "@/lib/auth-utils"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { walletAddress, walletName, network, chainId, walletPassword } = body

        if (!walletAddress) {
            return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
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

        const normalizedAddress = walletAddress.toLowerCase()

        // Check if wallet already exists - if so, REACTIVATE it instead of erroring
        const existingWallet = user.wallets?.find(w => w.address.toLowerCase() === normalizedAddress)
        if (existingWallet) {
            // Deactivate other wallets first
            if (user.wallets) {
                user.wallets.forEach(w => w.status = 'inactive')
            }

            // Reactivate this wallet
            existingWallet.status = 'active'
            existingWallet.lastActiveAt = Date.now()
            user.walletAddress = normalizedAddress

            users.save(allUsers)

            return NextResponse.json({
                success: true,
                user: {
                    ...user,
                    password: undefined,
                    walletSecurityPassword: undefined,
                    hasWalletSecurityPassword: !!user.walletSecurityPassword
                },
                message: "Wallet reactivated successfully"
            })
        }

        // Handle Security Password for First Time Connection
        if (!user.walletSecurityPassword) {
            if (!walletPassword) {
                return NextResponse.json(
                    { error: "Setup Password Required", code: "SETUP_PASSWORD_REQUIRED" },
                    { status: 403 }
                )
            }
            user.walletSecurityPassword = walletPassword // In a real app, hash this!
        }

        // Deactivate other wallets
        if (user.wallets) {
            user.wallets.forEach(w => w.status = 'inactive')
        } else {
            user.wallets = []
        }

        // Create new wallet
        const newWallet: Wallet = {
            id: `W${Date.now()}`,
            name: walletName || `Wallet ${user.wallets.length + 1}`,
            address: normalizedAddress,
            network: network || 'Unknown',
            chainId: chainId || 1,
            status: 'active',
            connectedAt: Date.now(),
            lastActiveAt: Date.now(),
            deviceId: 'current-device' // Mock device ID
        }

        user.wallets.push(newWallet)
        user.walletAddress = normalizedAddress

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
        console.error("Connect wallet error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
