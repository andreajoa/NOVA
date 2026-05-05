import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { ensureUserGenerationAccount } from "@/lib/db"

export const runtime = "nodejs"

const VIDEO_CREDITS_PER_SECOND = 24
const DEFAULT_VIDEO_SECONDS = 5

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const account = await ensureUserGenerationAccount(userId)

  return NextResponse.json({
    plan: account.plan,
    credits: account.credits,
    videoCreditsPerSecond: VIDEO_CREDITS_PER_SECOND,
    defaultVideoSeconds: DEFAULT_VIDEO_SECONDS,
    defaultVideoCost: VIDEO_CREDITS_PER_SECOND * DEFAULT_VIDEO_SECONDS,
  })
}
