import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json({ message: "Logged out successfully" }, { status: 200 })
}
