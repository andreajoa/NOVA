import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUserGenerationAccount } from "@/lib/db";
import {
  getFreeGenerationPolicy,
  getFreeGenerationUsage,
} from "@/lib/freeGenerationQuota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session.userId || null;

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const account = await ensureUserGenerationAccount(userId);
  const policy = getFreeGenerationPolicy(account.plan);
  const [image, video] = await Promise.all([
    getFreeGenerationUsage(userId, "image", account.plan),
    getFreeGenerationUsage(userId, "video", account.plan),
  ]);

  return NextResponse.json({
    success: true,
    plan: account.plan,
    paid: policy.paid,
    resetAt: policy.resetAt,
    image: {
      used: image.used,
      limit: image.limit,
      remaining: image.remaining,
      resolution: "1K",
      credits: 0,
    },
    video: {
      used: video.used,
      limit: video.limit,
      remaining: video.remaining,
      maxSeconds: policy.maxVideoSeconds,
      durations: policy.videoDurations,
      resolution: "480p",
      credits: 0,
    },
  });
}
