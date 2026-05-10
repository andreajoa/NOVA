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

  return NextResponse.json({ keys, adminBypass })
}

export async function POST(request: Request) {
  const authState = await auth()
  const { userId, sessionClaims } = authState

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isAdmin = await isNovaAdminFromAuth(userId, sessionClaims)

  if (!isAdmin) {
    const wallet = await getApiCreditBalance(userId)

    if (wallet.balance <= 0) {
      return NextResponse.json(
        {
          error: "API_CREDITS_REQUIRED",
          code: "API_CREDITS_REQUIRED",
          message: "Add API credits before creating an API key.",
          balance: wallet.balance,
          adminBypass: false,
          packs: {
            starter: { label: "Starter", price: "$10", credits: 140, href: "/api/checkout/api-credits?pack=starter" },
            growth: { label: "Growth", price: "$25", credits: 375, href: "/api/checkout/api-credits?pack=growth" },
            pro: { label: "Pro", price: "$50", credits: 800, href: "/api/checkout/api-credits?pack=pro" },
            scale: { label: "Scale", price: "$100", credits: 1750, href: "/api/checkout/api-credits?pack=scale" },
          },
        },
        { status: 402 }
      )
    }
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

  return NextResponse.json({
    ...result,
    adminBypass: isAdmin,
  })
}
