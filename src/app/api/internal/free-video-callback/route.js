import { NextResponse } from "next/server";
import {
  finalizeFreeVideoJob,
  getFreeVideoJobForCallback,
} from "@/lib/freeVideoJobs";
import { refundFreeGeneration } from "@/lib/freeGenerationQuota";
import { retryPrivateGpuVideoJob } from "@/lib/privateGpuVideoPool";
import { retryFreeVideoJobOnPublicFallback } from "@/lib/publicVideoJobRetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerToken(req) {
  const header = req.headers.get("authorization") || "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
}

export async function POST(req) {
  const jobId = String(req.nextUrl.searchParams.get("job") || "").trim();
  const token = bearerToken(req);
  if (!jobId || !token) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const status = body?.status === "completed"
    ? "completed"
    : body?.status === "failed"
      ? "failed"
      : "";
  if (!status) return NextResponse.json({ success: false }, { status: 400 });

  const errorCode = body?.error_code || null;

  try {
    if (status === "failed") {
      return await handleFailedCallback(jobId, token, req, errorCode);
    }

    const finalized = await finalizeFreeVideoJob({
      jobId,
      callbackToken: token,
      status,
      errorCode,
    });

    if (!finalized.ok) {
      const code = finalized.reason === "unauthorized"
        ? 401
        : finalized.reason === "not_found"
          ? 404
          : 400;
      return NextResponse.json({ success: false }, { status: code });
    }

    if (finalized.shouldRefund) {
      await refundFreeGeneration(finalized.userId, "video").catch((error) => {
        console.error("[NOVA_VIDEO] failed to refund quota after worker failure", error?.message || error);
      });
    }

    return NextResponse.json({ success: true, retried: false });
  } catch (error) {
    console.error("[NOVA_VIDEO] callback handler failed", {
      jobId,
      status,
      error: error?.message || String(error),
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

async function handleFailedCallback(jobId, token, req, errorCode) {
  const job = await getFreeVideoJobForCallback({ jobId, callbackToken: token });
  if (!job) return NextResponse.json({ success: false }, { status: 401 });

  if (job.status === "processing" && job.input && job.engine) {
    try {
      const retried = await retryPrivateGpuVideoJob({
        job,
        callbackToken: token,
        origin: req.nextUrl.origin,
      });
      return NextResponse.json({
        success: true,
        retried: true,
        engine: retried.engine,
        jobId,
      });
    } catch (retryError) {
      console.warn("[NOVA_VIDEO] private GPU failover exhausted", {
        jobId,
        engine: job.engine,
        message: String(retryError?.message || retryError).slice(0, 700),
      });
    }

    if (["text-to-video", "image-to-video"].includes(String(job.input.task || ""))) {
      try {
        const publicRetry = await retryFreeVideoJobOnPublicFallback({
          job,
          callbackToken: token,
        });
        return NextResponse.json({
          success: true,
          retried: true,
          engine: publicRetry.engine,
          jobId,
        });
      } catch (publicError) {
        console.warn("[NOVA_VIDEO] public fallback retry also failed", {
          jobId,
          message: String(publicError?.message || publicError).slice(0, 700),
        });
      }
    }
  }

  const finalized = await finalizeFreeVideoJob({
    jobId,
    callbackToken: token,
    status: "failed",
    errorCode,
  });

  if (!finalized.ok) {
    const code = finalized.reason === "unauthorized"
      ? 401
      : finalized.reason === "not_found"
        ? 404
        : 400;
    return NextResponse.json({ success: false }, { status: code });
  }

  if (finalized.shouldRefund) {
    await refundFreeGeneration(finalized.userId, "video").catch((error) => {
      console.error("[NOVA_VIDEO] failed to refund quota after worker failure", error?.message || error);
    });
  }

  return NextResponse.json({ success: true, retried: false });
}
