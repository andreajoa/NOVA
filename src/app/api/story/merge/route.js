import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import crypto from "node:crypto";
import ffmpegStatic from "ffmpeg-static";
import { uploadToR2 } from "@/lib/r2";
import { saveProjectRow } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const execFileAsync = promisify(execFile);

function safeName(value = "story") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "story";
}

function dimensionsForRatio(ratio) {
  if (ratio === "16:9") return { width: 1920, height: 1080 };
  if (ratio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

async function downloadToFile(url, filePath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not download clip. HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
}

export async function POST(request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const missingEnv = [
    "R2_ENDPOINT",
    "R2_BUCKET",
    "R2_PUBLIC_URL",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
  ].filter((key) => !process.env[key]);

  if (missingEnv.length) {
    return NextResponse.json(
      {
        success: false,
        error: `Missing R2 env vars: ${missingEnv.join(", ")}`,
      },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const clips = Array.isArray(body.clips) ? body.clips.filter(Boolean) : [];
  const title = body.title || "NOVA Story";
  const ratio = body.ratio || "9:16";

  if (clips.length < 2) {
    return NextResponse.json(
      { success: false, error: "At least 2 video clips are required." },
      { status: 400 }
    );
  }

  const ffmpegPath = process.env.FFMPEG_PATH || ffmpegStatic || "ffmpeg";

  if (!ffmpegPath) {
    return NextResponse.json(
      {
        success: false,
        error: "FFmpeg is not available. ffmpeg-static was not resolved.",
      },
      { status: 500 }
    );
  }

  const jobId = `${Date.now()}-${crypto.randomUUID()}`;
  const workdir = join(tmpdir(), `nova-story-merge-${jobId}`);

  try {
    await mkdir(workdir, { recursive: true });

    const { width, height } = dimensionsForRatio(ratio);
    const normalizedFiles = [];

    for (let index = 0; index < clips.length; index += 1) {
      const inputPath = join(workdir, `input-${index}.mp4`);
      const normalizedPath = join(workdir, `normalized-${index}.mp4`);

      await downloadToFile(clips[index], inputPath);

      await execFileAsync(
        ffmpegPath,
        [
          "-y",
          "-i",
          inputPath,
          "-an",
          "-vf",
          `fps=30,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p`,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "23",
          "-movflags",
          "+faststart",
          normalizedPath,
        ],
        { timeout: 120000 }
      );

      normalizedFiles.push(normalizedPath);
    }

    const listPath = join(workdir, "clips.txt");
    const outputPath = join(workdir, "final.mp4");

    await writeFile(
      listPath,
      normalizedFiles
        .map((filePath) => `file '${filePath.replaceAll("'", "'\\''")}'`)
        .join("\n")
    );

    await execFileAsync(
      ffmpegPath,
      [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listPath,
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      { timeout: 180000 }
    );

    const finalBuffer = await readFile(outputPath);
    const key = `users/${userId}/stories/${Date.now()}-${safeName(title)}.mp4`;
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
      jobId,
      finalUrl,
      clips: clips.length,
      ratio,
    });
  } catch (error) {
    const message = String(error?.message || error || "Could not merge story clips.");

    return NextResponse.json(
      {
        success: false,
        error: message.includes("ENOENT")
          ? "FFmpeg is not available in this deployment. ffmpeg-static should be installed and deployed."
          : message,
      },
      { status: 500 }
    );
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
}
