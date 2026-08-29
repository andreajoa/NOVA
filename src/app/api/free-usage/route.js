import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUserGenerationAccount, isAdminUser } from "@/lib/db";
import { isNovaAdminFromAuth } from "@/lib/novaAdminAccess";
import {
  getFreeGenerationPolicy,
  getFreeGenerationUsage,
} from "@/lib/freeGenerationQuota";
import { canUseCloudflareWorkersAI } from "@/lib/cloudflareAiClient";
import { isZeroCostVideoWorkerHealthy } from "@/lib/zeroCostVideoClient";
import { getPrivateGpuVideoCapabilities } from "@/lib/privateGpuVideoPool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session.userId || null;

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const account = await ensureUserGenerationAccount(userId);
  const admin = Boolean(
    String(account.plan || "").toLowerCase() === "admin" ||
    await isAdminUser(userId) ||
    await isNovaAdminFromAuth(userId, session.sessionClaims)
  );
  const policy = getFreeGenerationPolicy(account.plan);

  const imageAvailable = Boolean(
    process.env.NOVA_IMAGE_FREE_ENGINE_MODEL && canUseCloudflareWorkersAI()
  );

  const [privateGpu, legacyVideoAvailable] = await Promise.all([
    getPrivateGpuVideoCapabilities().catch(() => ({
      available: false,
      textToVideo: false,
      imageToVideo: false,
      continueVideo: false,
      speechVideo: false,
      providers: [],
    })),
    isZeroCostVideoWorkerHealthy().catch(() => false),
  ]);

  // Text/image video still has the public HF pool as a fallback. Speech video
  // is only exposed when a private GPU reports that Wan S2V is actually ready.
  const videoAvailable = Boolean(
    privateGpu.textToVideo ||
    privateGpu.imageToVideo ||
    legacyVideoAvailable
  );
  const speechAvailable = Boolean(privateGpu.speechVideo);

  const videoCapabilities = {
    textToVideo: Boolean(privateGpu.textToVideo || legacyVideoAvailable),
    imageToVideo: Boolean(privateGpu.imageToVideo || legacyVideoAvailable),
    continueVideo: Boolean(privateGpu.continueVideo || legacyVideoAvailable),
    speechVideo: speechAvailable,
    privateGpu: Boolean(privateGpu.available),
  };

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
        limit: "Ilimitado",
        remaining: "Ilimitado",
        unlimited: true,
        resolution: "1K",
        credits: 0,
        available: imageAvailable,
      },
      video: {
        used: 0,
        limit: "Ilimitado",
        remaining: "Ilimitado",
        unlimited: true,
        maxSeconds: 10,
        durations: [5, 10],
        resolution: "480p",
        credits: 0,
        available: videoAvailable,
        speechAvailable,
        capabilities: videoCapabilities,
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
    resetAt: video.resetAt,
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
      active: video.active !== false,
      paymentRequired: video.reason === "subscription_payment_required",
      active: video.active !== false,
      paymentRequired: video.reason === "subscription_payment_required",
      speechAvailable,
      capabilities: videoCapabilities,
    },
  });
}
