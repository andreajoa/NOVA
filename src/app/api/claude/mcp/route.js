import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

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
      "Generate AI images, product creatives, ads and campaign visuals using NOVA. Requires NOVA API Key and NOVA API credits. Minimum API credit purchase: $10.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Generation-ready visual prompt.",
        },
        model: {
          type: "string",
          description: "NOVA image model. Suggested: flux-schnell, flux-pro, gpt-image, recraft-v3.",
          default: "flux-schnell",
        },
        mode: {
          type: "string",
          description: "Generation mode.",
          default: "text-to-image",
        },
        aspect_ratio: {
          type: "string",
          description: "Aspect ratio such as 1:1, 16:9 or 9:16.",
          default: "1:1",
        },
        num_images: {
          type: "number",
          description: "Number of images.",
          default: 1,
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "nova_generate_video",
    title: "NOVA Generate Video",
    description:
      "Generate short AI videos using NOVA video models. Requires NOVA API Key and NOVA API credits. Minimum API credit purchase: $10.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Generation-ready video prompt.",
        },
        model: {
          type: "string",
          description: "NOVA video model. Suggested: seedance or kling.",
          default: "seedance",
        },
        mode: {
          type: "string",
          description: "Generation mode.",
          default: "text-to-video",
        },
        seconds: {
          type: "number",
          description: "Video duration in seconds.",
          default: 5,
        },
        aspect_ratio: {
          type: "string",
          description: "Aspect ratio such as 16:9, 9:16 or 1:1.",
          default: "16:9",
        },
        resolution: {
          type: "string",
          description: "Resolution such as 720p, 1080p or 4K.",
          default: "1080p",
        },
        image_url: {
          type: "string",
          description: "Optional image URL for image-to-video modes.",
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "nova_create_campaign",
    title: "NOVA Create Campaign",
    description:
      "Create a NOVA-ready campaign plan with prompts for image, video and UGC. Requires NOVA API Key and NOVA API credits. Minimum API credit purchase: $10.",
    inputSchema: {
      type: "object",
      properties: {
        product: {
          type: "string",
          description: "Product, offer or business to promote.",
        },
        goal: {
          type: "string",
          description: "Campaign goal.",
          default: "Generate sales and desire",
        },
        audience: {
          type: "string",
          description: "Target audience.",
          default: "High-intent buyers",
        },
        style: {
          type: "string",
          description: "Visual direction.",
          default: "NOVA neon black and green premium visual system",
        },
      },
      required: ["product"],
    },
  },,

  {
    name: "nova_create_landing_page_design",
    title: "NOVA Create Landing Page Design",
    description:
      "Create a professional landing page layout, copy, sections, visual direction and export plan for Shopify, Hydrogen/Oxygen, Next.js, React or HTML. Requires NOVA API Key and API credits.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product, offer or store to build the landing page for." },
        platform: { type: "string", description: "Target platform: html, react, nextjs, hydrogen, shopify-theme.", default: "html" },
        brandName: { type: "string", description: "Brand or store name.", default: "NOVA Brand" },
        audience: { type: "string", description: "Target audience." },
        goal: { type: "string", description: "Page goal.", default: "Generate desire and sales" },
        style: { type: "string", description: "Visual style.", default: "black and neon green premium ecommerce" },
        language: { type: "string", description: "Language, for example en or pt-BR.", default: "en" },
        cta: { type: "string", description: "Primary CTA.", default: "Shop Now" }
      },
      required: ["product"]
    }
  },
  {
    name: "nova_export_landing_page_zip",
    title: "NOVA Export Landing Page ZIP",
    description:
      "Export a landing page as a downloadable ZIP for Shopify Theme, Hydrogen/Oxygen, Next.js, React or HTML. Requires NOVA API Key and API credits.",
    inputSchema: {
      type: "object",
      properties: {
        platform: { type: "string", description: "Export target: html, react, nextjs, hydrogen, shopify-theme.", default: "html" },
        product: { type: "string", description: "Product or offer." },
        brandName: { type: "string", description: "Brand/store name." },
        audience: { type: "string", description: "Target audience." },
        style: { type: "string", description: "Visual direction." },
        language: { type: "string", description: "Language.", default: "en" },
        design: { type: "object", description: "Optional design object returned by nova_create_landing_page_design." }
      }
    }
  }
];

function json(data, status = 200, extraHeaders = {}) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function rpcResult(id, result) {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function rpcError(id, code, message, data = undefined) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: {
      code,
      message,
      ...(data !== undefined ? { data } : {}),
    },
  };
}

function getOrigin(req) {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(req.url).origin;
}

function authHeader(req) {
  return req.headers.get("authorization") || "";
}

