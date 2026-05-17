import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MCP_PROTOCOL_VERSION = "2025-03-26";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Accept, Mcp-Session-Id, MCP-Protocol-Version",
};

const tools = [
  {
    name: "nova_generate_image",
    title: "NOVA Generate Image",
    description:
      "Generate AI images, product creatives, ads and campaign visuals using NOVA. Requires NOVA API Key and NOVA API credits.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Image prompt." },
        model: { type: "string", description: "Optional NOVA image model." },
        aspectRatio: { type: "string", description: "Aspect ratio, for example 1:1, 16:9, 9:16." },
      },
      required: ["prompt"],
    },
  },
  {
    name: "nova_generate_video",
    title: "NOVA Generate Video",
    description:
      "Generate short AI videos using NOVA. Requires NOVA API Key and NOVA API credits.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Video prompt." },
        model: { type: "string", description: "Optional NOVA video model." },
        seconds: { type: "number", description: "Video duration in seconds." },
        aspectRatio: { type: "string", description: "Aspect ratio, for example 16:9 or 9:16." },
      },
      required: ["prompt"],
    },
  },
  {
    name: "nova_create_campaign",
    title: "NOVA Create Campaign",
    description:
      "Create a NOVA-ready campaign plan with hooks, scripts, image prompts, video prompts and creative direction.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product, offer or business." },
        audience: { type: "string", description: "Target audience." },
        goal: { type: "string", description: "Campaign goal." },
        style: { type: "string", description: "Visual/creative style." },
      },
      required: ["product"],
    },
  },
  {
    name: "nova_create_landing_page_design",
    title: "NOVA Create Landing Page Design",
    description:
      "Create a professional landing page structure, copy, section plan and export strategy for Shopify, Hydrogen/Oxygen, Next.js, React or HTML.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product, offer or store." },
        platform: { type: "string", description: "html, react, nextjs, hydrogen, shopify-theme.", default: "html" },
        brandName: { type: "string", description: "Brand or store name." },
        audience: { type: "string", description: "Target audience." },
        style: { type: "string", description: "Visual direction." },
        language: { type: "string", description: "Language, for example en or pt-BR.", default: "en" },
        cta: { type: "string", description: "Primary CTA.", default: "Shop Now" },
      },
      required: ["product"],
    },
  },
  {
    name: "nova_export_landing_page_zip",
    title: "NOVA Export Landing Page ZIP",
    description:
      "Export a complete NOVA landing page ZIP with 4 AI-generated images for Shopify Theme, Hydrogen/Oxygen, Next.js, React or HTML. Costs 24 NOVA API credits.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product, offer or store." },
        platform: { type: "string", description: "html, react, nextjs, hydrogen, shopify-theme.", default: "html" },
        brandName: { type: "string", description: "Brand or store name." },
        audience: { type: "string", description: "Target audience." },
        style: { type: "string", description: "Visual direction." },
        language: { type: "string", description: "Language, for example en or pt-BR.", default: "en" },
        cta: { type: "string", description: "Primary CTA.", default: "Shop Now" },
      },
      required: ["product"],
    },
  },
  {
    name: "nova_generate_complete_landing_page",
    title: "NOVA Generate Complete Landing Page",
    description:
      "Generate a complete landing page with layout, copy, 4 AI-generated images and export ZIP. Supports Shopify Theme, Hydrogen/Oxygen, Next.js, React and HTML. Costs 24 NOVA API credits.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product, offer or store." },
        platform: { type: "string", description: "html, react, nextjs, hydrogen, shopify-theme.", default: "html" },
        brandName: { type: "string", description: "Brand or store name." },
        audience: { type: "string", description: "Target audience." },
        style: { type: "string", description: "Visual direction." },
        language: { type: "string", description: "Language, for example en or pt-BR.", default: "en" },
        cta: { type: "string", description: "Primary CTA.", default: "Shop Now" },
      },
      required: ["product"],
    },
  },
];

