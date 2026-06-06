import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { auth } from "@clerk/nextjs/server";
import { getMediaModel, estimateCredits } from "@/lib/mediaCapabilities";
import { extractFirstUrl, safeErrorMessage } from "@/lib/falResultUtils";

export const runtime = "nodejs";
export const maxDuration = 300;

fal.config({ credentials: process.env.FAL_KEY });

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await request.json();
    const text = String(body.text || "").trim();
    const modelId = body.modelId || "chatterboxhd-tts";
    const model = getMediaModel(modelId);

    if (!model || model.type !== "audio") {
      return NextResponse.json({ success: false, error: "INVALID_AUDIO_MODEL" }, { status: 400 });
    }

    if (!text || text.length < 3) {
      return NextResponse.json({ success: false, error: "TEXT_REQUIRED" }, { status: 400 });
    }

    if (text.length > (model.maxCharacters || 2500)) {
      return NextResponse.json({
        success: false,
        error: "TEXT_TOO_LONG",
        message: `Maximum ${model.maxCharacters || 2500} characters allowed.`,
      }, { status: 400 });
    }

    const creditsRequired = estimateCredits(modelId);

    // TODO: connect to NOVA credit debit before public release.
    // For safety, the API returns required credits so UI can show exact price.
    const input = {
      text,
      voice: body.voice || body.voiceId || undefined,
    };

    const result = await fal.subscribe(model.endpoint, {
      input,
      logs: true,
    });

    const audioUrl = extractFirstUrl(result, "audio");

    if (!audioUrl) {
      return NextResponse.json({
        success: false,
        error: "NO_AUDIO_URL_RETURNED",
        raw: result,
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      modelId,
      endpoint: model.endpoint,
      creditsRequired,
      audioUrl,
      result,
    });
  } catch (error) {
    console.error("Audio generation failed:", error);
    return NextResponse.json({
      success: false,
      error: "AUDIO_GENERATION_FAILED",
      message: safeErrorMessage(error),
    }, { status: 500 });
  }
}
