import { NextResponse } from "next/server";
import { requireNovaApiCredits } from "@/lib/novaClaudeConnector";
import { generateCompleteLandingPackage } from "@/lib/novaCompleteLanding";
import {
  LANDING_PAGE_WITH_IMAGES,
  landingPricingPublic,
} from "@/lib/novaLandingPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({
    success: true,
    tool: "nova_generate_complete_landing_page",
    method: "POST",
    endpoint: "/api/claude/tools/generate-complete-landing-page",
    description:
      "Generate a complete landing page with layout, copy, 4 AI-generated images and export ZIP.",
    pricing: landingPricingPublic(),
    requires: {
      authorization: "Bearer YOUR_NOVA_API_KEY",
      billing: `${LANDING_PAGE_WITH_IMAGES.novaCreditsRequired} NOVA API credits required.`,
      checkoutUrl: "/checkout/api-credits?pack=starter",
    },
    example: {
      product: "Luxury watch",
      platform: "shopify-theme",
      brandName: "Maison Nova",
      audience: "Men and women 25-45 who buy premium watches",
      style: "black and neon green luxury ecommerce",
      language: "en",
      cta: "Shop Now",
    },
  });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const gate = await requireNovaApiCredits(
    req,
    LANDING_PAGE_WITH_IMAGES.novaCreditsRequired
  );

  if (!gate.ok) return gate.response;

  try {
    const result = await generateCompleteLandingPackage({ body, gate });

    return NextResponse.json({
      success: true,
      ...result,
      billing: {
        wallet: "nova_api_credits",
        creditsCharged: LANDING_PAGE_WITH_IMAGES.novaCreditsRequired,
        remainingApiCredits: gate.remainingBalance,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "LANDING_PAGE_GENERATION_FAILED",
        message:
          err?.message ||
          "Could not generate the complete landing page package.",
      },
      { status: 500 }
    );
  }
}
