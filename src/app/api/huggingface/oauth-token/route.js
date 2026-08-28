import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safePkceValue(value) {
  const raw = String(value || "").trim();
  return /^[A-Za-z0-9._~-]{43,128}$/.test(raw) ? raw : "";
}

export async function POST(req) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  const verifier = safePkceValue(body.code_verifier);
  const origin = req.nextUrl.origin;
  const clientId = `${origin}/.well-known/oauth-cimd`;
  const redirectUri = `${origin}/oauth/callback/huggingface`;

  if (!code || !verifier) {
    return NextResponse.json(
      { success: false, error: "Invalid Hugging Face OAuth callback." },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });

  const response = await fetch("https://huggingface.co/oauth/token", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  });

  const payload = await response.json().catch(() => ({}));
  const accessToken = String(payload?.access_token || "").trim();

  if (!response.ok || !accessToken.startsWith("hf_")) {
    console.warn("[NOVA_VIDEO] Hugging Face OAuth exchange failed", {
      status: response.status,
      error: payload?.error || null,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível ativar a capacidade gratuita pessoal de vídeo.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    accessToken,
    tokenType: payload?.token_type || "bearer",
    expiresIn: Number(payload?.expires_in || 0) || 8 * 60 * 60,
    scope: payload?.scope || "",
  });
}
