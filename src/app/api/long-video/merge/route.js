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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const execFileAsync = promisify(execFile);
const ffmpegPath = process.env.FFMPEG_PATH || ffmpegStatic || "ffmpeg";

function dimensionsForRatio(ratio) {
  if (ratio === "16:9") return { width: 1920, height: 1080 };
  if (ratio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

async function downloadToFile(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  await writeFile(filePath, Buffer.from(await res.arrayBuffer()));
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const clips = Array.isArray(body.clips) ? body.clips.filter(Boolean) : [];
  const title = body.title || "NOVA Long Video";
  const ratio = body.ratio || "16:9";

  if (clips.length < 2) {
    return NextResponse.json(
      { success: false, error: "At least 2 rendered scene clips are required." },
      { status: 400 }
    );
  }

  if (!ffmpegPath) {
    return NextResponse.json(
      { success: false, error: "FFmpeg is not available. ffmpeg-static was not resolved." },
      { status: 500 }
    );
  }

  const workdir = join(tmpdir(), `nova-long-video-merge-${Date.now()}`);

  try {
    await mkdir(workdir, { recursive: true });

    const { width, height } = dimensionsForRatio(ratio);
    const normalizedFiles = [];

    for (let i = 0; i < clips.length; i++) {
      const inputPath = join(workdir, `input-${i}.mp4`);
      const normalizedPath = join(workdir, `normalized-${i}.mp4`);

      await downloadToFile(clips[i], inputPath);

      // Normalizar resolução, fps e codec para concat seguro
      await execFileAsync(ffmpegPath, [
        "-y", "-i", inputPath, "-an",
        "-vf", `fps=30,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p`,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-movflags", "+faststart", normalizedPath,
      ], { timeout: 120000 });

      normalizedFiles.push(normalizedPath);
    }

    const listPath = join(workdir, "clips.txt");
    const outputPath = join(workdir, "final.mp4");

    await writeFile(
      listPath,
      normalizedFiles.map((f) => `file '${f.replaceAll("'", "'\\''")}'`).join("\n")
    );

    await execFileAsync(ffmpegPath, [
      "-y", "-f", "concat", "-safe", "0", "-i", listPath,
      "-c", "copy", "-movflags", "+faststart", outputPath,
    ], { timeout: 240000 });

    const finalBuffer = await readFile(outputPath);
    const key = `users/${userId}/long-videos/${Date.now()}-long-video.mp4`;
    const finalUrl = await uploadToR2(key, finalBuffer, "video/mp4");

    await saveProjectRow({
      user_id: userId,
      title,
      type: "video",
      r2_key: key,
      mime_type: "video/mp4",
      url: finalUrl,
    });

    return NextResponse.json({
      success: true,
      finalUrl,
      clips: clips.length,
      ratio,
    });
  } catch (err) {
    const message = String(err?.message || err || "Failed to merge long video.");
    return NextResponse.json(
      {
        success: false,
        error: message.includes("ENOENT")
          ? "FFmpeg is not available in this deployment. Ensure ffmpeg-static is installed."
          : message,
      },
      { status: 500 }
    );
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
}
