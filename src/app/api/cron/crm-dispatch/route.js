import { NextResponse } from "next/server";
import { runDispatch } from "@/lib/crm/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Ciclo de disparo do CRM. Chamado pelo Vercel Cron (ver vercel.json).
 *
 * Autenticação: o Vercel Cron manda `Authorization: Bearer $CRON_SECRET`.
 * Sem CRON_SECRET configurado a rota recusa tudo — é preferível não disparar
 * a deixar um endpoint que envia e-mail aberto na internet.
 */
function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") || "";
  if (header === `Bearer ${secret}`) return true;

  // Fallback para chamada manual autenticada por query string.
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

async function handle(request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const limit = Number(url.searchParams.get("limit") || 60);

  try {
    const result = await runDispatch({ limit, dryRun });
    console.log("[crm] dispatch", {
      due: result.due,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
      paused: result.paused,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[crm] dispatch failed:", error);
    return NextResponse.json(
      { ok: false, error: "DISPATCH_FAILED", message: String(error?.message || error) },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return handle(request);
}

export async function POST(request) {
  return handle(request);
}
