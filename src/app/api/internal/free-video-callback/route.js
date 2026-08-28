import { NextResponse } from "next/server";
import { finalizeFreeVideoJob } from "@/lib/freeVideoJobs";
import { refundFreeGeneration } from "@/lib/freeGenerationQuota";

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
  const status = body?.status === "completed" ? "completed" : body?.status === "failed" ? "failed" : "";
  if (!status) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const finalized = await finalizeFreeVideoJob({
    jobId,
    callbackToken: token,
    status,
    errorCode: body?.error_code || null,
  });

  if (!finalized.ok) {
    const code = finalized.reason === "unauthorized" ? 401 : finalized.reason === "not_found" ? 404 : 400;
    return NextResponse.json({ success: false }, { status: code });
  }

  if (finalized.shouldRefund) {
    await refundFreeGeneration(finalized.userId, "video").catch((error) => {
      console.error("[NOVA_VIDEO] failed to refund quota after worker failure", error?.message || error);
    });
  }

  return NextResponse.json({ success: true });
}
