import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureUserGenerationAccount, isAdminUser } from "@/lib/db";
import { isNovaAdminFromAuth } from "@/lib/novaAdminAccess";
import { refundFreeGeneration } from "@/lib/freeGenerationQuota";
import {
  failStaleFreeVideoJob,
  getFreeVideoJob,
  markFreeVideoJobCompleted,
  markFreeVideoJobFailed,
} from "@/lib/freeVideoJobs";
import { isZeroCostFallbackPollUrl } from "@/lib/zeroCostVideoClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const DEFAULT_STALE_JOB_SECONDS = Math.max(
  5,
  Number(process.env.NOVA_VIDEO_STALE_NORMAL_SECONDS || 8 * 60)
);
const SPEECH_STALE_JOB_SECONDS = Math.max(
  10,
  Number(process.env.NOVA_VIDEO_STALE_SPEECH_SECONDS || 15 * 60)
);
const FALLBACK_POLL_TIMEOUT_MS = 55_000;
const FALLBACK_VIDEO_BASE = "https://lightricks-ltx-2-3.hf.space";

async function mediaExists(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store", signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function findVideo(value) {
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value) && (/\.mp4(?:\?|#|$)/i.test(value) || /file=/i.test(value))) return value;
    if (value.startsWith("/") && (/\.mp4(?:\?|#|$)/i.test(value) || /file=/i.test(value))) return `${FALLBACK_VIDEO_BASE}${value}`;
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVideo(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const key of ["url", "path", "video", "value"]) {
      if (key in value) {
        const found = findVideo(value[key]);
        if (found) return found;
      }
    }
    for (const item of Object.values(value)) {
      const found = findVideo(item);
      if (found) return found;
    }
  }
  return null;
}

async function pollFallbackUntilResult(pollUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FALLBACK_POLL_TIMEOUT_MS);
  try {
    const response = await fetch(pollUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "text/event-stream, application/json", "User-Agent": "NOVA-free-video-status/2.1" },
    });
    if (!response.ok) {
      if ([404, 408, 425, 429, 500, 502, 503, 504].includes(response.status)) return { status: "processing" };
      return { status: "failed", errorCode: `UPSTREAM_${response.status}` };
    }

    const text = await response.text();
    const blocks = text.replace(/\r\n/g, "\n").split("\n\n");
    for (const block of blocks) {
      if (block.includes("event: error")) return { status: "failed", errorCode: "UPSTREAM_GENERATION_ERROR" };
      if (!block.includes("event: complete")) continue;
      const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
      if (!dataLine) return { status: "failed", errorCode: "UPSTREAM_EMPTY_RESULT" };
      let data;
      try { data = JSON.parse(dataLine.slice(6)); } catch { return { status: "failed", errorCode: "UPSTREAM_INVALID_RESULT" }; }
      const videoUrl = findVideo(data);
      if (!videoUrl) return { status: "failed", errorCode: "UPSTREAM_NO_VIDEO" };
      return { status: "completed", videoUrl };
    }
    return { status: "processing" };
  } catch (error) {
    if (error?.name !== "AbortError") console.error("[NOVA_VIDEO] fallback status poll error", error?.message || error);
    return { status: "processing" };
  } finally {
    clearTimeout(timer);
  }
}

async function refundIfNeeded(result) {
  if (!result?.shouldRefund || !result?.userId) return;
  await refundFreeGeneration(result.userId, "video").catch((error) => {
    console.error("[NOVA_VIDEO] quota refund failed", error?.message || error);
  });
}

export async function GET(req) {
  const session = await auth();
  const userId = session.userId || null;
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const jobId = String(req.nextUrl.searchParams.get("job") || "").trim();
  if (!jobId) return NextResponse.json({ success: false, error: "Missing job" }, { status: 400 });

  const account = await ensureUserGenerationAccount(userId);
  const admin = Boolean(
    String(account.plan || "").toLowerCase() === "admin" ||
    await isAdminUser(userId) ||
    await isNovaAdminFromAuth(userId, session.sessionClaims)
  );
  let job = await getFreeVideoJob({ jobId, userId, admin });
  if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });

  if (job.status === "processing" && isZeroCostFallbackPollUrl(job.publicUrl)) {
    const upstream = await pollFallbackUntilResult(job.publicUrl);
    if (upstream.status === "completed" && upstream.videoUrl) {
      await markFreeVideoJobCompleted(job.id, upstream.videoUrl);
      job = { ...job, publicUrl: upstream.videoUrl, status: "completed" };
    } else if (upstream.status === "failed") {
      const failed = await markFreeVideoJobFailed(job.id, upstream.errorCode || "GENERATION_FAILED");
      await refundIfNeeded(failed);
      job = { ...job, status: "failed" };
    }
  } else if (job.status === "processing" && await mediaExists(job.publicUrl)) {
    await markFreeVideoJobCompleted(job.id);
    job = { ...job, status: "completed" };
  }

  const age = Math.max(0, Math.floor(Date.now() / 1000) - job.createdAt);
  const staleAfter = job.input?.task === "speech-video" ? SPEECH_STALE_JOB_SECONDS : DEFAULT_STALE_JOB_SECONDS;
  if (job.status === "processing" && age >= staleAfter) {
    const failed = await failStaleFreeVideoJob(job.id);
    await refundIfNeeded(failed);
    job = { ...job, status: "failed" };
  }

  return NextResponse.json({
    success: true,
    jobId: job.id,
    status: job.status,
    engine: job.engine || null,
    attempt: job.attempt || 0,
    ...(job.status === "completed" && { videoUrl: job.publicUrl, url: job.publicUrl }),
    ...(job.status === "failed" && {
      message: admin
        ? "Nenhum motor conseguiu concluir esta tentativa. Sua conta ADMIN continua ilimitada."
        : "Não foi possível concluir este vídeo. A geração foi devolvida ao seu limite diário.",
    }),
  });
}
