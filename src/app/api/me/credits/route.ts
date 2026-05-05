import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { ensureUserGenerationAccount } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const VIDEO_CREDITS_PER_SECOND = 24
const DEFAULT_VIDEO_SECONDS = 5

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requiredEnv = [
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_D1_DATABASE_ID",
      "CLOUDFLARE_API_TOKEN",
    ]

    const missing = requiredEnv.filter((key) => !process.env[key])

    if (missing.length) {
      return NextResponse.json(
        {
          error: `Missing production env: ${missing.join(", ")}`,
        },
        { status: 500 }
      )
    }

    const account = await ensureUserGenerationAccount(userId)

    return NextResponse.json({
      plan: account.plan,
      credits: account.credits,
      videoCreditsPerSecond: VIDEO_CREDITS_PER_SECOND,
      defaultVideoSeconds: DEFAULT_VIDEO_SECONDS,
      defaultVideoCost: VIDEO_CREDITS_PER_SECOND * DEFAULT_VIDEO_SECONDS,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load credits",
      },
      { status: 500 }
    )
  }
}
