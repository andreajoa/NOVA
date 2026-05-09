import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "NOVA tools for Claude AI.",
    requires: [
      "NOVA API Key",
      "NOVA API credits",
      "Minimum API credit purchase: $10",
      "Claude environment that supports external tools/connectors/MCP",
    ],
    tools: {
      generateImage: "/api/claude/tools/generate-image",
      generateVideo: "/api/claude/tools/generate-video",
      createCampaign: "/api/claude/tools/create-campaign",
      manifest: "/api/claude/manifest",
    },
  });
}
