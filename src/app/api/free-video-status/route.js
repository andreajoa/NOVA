import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/db";
import { getFreeVideoJob } from "@/lib/freeVideoJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const job = await getFreeVideoJob({ jobId, userId, admin });
  if (!job) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
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
