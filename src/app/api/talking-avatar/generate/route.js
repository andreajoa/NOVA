import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { auth } from "@clerk/nextjs/server";
import { getMediaModel, estimateCredits } from "@/lib/mediaCapabilities";
import { extractFirstUrl, safeErrorMessage } from "@/lib/falResultUtils";

export const runtime = "nodejs";
export const maxDuration = 300;

fal.config({ credentials: process.env.FAL_KEY });

async function generateAudioFromScript({ script, voice }) {
  const audioModel = getMediaModel("chatterboxhd-tts");

  const result = await fal.subscribe(audioModel.endpoint, {
    input: {
      text: script,
      voice: voice || undefined,
    },
    logs: true,
  });

  return extractFirstUrl(result, "audio");
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();

    const imageUrl = String(body.imageUrl || "").trim();
    const script = String(body.script || "").trim();
    let audioUrl = String(body.audioUrl || "").trim();
    const modelId = body.modelId || "wan-2-2-speech";
    const model = getMediaModel(modelId);

    if (!model || model.type !== "talking-avatar") {
      return NextResponse.json({ success: false, error: "INVALID_TALKING_AVATAR_MODEL" }, { status: 400 });
    }

    if (!imageUrl && model.requiresImage) {
      return NextResponse.json({ success: false, error: "IMAGE_URL_REQUIRED" }, { status: 400 });
    }

    if (!audioUrl && !script) {
      return NextResponse.json({ success: false, error: "SCRIPT_OR_AUDIO_REQUIRED" }, { status: 400 });
    }

    if (!audioUrl && script) {
      audioUrl = await generateAudioFromScript({ script, voice: body.voice });
    }

    if (!audioUrl) {
      return NextResponse.json({ success: false, error: "AUDIO_GENERATION_FAILED" }, { status: 502 });
    }

    const creditsRequired =
      estimateCredits(modelId, { seconds: body.seconds || 5 }) +
      (script ? estimateCredits("chatterboxhd-tts") : 0);

    // TODO: connect to NOVA credit debit before public release.
    // This is intentionally explicit so NOVA can price above fal.ai cost.
    const input = {
      image_url: imageUrl,
      audio_url: audioUrl,
      prompt: body.prompt || "Natural talking head video, realistic facial expressions, professional lighting.",
      duration: body.seconds || 5,
    };

    const result = await fal.subscribe(model.endpoint, {
      input,
      logs: true,
    });

    const videoUrl = extractFirstUrl(result, "video");

    if (!videoUrl) {
      return NextResponse.json({
        success: false,
        error: "NO_VIDEO_URL_RETURNED",
        audioUrl,
        raw: result,
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      modelId,
      endpoint: model.endpoint,
      creditsRequired,
      audioUrl,
      videoUrl,
      result,
    });
  } catch (error) {
    console.error("Talking avatar failed:", error);
    return NextResponse.json({
      success: false,
      error: "TALKING_AVATAR_FAILED",
      message: safeErrorMessage(error),
    }, { status: 500 });
  }
}
