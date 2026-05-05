import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getApiCreditBalance } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const wallet = await getApiCreditBalance(userId)

  return NextResponse.json({
    balance: wallet.balance,
    packs: {
      starter: { label: "Starter", price: "$10", credits: 140, href: "/checkout/api-credits?pack=starter" },
      growth: { label: "Growth", price: "$25", credits: 375, href: "/checkout/api-credits?pack=growth" },
      pro: { label: "Pro", price: "$50", credits: 800, href: "/checkout/api-credits?pack=pro" },
      scale: { label: "Scale", price: "$100", credits: 1750, href: "/checkout/api-credits?pack=scale" },
    },
  })
}
