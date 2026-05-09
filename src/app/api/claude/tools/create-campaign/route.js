import { NextResponse } from "next/server";
import { requireNovaApiCredits } from "@/lib/novaClaudeConnector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    tool: "nova_create_campaign",
    method: "POST",
    endpoint: "/api/claude/tools/create-campaign",
    description: "Create a NOVA-ready campaign plan with prompts for images, videos and UGC.",
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
        product: "Luxury perfume",
        goal: "Generate sales and desire",
        audience: "Women 25-45 who like premium beauty products",
        style: "NOVA neon black and green premium visual system"
      }
    }
  });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const product = String(body.product || body.offer || "").trim();
  const goal = String(body.goal || "generate demand and sales").trim();
  const audience = String(body.audience || "high-intent buyers").trim();
  const style = String(body.style || "NOVA neon black and green premium visual system").trim();

  if (!product) {
    return NextResponse.json({ success: false, error: "Missing product or offer" }, { status: 400 });
  }

  const gate = await requireNovaApiCredits(req, 1);
  if (!gate.ok) return gate.response;

  const imagePrompt = `Premium commercial product ad for ${product}. ${style}. Designed for ${audience}. Goal: ${goal}. Black background, neon green highlights, high-end lighting, surreal but clean composition, luxury campaign look, no random text, no watermark.`;

  const videoPrompt = `Cinematic AI video ad for ${product}. ${style}. Show a strong hook in the first second, dramatic product reveal, smooth camera movement, premium lighting, social-media-ready composition, emotional desire, no subtitles, no watermark.`;

  const ugcScript = `Hook: "I did not expect ${product} to look this premium." Show the product in hand, demonstrate one key benefit, add quick proof, then end with a direct CTA.`;

  return NextResponse.json({
    success: true,
    type: "campaign",
    product,
    goal,
    audience,
    style,
    campaign: {
      name: `${product} — NOVA Claude Campaign`,
      positioning: `Make ${product} feel premium, urgent and visually unforgettable.`,
      offerAngle: goal,
      visualDirection: style,
    },
    prompts: [
      {
        title: "Hero Product Image",
        type: "image",
        model: "flux-pro",
        route: "/api/claude/tools/generate-image",
        prompt: imagePrompt,
      },
      {
        title: "Short Product Video",
        type: "video",
        model: "seedance",
        route: "/api/claude/tools/generate-video",
        prompt: videoPrompt,
      },
      {
        title: "UGC Script",
        type: "ugc",
        route: "/dashboard/templates",
        prompt: ugcScript,
      },
    ],
    billing: {
      wallet: "nova_api_credits",
      creditsCharged: gate.charged,
      remainingApiCredits: gate.remainingBalance,
    },
  });
}