async function callNovaRestTool(req, toolName, args = {}) {
  const origin = getOrigin(req);

  const endpointByTool = {
    nova_generate_image: "/api/claude/tools/generate-image",
    nova_generate_video: "/api/claude/tools/generate-video",
    nova_create_campaign: "/api/claude/tools/create-campaign",
    nova_create_landing_page_design: "/api/claude/tools/create-landing-page",
    nova_export_landing_page_zip: "/api/claude/tools/export-landing-page",
  };

  const path = endpointByTool[toolName];

  if (!path) {
    return {
      ok: false,
      status: 404,
      data: {
        success: false,
        error: "Unknown NOVA MCP tool.",
        toolName,
      },
    };
  }

  const res = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader(req) ? { Authorization: authHeader(req) } : {}),
    },
    body: JSON.stringify(args || {}),
    cache: "no-store",
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = {
      success: false,
      raw: text,
    };
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}

async function handleRpcMessage(req, message) {
  const id = message?.id;
  const method = message?.method;
  const params = message?.params || {};

  if (!method) {
    return rpcError(id, -32600, "Invalid JSON-RPC request.");
  }

  if (method.startsWith("notifications/")) {
    return null;
  }

  if (method === "initialize") {
    return rpcResult(id, {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
      serverInfo: {
        name: "NOVA Claude Connector",
        version: "1.0.0",
      },
      instructions:
        "Use NOVA tools to create image, video and campaign assets. Tool execution requires a NOVA API Key and NOVA API credits. Minimum API credit purchase: $10. If the tool returns NOVA_API_KEY_REQUIRED or NOVA_API_CREDITS_REQUIRED, tell the user to buy API credits and create a NOVA API Key at https://www.novvideos.online/claude.",
    });
  }

  if (method === "ping") {
    return rpcResult(id, {});
  }

  if (method === "tools/list") {
    return rpcResult(id, {
      tools: tools.filter(Boolean),
    });
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments || {};

    if (!toolName) {
      return rpcError(id, -32602, "Missing tool name.");
    }

    const result = await callNovaRestTool(req, toolName, args);

    const text = JSON.stringify(
      {
        tool: toolName,
        ok: result.ok,
        status: result.status,
        result: result.data,
      },
      null,
      2
    );

    return rpcResult(id, {
      content: [
        {
          type: "text",
          text,
        },
      ],
      isError: !result.ok,
    });
  }

  if (method === "resources/list") {
    return rpcResult(id, {
      resources: [],
    });
  }

  if (method === "prompts/list") {
    return rpcResult(id, {
      prompts: [],
    });
  }

  return rpcError(id, -32601, `Method not found: ${method}`);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req) {
  const accept = req.headers.get("accept") || "";

  if (accept.includes("text/event-stream")) {
    return new Response("SSE stream is not enabled for this MCP endpoint. Use HTTP POST JSON-RPC.", {
      status: 405,
      headers: {
        ...CORS_HEADERS,
        Allow: "POST, OPTIONS",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return json({
    success: true,
    name: "NOVA Claude Remote MCP Server",
    mcpEndpoint: "/api/claude/mcp",
    fullUrl: `${getOrigin(req)}/api/claude/mcp`,
    description:
      "Remote MCP endpoint for connecting Claude AI to NOVA. It exposes NOVA image, video and campaign tools.",
    connection: {
      claudeConnectorUrl: `${getOrigin(req)}/api/claude/mcp`,
      authorization: "Optional to connect; required to generate. Use: Authorization: Bearer YOUR_NOVA_API_KEY",
      billing:
        "Generation requires NOVA API credits. Minimum API credit purchase: $10.",
      checkoutUrl: `${getOrigin(req)}/checkout/api-credits?pack=starter`,
    },
    tools: tools.filter(Boolean).map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
    })),
    test: {
      initialize: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: {
            name: "manual-test",
            version: "1.0.0",
          },
        },
      },
      toolsList: {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      },
    },
  });
}

export async function POST(req) {
  let body;

  try {
    body = await req.json();
  } catch {
    return json(rpcError(null, -32700, "Parse error. Body must be JSON-RPC."), 400);
  }

  try {
    if (Array.isArray(body)) {
      const responses = [];

      for (const message of body) {
        const response = await handleRpcMessage(req, message);
        if (response) responses.push(response);
      }

      if (!responses.length) {
        return new Response(null, {
          status: 202,
          headers: CORS_HEADERS,
        });
      }

      return json(responses);
    }

    const response = await handleRpcMessage(req, body);

    if (!response) {
      return new Response(null, {
        status: 202,
        headers: CORS_HEADERS,
      });
    }

    return json(response);
  } catch (err) {
    return json(
      rpcError(body?.id ?? null, -32603, err?.message || "Internal MCP server error."),
      500
    );
  }
}
