import { NextResponse } from "next/server";
import { requireNovaApiCredits } from "@/lib/novaClaudeConnector";
import { createLandingPageDesign } from "@/lib/novaLandingDesigner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    tool: "nova_create_landing_page_design",
    method: "POST",
    endpoint: "/api/claude/tools/create-landing-page",
    description: "Create a platform-ready landing page design, copy, section plan and export strategy.",
    requires: {
      authorization: "Bearer YOUR_NOVA_API_KEY",
      billing: "NOVA API credits required. Minimum purchase: $10.",
      checkoutUrl: "/checkout/api-credits?pack=starter",
    },
    example: {
      product: "Luxury perfume",
      platform: "shopify-theme",
      brandName: "Maison Nova",
      audience: "Women 25-45 who buy premium beauty products",
      style: "black and neon green luxury ecommerce",
      language: "en",
      cta: "Shop Now",
    },
  });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const gate = await requireNovaApiCredits(req, Number(body.credits || 2));
  if (!gate.ok) return gate.response;

  const design = createLandingPageDesign(body);

  return NextResponse.json({
    success: true,
    type: "landing_page_design",
    design,
    billing: {
      wallet: "nova_api_credits",
      creditsCharged: gate.charged,
      remainingApiCredits: gate.remainingBalance,
    },
  });
}
