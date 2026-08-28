import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  ensureUserGenerationAccount,
  isAdminUser,
} from "@/lib/db";
import {
  checkAndDebitFreeGeneration,
  getFreeGenerationPolicy,
  refundFreeGeneration,
} from "@/lib/freeGenerationQuota";
import {
  reserveVideoCapacity,
  refundVideoCapacity,
} from "@/lib/freeVideoCapacity";
import {
  canUseZeroCostVideoWorker,
  isZeroCostVideoWorkerHealthy,
  runZeroCostVideo,
} from "@/lib/zeroCostVideoClient";
import {
  createFreeVideoJob,
  markFreeVideoJobCompleted,
} from "@/lib/freeVideoJobs";
import { runVerifiedVideoRuntime } from "@/lib/verifiedVideoRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const ALLOWED_MODES = new Set(["text-to-video", "image-to-video", "continue-video"]);

function normalizeDuration(value, allowed) {
  const requested = Number(value || 5);
  return allowed.includes(requested) ? requested : null;
}

function normalizeAspect(value) {
  const raw = String(value || "16:9");
  return ["16:9", "9:16", "1:1"].includes(raw) ? raw : "16:9";
}

function safeHttpsUrl(value) {
  const raw = String(value || "").trim();
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function ownedMediaUrl(value) {
  const raw = safeHttpsUrl(value);
  const base = String(process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  return Boolean(raw && base && raw.startsWith(`${base}/`)) ? raw : "";
}

function isUpstreamCapacityError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return [
    "quota",
    "gpu limit",
    "gpu quota",
    "zerogpu",
    "zero gpu",
    "rate limit",
    "rate-limit",
    "too many requests",
    "daily limit",
    "exceeded",
    "capacity",
    "429",
  ].some((needle) => message.includes(needle));
}

export async function POST(req) {
  const session = await auth();
  const userId = session.userId || null;
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt || "").trim();
  const mode = String(body.mode || "text-to-video").trim();

  if (!prompt) {
    return NextResponse.json({ success: false, error: "Prompt is required." }, { status: 400 });
  }
  if (!ALLOWED_MODES.has(mode)) {
    return NextResponse.json({ success: false, error: "Unsupported video mode." }, { status: 400 });
  }

  const account = await ensureUserGenerationAccount(userId);
  const admin = await isAdminUser(userId);
  const policy = getFreeGenerationPolicy(admin ? "admin" : account.plan);
  const allowedDurations = admin ? [5, 10] : policy.videoDurations;
  const duration = normalizeDuration(body.duration || body.seconds, allowedDurations);

  if (!duration) {
    return NextResponse.json(
      {
        success: false,
        code: "NOVA_VIDEO_DURATION_NOT_ALLOWED",
        message: `Duração permitida: ${allowedDurations.map((n) => `${n}s`).join(" ou ")}.`,
        allowedDurations,
      },
      { status: 400 }
    );
  }

  let imageUrl = "";
  let sourceVideoUrl = "";

  if (mode === "image-to-video") {
    imageUrl = ownedMediaUrl(body.image_url);
    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "Invalid NOVA reference image." }, { status: 400 });
    }
  }

  if (mode === "continue-video") {
    sourceVideoUrl = ownedMediaUrl(body.source_video_url);
    if (!sourceVideoUrl) {
      return NextResponse.json({ success: false, error: "Invalid NOVA source video." }, { status: 400 });
    }

    if (!canUseZeroCostVideoWorker()) {
      return NextResponse.json(
        {
          success: false,
          code: "NOVA_VIDEO_TEMPORARILY_UNAVAILABLE",
          message: "A continuação de vídeo ainda não está disponível neste ambiente.",
        },
        { status: 503 }
      );
    }

    const healthy = await isZeroCostVideoWorkerHealthy();
    if (!healthy) {
      return NextResponse.json(
        {
          success: false,
          code: "NOVA_VIDEO_TEMPORARILY_UNAVAILABLE",
          message: "O motor de continuação de vídeo está temporariamente indisponível.",
        },
        { status: 503 }
      );
    }
  }

  let capacity = null;
  if (!admin) {
    capacity = await reserveVideoCapacity(duration);
    if (!capacity.ok) {
      return NextResponse.json(
        {
          success: false,
          code: "NOVA_VIDEO_DAILY_CAPACITY_REACHED",
          message: "A capacidade incluída de NOVA VIDEO foi utilizada hoje. Tente novamente após a renovação diária.",
          resetAt: capacity.resetAt,
        },
        { status: 429 }
      );
    }
  }

  let quota = null;
  if (!admin) {
    quota = await checkAndDebitFreeGeneration(userId, "video", account.plan);
    if (!quota.ok) {
      if (capacity?.ok) await refundVideoCapacity(capacity.units).catch(() => {});
      return NextResponse.json(
        {
          success: false,
          code: "FREE_MODEL_DAILY_LIMIT_REACHED",
          message: `Você atingiu o limite de ${quota.limit} vídeos incluídos hoje.`,
          used: quota.used,
          limit: quota.limit,
          remaining: quota.remaining,
          resetAt: quota.resetAt,
        },
        { status: 402 }
      );
    }
  }

  const input = {
    task: mode,
    prompt,
    ...(body.negative_prompt && { negative_prompt: String(body.negative_prompt).slice(0, 1200) }),
    ...(imageUrl && { image_url: imageUrl }),
    ...(sourceVideoUrl && { source_video_url: sourceVideoUrl }),
    duration,
    resolution: "480p",
    aspect_ratio: normalizeAspect(body.aspect_ratio),
    frames_per_second: 24,
    num_frames: (duration * 24) + 1,
    ...(Number.isFinite(Number(body.seed)) && { seed: Number(body.seed) }),
  };

  try {
    let jobId;
    let videoUrl = null;
    let processing = true;

    if (mode === "text-to-video" || mode === "image-to-video") {
      const generated = await runVerifiedVideoRuntime(input);
      videoUrl = generated.videoUrl;

      const completedJob = await createFreeVideoJob({
        userId,
        publicUrl: videoUrl,
        quotaDebited: Boolean(quota?.ok),
      });
      await markFreeVideoJobCompleted(completedJob.id, videoUrl);
      jobId = completedJob.id;
      processing = false;
    } else {
      const queuedJob = await runZeroCostVideo(input, {
        userId,
        quotaDebited: Boolean(quota?.ok),
        origin: req.nextUrl.origin,
      });
      jobId = queuedJob.jobId;
      processing = true;
    }

    return NextResponse.json(
      {
        success: true,
        provider: "nova",
        processing,
        jobId,
        ...(videoUrl && { videoUrl, url: videoUrl }),
        mode,
        seconds: duration,
        billing: {
          creditsCharged: 0,
          wallet: admin ? "admin" : "nova_included",
          unlimited: admin,
          ...(quota && {
            freeUsed: quota.used,
            freeLimit: quota.limit,
            freeRemaining: quota.remaining,
            resetAt: quota.resetAt,
          }),
        },
      },
      { status: processing ? 202 : 200 }
    );
  } catch (error) {
    if (quota?.ok) {
      await refundFreeGeneration(userId, "video").catch(() => {});
    }
    if (capacity?.ok) {
      await refundVideoCapacity(capacity.units).catch(() => {});
    }

    const upstreamCapacityReached = isUpstreamCapacityError(error);
    console.error("[NOVA_VIDEO] generation failed", {
      mode,
      message: error?.message || String(error),
      name: error?.name || null,
      upstreamCapacityReached,
    });

    if (upstreamCapacityReached) {
      return NextResponse.json(
        {
          success: false,
          code: "NOVA_FREE_VIDEO_ENGINE_QUOTA_REACHED",
          message: "O limite do motor gratuito de vídeo foi atingido. Esta tentativa não consumiu seu limite NOVA. A capacidade do motor renova diariamente.",
          quotaRefunded: true,
          ...(admin && {
            diagnostic: "O provedor ZeroGPU recusou a geração por limite/capacidade. O limite da conta NOVA não é a causa.",
          }),
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        code: "NOVA_VIDEO_TEMPORARILY_UNAVAILABLE",
        message: "Não foi possível concluir este vídeo agora. A tentativa não consumiu seu limite NOVA.",
        quotaRefunded: true,
        ...(admin && {
          diagnostic: String(error?.message || error || "Erro desconhecido").slice(0, 700),
        }),
      },
      { status: 503 }
    );
  }
}
