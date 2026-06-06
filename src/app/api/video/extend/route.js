import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { auth } from "@clerk/nextjs/server";
import { debitGenerationCredits, ensureUserGenerationAccount, isAdminUser } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

fal.config({ credentials: process.env.FAL_KEY });

const EXTEND_CREDITS_PER_SECOND = 24;
const EXTEND_ENDPOINT = "fal-ai/wan/v2.2-a14b/image-to-video";

async function extractLastFrame(videoUrl) {
  const r2Base = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  const uploadEndpoint = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/extract-frame`
    : null;

  const ffmpegAvailable = Boolean(process.env.FFMPEG_WORKER_URL);

  if (!ffmpegAvailable) {
    return { frameUrl: null, method: "unavailable" };
  }

  try {
    const res = await fetch(process.env.FFMPEG_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl, action: "last_frame" }),
    });
    const data = await res.json().catch(() => ({}));
    return { frameUrl: data.frameUrl || null, method: "ffmpeg_worker" };
  } catch {
    return { frameUrl: null, method: "error" };
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
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

    const creditsRequired = seconds * EXTEND_CREDITS_PER_SECOND;
    const admin = await isAdminUser(userId);

    if (!admin) {
      const account = await ensureUserGenerationAccount(userId);
      if (account.credits < creditsRequired) {
        return NextResponse.json({
          success: false,
          code: "INSUFFICIENT_CREDITS",
          error: "INSUFFICIENT_CREDITS",
          message: "Saldo insuficiente para estender o vídeo. Faça upgrade para continuar.",
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

    const { frameUrl, method } = await extractLastFrame(videoUrl);

    const imageUrl = frameUrl || videoUrl;
    const inputIsVideo = !frameUrl;

    if (!admin) {
      const debit = await debitGenerationCredits(userId, creditsRequired);
      if (!debit.ok) {
        return NextResponse.json({
          success: false,
          code: "INSUFFICIENT_CREDITS",
          error: "INSUFFICIENT_CREDITS",
          message: "Saldo insuficiente. Faça upgrade para continuar.",
          currentCredits: debit.currentCredits,
          creditsRequired,
        }, { status: 402 });
      }
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
      return NextResponse.json({
        success: false,
        error: "NO_VIDEO_URL_RETURNED",
        frameMethod: method,
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
    return NextResponse.json({
      success: false,
      error: "VIDEO_EXTEND_FAILED",
      message: error?.message || String(error),
    }, { status: 500 });
  }
}
