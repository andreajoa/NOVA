import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUserGenerationAccount, isAdminUser } from "@/lib/db";
import {
  getFreeGenerationPolicy,
  getFreeGenerationUsage,
} from "@/lib/freeGenerationQuota";
import { canUseCloudflareWorkersAI } from "@/lib/cloudflareAiClient";
import { canUseZeroCostVideoWorker } from "@/lib/zeroCostVideoClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session.userId || null;

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const account = await ensureUserGenerationAccount(userId);
  const admin = await isAdminUser(userId);
  const policy = getFreeGenerationPolicy(account.plan);

  // Only expose NOVA availability, never provider/model identity.
  const imageAvailable = Boolean(
    process.env.NOVA_IMAGE_FREE_ENGINE_MODEL && canUseCloudflareWorkersAI()
  );
  const videoAvailable = canUseZeroCostVideoWorker();

  if (admin) {
    return NextResponse.json({
      success: true,
      plan: "admin",
      paid: true,
      admin: true,
      unlimited: true,
      resetAt: null,
      image: {
        used: 0,
        limit: null,
        remaining: null,
        unlimited: true,
        resolution: "1K",
        credits: 0,
        available: imageAvailable,
      },
      video: {
        used: 0,
        limit: null,
        remaining: null,
        unlimited: true,
        maxSeconds: 10,
        durations: [5, 10],
        resolution: "480p",
        credits: 0,
        available: videoAvailable,
      },
    });
  }

  const [image, video] = await Promise.all([
    getFreeGenerationUsage(userId, "image", account.plan),
    getFreeGenerationUsage(userId, "video", account.plan),
  ]);

  return NextResponse.json({
    success: true,
    plan: account.plan,
    paid: policy.paid,
    admin: false,
    unlimited: false,
    resetAt: policy.resetAt,
    image: {
      used: image.used,
      limit: image.limit,
      remaining: image.remaining,
      unlimited: false,
      resolution: "1K",
      credits: 0,
      available: imageAvailable,
    },
    video: {
      used: video.used,
      limit: video.limit,
      remaining: video.remaining,
      unlimited: false,
      maxSeconds: policy.maxVideoSeconds,
      durations: policy.videoDurations,
      resolution: "480p",
      credits: 0,
      available: videoAvailable,
    },
  });
}
