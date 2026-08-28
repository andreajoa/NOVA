import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/db";
import { refundFreeGeneration } from "@/lib/freeGenerationQuota";
import {
  failStaleFreeVideoJob,
  getFreeVideoJob,
  markFreeVideoJobCompleted,
} from "@/lib/freeVideoJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_JOB_SECONDS = 15 * 60;

async function mediaExists(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req) {
  const session = await auth();
  const userId = session.userId || null;
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const jobId = String(req.nextUrl.searchParams.get("job") || "").trim();
  if (!jobId) {
    return NextResponse.json({ success: false, error: "Missing job" }, { status: 400 });
  }

  const admin = await isAdminUser(userId);
  let job = await getFreeVideoJob({ jobId, userId, admin });
  if (!job) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  }

  if (job.status === "processing" && await mediaExists(job.publicUrl)) {
    await markFreeVideoJobCompleted(job.id);
    job = { ...job, status: "completed" };
  }

  const age = Math.max(0, Math.floor(Date.now() / 1000) - job.createdAt);
  if (job.status === "processing" && age >= STALE_JOB_SECONDS) {
    const failed = await failStaleFreeVideoJob(job.id);
    if (failed.shouldRefund) {
      await refundFreeGeneration(failed.userId, "video").catch((error) => {
        console.error("[NOVA_VIDEO] stale-job quota refund failed", error?.message || error);
      });
    }
    job = { ...job, status: "failed" };
  }

  return NextResponse.json({
    success: true,
    jobId: job.id,
    status: job.status,
    ...(job.status === "completed" && { videoUrl: job.publicUrl, url: job.publicUrl }),
    ...(job.status === "failed" && {
      message: "Não foi possível concluir este vídeo. A geração foi devolvida ao seu limite diário.",
    }),
  });
}
