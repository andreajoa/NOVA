import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.novvideos.online";

  return NextResponse.json({
    name: "NOVA Claude Connector",
    description:
      "Connect Claude AI to NOVA to generate images, videos, product ads, UGC concepts and campaign prompts using NOVA API credits.",
    mcpServer: {
      url: `${baseUrl}/api/claude/mcp`,
      transport: "streamable_http",
      description: "Use this URL in Claude.ai custom connector settings.",
    },
    auth: {
      type: "api_key",
      header: "Authorization",
      format: "Bearer YOUR_NOVA_API_KEY",
      required: "required_for_generation_not_for_listing_tools",
    },
    billing: {
      required: true,
      message:
        "NOVA API credits are required. Minimum purchase is $10.",
      minimumPurchase: "$10",
      checkoutUrl: `${baseUrl}/checkout/api-credits?pack=starter`,
    },
    tools: [
      {
        name: "nova_generate_image",
        method: "POST",
        url: `${baseUrl}/api/claude/tools/generate-image`,
        description:
          "Generate product images, ads, campaign visuals and AI creatives using NOVA image models.",
      },
      {
        name: "nova_generate_video",
        method: "POST",
        url: `${baseUrl}/api/claude/tools/generate-video`,
        description:
          "Generate short AI videos using NOVA video models and fal.ai execution.",
      },
      {
        name: "nova_create_campaign",
        method: "POST",
        url: `${baseUrl}/api/claude/tools/create-campaign`,
        description:
          "Create a NOVA-ready campaign plan with prompts, scripts, content ideas and recommended generation routes.",
      },
    ],
    important:
      "Claude AI must support external tools/connectors/MCP in the user's plan/environment. NOVA execution requires a paid NOVA API credit balance.",
  });
}
