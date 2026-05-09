import { NextResponse } from "next/server";
import {
  getImageEndpoint,
  outputUrlsFromFal,
  requireNovaApiCredits,
  runFal,
} from "@/lib/novaClaudeConnector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  return NextResponse.json({
    success: true,
    tool: "nova_generate_image",
    method: "POST",
    endpoint: "/api/claude/tools/generate-image",
    description: "Generate AI images using NOVA from Claude AI or any external client.",
    requires: {
      authorization: "Bearer YOUR_NOVA_API_KEY",
      billing: "NOVA API credits required. Minimum purchase: $10.",
      checkoutUrl: "/checkout/api-credits?pack=starter"
    },
    example: {
      headers: {
        Authorization: "Bearer YOUR_NOVA_API_KEY",
        "Content-Type": "application/json"
      },
      body: {
        prompt: "Premium neon green product ad on black background, cinematic lighting",
        model: "flux-schnell",
        mode: "text-to-image",
        aspect_ratio: "1:1",
        num_images: 1
      }
    }
  });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const prompt = String(body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ success: false, error: "Missing prompt" }, { status: 400 });
  }

  const gate = await requireNovaApiCredits(req, Number(body.credits || 1));
  if (!gate.ok) return gate.response;

  const { endpoint, model, mode } = getImageEndpoint(
    body.model || "flux-schnell",
    body.mode || "text-to-image"
  );

  try {
    const result = await runFal(endpoint, {
      prompt,
      ...(body.negative_prompt && { negative_prompt: body.negative_prompt }),
      ...(body.image_url && { image_url: body.image_url }),
      ...(body.aspect_ratio && { aspect_ratio: body.aspect_ratio }),
      ...(body.image_size && { image_size: body.image_size }),
      ...(body.num_images && { num_images: body.num_images }),
    });

    const urls = outputUrlsFromFal(result);

    return NextResponse.json({
      success: true,
      provider: "nova",
      execution: "fal.ai",
      type: "image",
      model: model?.label || body.model || "NOVA Image Model",
      mode: mode?.label || body.mode || "Text to Image",
      urls,
      url: urls[0] || null,
      billing: {
        wallet: "nova_api_credits",
        creditsCharged: gate.charged,
        remainingApiCredits: gate.remainingBalance,
      },
      raw: result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "NOVA image generation failed.",
      },
      { status: 500 }
    );
  }
}
