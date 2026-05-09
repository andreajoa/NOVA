import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { NOVA_CREATIVE_AGENT_SYSTEM } from "@/lib/creativeAgentSystem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

function safeJsonParse(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {}

  const match = String(text).match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function normalizeAgentResponse(parsed, fallbackText = "") {
  return {
    answer: parsed?.answer || fallbackText || "Claude respondeu, mas não retornou no formato esperado.",
    strategy: Array.isArray(parsed?.strategy) ? parsed.strategy : [],
    campaign: parsed?.campaign || null,
    prompts: Array.isArray(parsed?.prompts) ? parsed.prompts : [],
    contentIdeas: Array.isArray(parsed?.contentIdeas) ? parsed.contentIdeas : [],
    nextActions: Array.isArray(parsed?.nextActions) ? parsed.nextActions : [],
    warnings: Array.isArray(parsed?.warnings) ? parsed.warnings : [],
    raw: parsed || fallbackText,
  };
}

function cleanMessages(messages = []) {
  return messages
    .slice(-12)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && String(m.content || "").trim())
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, 12000),
    }));
}

export async function POST(req) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        code: "ANTHROPIC_API_KEY_MISSING",
        error: "ANTHROPIC_API_KEY não está configurada. Adicione a chave no .env.local e na Vercel para ativar o Claude Creative Agent.",
      },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const briefing = {
    brand: body.brand || "NOVA",
    product: body.product || "",
    goal: body.goal || "",
    audience: body.audience || "",
    language: body.language || "pt-BR",
    channel: body.channel || "",
    style: body.style || "",
    currentRoute: body.currentRoute || "/dashboard/creative-agent",
  };

  const userPrompt = String(body.message || "").trim();

  if (!userPrompt) {
    return NextResponse.json({ success: false, error: "Missing message" }, { status: 400 });
  }

  const messages = cleanMessages(body.messages || []);

  messages.push({
    role: "user",
    content: `
Briefing:
${JSON.stringify(briefing, null, 2)}

User request:
${userPrompt}
`,
  });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 3500),
        temperature: 0.7,
        system: NOVA_CREATIVE_AGENT_SYSTEM,
        messages,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error?.message || "Claude API error",
          detail: data,
        },
        { status: res.status }
      );
    }

    const text = (data?.content || [])
      .filter((item) => item?.type === "text")
      .map((item) => item.text)
      .join("\n")
      .trim();

    const parsed = safeJsonParse(text);
    const agent = normalizeAgentResponse(parsed, text);

    return NextResponse.json({
      success: true,
      provider: "anthropic",
      model: DEFAULT_MODEL,
      agent,
      usage: data?.usage || null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Creative Agent failed",
      },
      { status: 500 }
    );
  }
}
