import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createUserApiKey, listUserApiKeys } from "@/lib/apiKeys"
import { getApiCreditBalance } from "@/lib/db"
import { isNovaAdminFromAuth } from "@/lib/novaAdminAccess"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const authState = await auth()
  const { userId, sessionClaims } = authState

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const keys = await listUserApiKeys(userId)
  const adminBypass = await isNovaAdminFromAuth(userId, sessionClaims)
  const wallet = await getApiCreditBalance(userId).catch(() => ({ balance: 0 }))

  return NextResponse.json({
    keys,
    adminBypass,
    apiCreditBalance: wallet.balance,
    canCreateApiKey: true,
    note: "API keys can be created without API credits. API credits are required only when generating from external tools like Claude AI.",
  })
}

export async function POST(request: Request) {
  const authState = await auth()
  const { userId, sessionClaims } = authState

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

  const isAdmin = await isNovaAdminFromAuth(userId, sessionClaims)
  const wallet = await getApiCreditBalance(userId).catch(() => ({ balance: 0 }))
  const result = await createUserApiKey(userId, name)

  return NextResponse.json({
    ...result,
    adminBypass: isAdmin,
    apiCreditBalance: wallet.balance,
    canCreateApiKey: true,
    requiresApiCreditsForGeneration: !isAdmin,
    checkoutUrl: "/checkout/api-credits?pack=starter",
    message: isAdmin
      ? "API Key created. Owner/admin can use this key without API credit debit."
      : "API Key created. Buy API credits before generating from Claude AI.",
  })
}