const endpointByTool = {
  nova_generate_image: "/api/claude/tools/generate-image",
  nova_generate_video: "/api/claude/tools/generate-video",
  nova_create_campaign: "/api/claude/tools/create-campaign",
  nova_create_landing_page_design: "/api/claude/tools/create-landing-page",
  nova_export_landing_page_zip: "/api/claude/tools/export-landing-page",
  nova_generate_complete_landing_page: "/api/claude/tools/generate-complete-landing-page",
};

function getNovaMcpAuthorization(req) {
  const fromHeader =
    req?.headers?.get?.("authorization") ||
    req?.headers?.get?.("Authorization") ||
    "";

  if (fromHeader) return fromHeader;

  try {
    const url = new URL(req.url);
    const apiKey =
      url.searchParams.get("apiKey") ||
      url.searchParams.get("novaApiKey") ||
      url.searchParams.get("key") ||
      "";

    return apiKey ? `Bearer ${apiKey}` : "";
  } catch {
    return "";
  }
}

function jsonRpc(id, result) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id,
      result,
    },
    { headers: CORS_HEADERS }
  );
}

function jsonRpcError(id, code, message, data) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        ...(data ? { data } : {}),
      },
    },
    { status: code === -32603 ? 500 : 200, headers: CORS_HEADERS }
  );
}

function publicInfo(req) {
  const url = new URL(req.url);
  const origin = url.origin;

  return {
    success: true,
    name: "NOVA Remote MCP",
    protocolVersion: MCP_PROTOCOL_VERSION,
    endpoint: `${origin}/api/claude/mcp`,
    description:
      "Remote MCP endpoint for connecting Claude AI to NOVA. It exposes NOVA image, video, campaign and landing page tools.",
    authorization:
      "Optional to connect; required to generate. Use Authorization: Bearer YOUR_NOVA_API_KEY, or connect Claude with /api/claude/mcp?apiKey=YOUR_NOVA_API_KEY.",
    credits:
      "Claude AI usage requires NOVA API credits. Dashboard usage inside NOVA uses internal NOVA credits.",
    claudeConnectPage: `${origin}/dashboard/claude-connect`,
    tools: tools.map((tool) => tool.name),
  };
}

async function callTool(req, id, params) {
  const toolName = params?.name;
  const args = params?.arguments || {};

  const path = endpointByTool[toolName];

  if (!path) {
    return jsonRpcError(id, -32602, "Unknown NOVA MCP tool", {
      toolName,
      availableTools: tools.map((tool) => tool.name),
    });
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const authorization = getNovaMcpAuthorization(req);

  try {
    const res = await fetch(`${origin}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await res.json().catch(() => ({}))
      : { text: await res.text().catch(() => "") };

    const wrapped = {
      tool: toolName,
      ok: res.ok,
      status: res.status,
      result: payload,
    };

    return jsonRpc(id, {
      content: [
        {
          type: "text",
          text: JSON.stringify(wrapped, null, 2),
        },
      ],
      isError: !res.ok,
    });
  } catch (err) {
    return jsonRpc(id, {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              tool: toolName,
              ok: false,
              error: "NOVA_MCP_TOOL_CALL_FAILED",
              message: err?.message || "Could not call NOVA tool endpoint.",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req) {
  try {
    return NextResponse.json(publicInfo(req), { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "NOVA_MCP_GET_FAILED",
        message: err?.message || "MCP GET failed.",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(req) {
  try {
    let body;

    try {
      body = await req.json();
    } catch {
      return jsonRpcError(null, -32700, "Invalid JSON body");
    }

    const id = body?.id ?? null;
    const method = body?.method;

    if (method === "initialize") {
      return jsonRpc(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "NOVA",
          version: "1.0.0",
        },
      });
    }

    if (method === "notifications/initialized") {
      return jsonRpc(id, {});
    }

    if (method === "tools/list") {
      return jsonRpc(id, {
        tools: tools.filter(Boolean),
      });
    }

    if (method === "tools/call") {
      return callTool(req, id, body?.params || {});
    }

    return jsonRpcError(id, -32601, "Method not found", {
      method,
    });
  } catch (err) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: err?.message || "NOVA MCP runtime error.",
        },
      },
      { status: 200, headers: CORS_HEADERS }
    );
  }
}
