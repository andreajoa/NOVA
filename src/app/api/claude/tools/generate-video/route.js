import { NextResponse } from "next/server";
import {
  getVideoEndpoint,
  outputUrlsFromFal,
  requireNovaApiCredits,
  runFal,
  VIDEO_CREDITS_PER_SECOND,
} from "@/lib/novaClaudeConnector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

function normalizeSeconds(value) {
  const n = Number(value || 5);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(30, Math.ceil(n)));
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const prompt = String(body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ success: false, error: "Missing prompt" }, { status: 400 });
  }

  const seconds = normalizeSeconds(body.seconds || body.duration);
  const creditsRequired = seconds * VIDEO_CREDITS_PER_SECOND;

  const gate = await requireNovaApiCredits(req, creditsRequired);
  if (!gate.ok) return gate.response;

  const { endpoint, model, mode } = getVideoEndpoint(
    body.model || "seedance",
    body.mode || "text-to-video"
  );

  if (mode?.needsImage && !body.image_url) {
    return NextResponse.json(
      {
        success: false,
        error: "This video mode requires image_url.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await runFal(endpoint, {
      prompt,
      duration: seconds,
      ...(body.image_url && { image_url: body.image_url }),
      ...(body.aspect_ratio && { aspect_ratio: body.aspect_ratio }),
      ...(body.resolution && { resolution: body.resolution }),
    });

    const urls = outputUrlsFromFal(result);

    return NextResponse.json({
      success: true,
      provider: "nova",
      execution: "fal.ai",
      type: "video",
      model: model?.label || body.model || "NOVA Video Model",
      mode: mode?.label || body.mode || "Text to Video",
      seconds,
      urls,
      url: urls[0] || null,
      billing: {
        wallet: "nova_api_credits",
        creditsPerSecond: VIDEO_CREDITS_PER_SECOND,
        creditsCharged: gate.charged,
        remainingApiCredits: gate.remainingBalance,
      },
      raw: result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "NOVA video generation failed.",
      },
      { status: 500 }
    );
  }
}
