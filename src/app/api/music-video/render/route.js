import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpegStatic from "ffmpeg-static";
import { uploadToR2 } from "@/lib/r2";
import { saveProjectRow } from "@/lib/db";
import { getMusicVideoJob, updateMusicVideoJob } from "@/lib/musicVideoJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const execFileAsync = promisify(execFile);
const ffmpegPath = process.env.FFMPEG_PATH || ffmpegStatic || "ffmpeg";

async function downloadToFile(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar arquivo: ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buffer);
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const jobId = body.jobId;

  if (!jobId) return NextResponse.json({ success: false, error: "Missing jobId" }, { status: 400 });

  const job = await getMusicVideoJob(jobId, userId);
  if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });

  const scenes = job.scenes || [];
  const missing = scenes.filter((scene) => scene.status !== "done" || !scene.videoUrl);

  if (missing.length) {
    return NextResponse.json({
      success: false,
      error: `Ainda existem ${missing.length} cena(s) sem vídeo gerado.`,
    }, { status: 400 });
  }

  if (!job.audioUrl) {
    return NextResponse.json({
      success: false,
      error: "Envie a música antes de renderizar o clipe final.",
    }, { status: 400 });
  }

  const workdir = join(tmpdir(), `nova-music-video-${job.id}`);

  try {
    await updateMusicVideoJob(job.id, userId, { ...job, status: "rendering", error: "" });

    await mkdir(workdir, { recursive: true });

    const listLines = [];

    for (const scene of scenes) {
      const filePath = join(workdir, `${scene.id}.mp4`);
      await downloadToFile(scene.videoUrl, filePath);
      listLines.push(`file '${filePath.replaceAll("'", "'\\''")}'`);
    }

    const audioPath = join(workdir, "song-audio");
    const listPath = join(workdir, "clips.txt");
    const outputPath = join(workdir, "final.mp4");

    await downloadToFile(job.audioUrl, audioPath);
    await writeFile(listPath, listLines.join("\n"));

    await execFileAsync(ffmpegPath, [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listPath,
      "-i", audioPath,
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-shortest",
      "-movflags", "+faststart",
      outputPath,
    ], { timeout: 240000 });

    const finalBuffer = await readFile(outputPath);
    const key = `users/${userId}/music-videos/${Date.now()}-${job.id}.mp4`;
    const finalUrl = await uploadToR2(key, finalBuffer, "video/mp4");

    await saveProjectRow({
      user_id: userId,
      title: job.title || "NOVA Music Video",
      type: "video",
      r2_key: key,
      mime_type: "video/mp4",
      url: finalUrl,
    });

    const updated = await updateMusicVideoJob(job.id, userId, {
      ...job,
      status: "done",
      finalUrl,
      error: "",
    });

    return NextResponse.json({
      success: true,
      job: updated,
      finalUrl,
    });
  } catch (err) {
    const message = String(err?.message || err || "Falha ao renderizar vídeo final.");

    const updated = await updateMusicVideoJob(job.id, userId, {
      ...job,
      status: "render_failed",
      error: message.includes("ENOENT")
        ? "FFmpeg não está disponível no servidor. Configure FFMPEG_PATH ou use um servidor Node com FFmpeg instalado para render final."
        : message,
    });

    return NextResponse.json({
      success: false,
      job: updated,
      error: updated.error,
    }, { status: 500 });
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
}
