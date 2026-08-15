import { NextResponse } from "next/server";
import { ingestEvents } from "@/lib/analytics/db";

/**
 * POST /api/analytics/event
 * Recebe lotes de eventos do tracker client-side.
 * Rota pública — não exige auth (visitantes anônimos precisam ser rastreados).
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const events = Array.isArray(body) ? body : body.events || [body];

    if (events.length === 0) {
      return NextResponse.json({ ok: true, ingested: 0 });
    }

    const count = await ingestEvents(events);
    return NextResponse.json({ ok: true, ingested: count });
  } catch (err) {
    console.error("[analytics/event]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
