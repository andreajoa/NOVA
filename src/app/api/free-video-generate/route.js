import { randomUUID } from "node:crypto";
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
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const ALLOWED_MODES = new Set(["text-to-video", "image-to-video", "continue-video"]);
const MAX_PERSISTED_VIDEO_BYTES = 120 * 1024 * 1024;

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

function safeHfToken(value) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("hf_") || raw.length < 16 || raw.length > 700) return "";
  return raw;
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

async function persistGeneratedVideo({ userId, remoteUrl, hfToken }) {
  const sourceUrl = safeHttpsUrl(remoteUrl);
  if (!sourceUrl) throw new Error("NOVA generated video returned an invalid URL");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  let response;
  try {
    response = await fetch(sourceUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: hfToken ? { Authorization: `Bearer ${hfToken}` } : undefined,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response?.ok) {
    throw new Error(`NOVA could not persist generated video (${response?.status || 0})`);
  }

  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_PERSISTED_VIDEO_BYTES) {
    throw new Error("NOVA generated video is too large to persist");
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_PERSISTED_VIDEO_BYTES) {
    throw new Error("NOVA generated video is empty or too large");
  }

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("video") && !bytes.subarray(0, 64).includes(Buffer.from("ftyp"))) {
    throw new Error("NOVA generated output is not a valid MP4 video");
  }

  const key = `users/${userId}/nova-video/${Date.now()}-${randomUUID()}.mp4`;
  const publicUrl = await uploadToR2(key, bytes, "video/mp4");
  if (!safeHttpsUrl(publicUrl)) {
    throw new Error("NOVA persisted video did not receive a public URL");
  }
  return publicUrl;
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
  const hfToken = safeHfToken(body.hf_token);

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

  // The shared NOVA safety cap protects only anonymous FREE/trial traffic.
  // Paid plans, admin, and users using their own free HF GPU allowance keep
  // their account-level quota instead of being blocked by other users' usage.
  const usesSharedCapacity = !admin && !policy.paid && !hfToken;
  let capacity = null;
  if (usesSharedCapacity) {
    capacity = await reserveVideoCapacity(duration);
    if (!capacity.ok) {
      return NextResponse.json(
        {
          success: false,
          code: "NOVA_VIDEO_DAILY_CAPACITY_REACHED",
          message: "A capacidade compartilhada gratuita de NOVA VIDEO foi utilizada hoje. Ative sua capacidade gratuita pessoal para continuar sem créditos.",
          resetAt: capacity.resetAt,
          canConnectPersonalFreeGpu: true,
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
      const generated = await runVerifiedVideoRuntime(input, { hfToken });
      videoUrl = await persistGeneratedVideo({
        userId,
        remoteUrl: generated.videoUrl,
        hfToken,
      });

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
          personalFreeGpu: Boolean(hfToken),
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
      personalFreeGpu: Boolean(hfToken),
    });

    if (upstreamCapacityReached) {
      return NextResponse.json(
        {
          success: false,
          code: "NOVA_FREE_VIDEO_ENGINE_QUOTA_REACHED",
          message: hfToken
            ? "Sua capacidade gratuita pessoal de GPU foi utilizada por agora. Esta tentativa não consumiu seu limite NOVA."
            : "A capacidade gratuita compartilhada de vídeo foi utilizada. Ative sua capacidade gratuita pessoal para continuar sem créditos.",
          quotaRefunded: true,
          personalFreeGpu: Boolean(hfToken),
          canConnectPersonalFreeGpu: !hfToken,
          ...(admin && {
            diagnostic: hfToken
              ? "A cota ZeroGPU autenticada da conta conectada foi atingida."
              : "A cota ZeroGPU anônima/compartilhada foi atingida; uma conta HF gratuita usa cota própria.",
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
