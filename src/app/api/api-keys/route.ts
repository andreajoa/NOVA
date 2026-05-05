import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createUserApiKey, listUserApiKeys } from "@/lib/apiKeys"

export const runtime = "nodejs"

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const keys = await listUserApiKeys(userId)

  return NextResponse.json({ keys })
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const name = String(body.name || "").trim()

  if (!name) {
    return NextResponse.json({ error: "Key name is required" }, { status: 400 })
  }

  if (name.length > 80) {
    return NextResponse.json({ error: "Key name is too long" }, { status: 400 })
  }

  const result = await createUserApiKey(userId, name)

  return NextResponse.json(result)
}
