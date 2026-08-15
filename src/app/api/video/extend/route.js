import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { auth } from "@clerk/nextjs/server";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, readFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ffmpegStatic from "ffmpeg-static";
import { uploadToR2 } from "@/lib/r2";
import {
  debitGenerationCredits,
  ensureUserGenerationAccount,
  isAdminUser,
  refundGenerationCredits,
} from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

fal.config({ credentials: process.env.FAL_KEY });

const execFileAsync = promisify(execFile);
const EXTEND_CREDITS_PER_SECOND = 24;
const EXTEND_ENDPOINT = "fal-ai/wan/v2.2-a14b/image-to-video";

/**
 * Extrai o último frame de um vídeo usando ffmpeg-static (funciona no Vercel).
 * Baixa o vídeo para /tmp, extrai o frame como PNG, faz upload para R2
 * e devolve uma URL pública que o fal.ai consegue consumir.
 */
async function extractLastFrame(videoUrl, userId) {
  const ffmpegPath = process.env.FFMPEG_PATH || ffmpegStatic || null;
  if (!ffmpegPath) {
    return { frameUrl: null, method: "no_ffmpeg" };
  }

  const workdir = join(tmpdir(), `nova-frame-${Date.now()}`);
  const videoPath = join(workdir, "input.mp4");
  const framePath = join(workdir, "last-frame.png");

  try {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(workdir, { recursive: true });

    // Baixar o vídeo
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    await writeFile(videoPath, Buffer.from(await res.arrayBuffer()));

    // Extrair último frame: sseof=-0.1 busca 0.1s antes do final
    await execFileAsync(ffmpegPath, [
      "-y", "-sseof", "-0.1", "-i", videoPath,
      "-frames:v", "1", "-q:v", "2", framePath,
    ], { timeout: 30000 });

    const frameBuffer = await readFile(framePath);
    const key = `users/${userId}/frames/${Date.now()}-last-frame.png`;
    const frameUrl = await uploadToR2(key, frameBuffer, "image/png");

    return { frameUrl, method: "ffmpeg_static" };
  } catch (err) {
    console.error("Frame extraction failed:", err?.message);
    return { frameUrl: null, method: "error" };
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function POST(request) {
  // Fora do try para o catch conseguir estornar.
  let userId = null;
  let creditsRequired = 0;
  let charged = false;

  try {
    const session = await auth();
    userId = session.userId;

    if (!userId) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const videoUrl = String(body.videoUrl || "").trim();
    const prompt = String(body.prompt || "").trim();
    const seconds = Math.max(5, Math.min(10, Number(body.seconds || 5)));

    if (!videoUrl) {
      return NextResponse.json({ success: false, error: "VIDEO_URL_REQUIRED" }, { status: 400 });
    }
    if (!prompt) {
      return NextResponse.json({ success: false, error: "PROMPT_REQUIRED" }, { status: 400 });
    }

    creditsRequired = seconds * EXTEND_CREDITS_PER_SECOND;
    const admin = await isAdminUser(userId);

    if (!admin) {
      const account = await ensureUserGenerationAccount(userId);
      if (account.credits < creditsRequired) {
        return NextResponse.json({
          success: false,
          code: "INSUFFICIENT_CREDITS",
          error: "INSUFFICIENT_CREDITS",
          message: "Not enough credits to extend video. Upgrade to continue.",
          currentCredits: account.credits,
          creditsRequired,
          creditsMissing: Math.max(0, creditsRequired - account.credits),
          plans: {
            annual:  { label: "Annual",  price: "$5/mo", href: "/checkout/plan?plan=basic&billing=annual" },
            monthly: { label: "Monthly", price: "$7/mo", href: "/checkout/plan?plan=basic&billing=monthly" },
          },
        }, { status: 402 });
      }
    }

    const { frameUrl, method } = await extractLastFrame(videoUrl, userId);

    if (!frameUrl) {
      return NextResponse.json({
        success: false,
        error: "FRAME_EXTRACTION_FAILED",
        message: "Could not extract the last frame from your video. Please try with a different video.",
        frameMethod: method,
      }, { status: 422 });
    }

    const imageUrl = frameUrl;

    if (!admin) {
      const debit = await debitGenerationCredits(userId, creditsRequired);
      if (!debit.ok) {
        return NextResponse.json({
          success: false,
          code: "INSUFFICIENT_CREDITS",
          error: "INSUFFICIENT_CREDITS",
          message: "Not enough credits. Upgrade to continue.",
          currentCredits: debit.currentCredits,
          creditsRequired,
        }, { status: 402 });
      }
      charged = true;
    }

    const result = await fal.subscribe(EXTEND_ENDPOINT, {
      input: {
        image_url: imageUrl,
        prompt: prompt,
        duration: seconds,
        aspect_ratio: body.aspectRatio || "16:9",
      },
      logs: true,
    });

    let extendedVideoUrl = null;
    const content = result?.data || result;
    if (content?.video?.url) extendedVideoUrl = content.video.url;
    else if (content?.video_url) extendedVideoUrl = content.video_url;
    else if (typeof content?.output === "string") extendedVideoUrl = content.output;
    else if (Array.isArray(content?.outputs)) extendedVideoUrl = content.outputs[0]?.url || content.outputs[0];

    if (!extendedVideoUrl) {
      const refunded = charged ? await refundGenerationCredits(userId, creditsRequired) : false;
      return NextResponse.json({
        success: false,
        error: "NO_VIDEO_URL_RETURNED",
        frameMethod: method,
        refunded,
        raw: result,
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      videoUrl: extendedVideoUrl,
      originalVideoUrl: videoUrl,
      frameMethod: method,
      creditsCharged: admin ? 0 : creditsRequired,
      seconds,
    });
  } catch (error) {
    console.error("Video extend failed:", error);

    const refunded = charged ? await refundGenerationCredits(userId, creditsRequired) : false;

    return NextResponse.json({
      success: false,
      error: "VIDEO_EXTEND_FAILED",
      message: error?.message || String(error),
      refunded,
    }, { status: 500 });
  }
}
