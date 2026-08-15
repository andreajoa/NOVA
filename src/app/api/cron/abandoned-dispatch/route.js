import { NextResponse } from "next/server";
import { runAbandonedDispatch } from "@/lib/crm/abandoned";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron/abandoned-dispatch
 *
 * Cron diário que envia os e-mails de abandoned checkout (emails 1-4).
 * O email 0 é enviado imediatamente pelo webhook do Stripe.
 *
 * Auth: Bearer CRON_SECRET ou ?secret=CRON_SECRET
 */
export async function GET(req) {
  return handle(req);
}
export async function POST(req) {
  return handle(req);
}

async function handle(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  const authHeader = req.headers.get("authorization") || "";
  const bearerSecret = authHeader.replace(/^Bearer\s+/i, "");

  if (querySecret !== secret && bearerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = url.searchParams.get("dry") === "1";
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

  try {
    const result = await runAbandonedDispatch({ dryRun, limit });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[abandoned-dispatch]", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
