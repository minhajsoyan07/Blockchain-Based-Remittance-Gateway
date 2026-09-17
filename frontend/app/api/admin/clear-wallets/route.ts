import { NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-db"

// This endpoint is intentionally small and guarded by an ADMIN_KEY environment
// variable. To call it, send a POST with header 'x-admin-key' set to the same
// value as process.env.ADMIN_KEY. It clears all walletAddress fields from the
// server-side users store. Keep ADMIN_KEY secret.

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const adminKey = process.env.ADMIN_KEY
    const provided = request.headers.get("x-admin-key") || undefined

    if (!adminKey) {
      return NextResponse.json({ error: "Server admin key not configured" }, { status: 403 })
    }

    if (!provided || provided !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allUsers = users.get()
    let changed = false
    for (const [id, u] of Object.entries(allUsers)) {
      if (u && typeof u === 'object' && (u as any).walletAddress !== undefined) {
        delete (allUsers as any)[id].walletAddress
        changed = true
      }
    }

    if (changed) {
      users.save(allUsers)
    }

    return NextResponse.json({ ok: true, removed: changed }, { status: 200 })
  } catch (err) {
    console.error('Admin clear-wallets error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
