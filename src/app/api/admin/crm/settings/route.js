import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/crm/db";
import { requireCrmAdmin } from "@/lib/crm/guard";
import { runDispatch } from "@/lib/crm/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const KEYS = {
  crm_paused: { label: "Kill switch global", parse: (v) => (v ? "1" : "0") },
  crm_cadence_days: { label: "Cadência fixa em dias (0 = usar o escalonado)", parse: (v) => String(Math.max(0, Number(v) || 0)) },
  crm_max_no_open_streak: { label: "Pausar após N e-mails sem abertura", parse: (v) => String(Math.max(1, Number(v) || 10)) },
  crm_max_per_run: { label: "Máximo de envios por ciclo", parse: (v) => String(Math.min(200, Math.max(1, Number(v) || 60))) },
};

export async function GET() {
  const guard = await requireCrmAdmin();
  if (!guard.ok) return guard.response;

  return NextResponse.json({
    ok: true,
    settings: {
      paused: (await getSetting("crm_paused", "0")) === "1",
      cadenceDays: Number(await getSetting("crm_cadence_days", "0")),
      maxNoOpenStreak: Number(await getSetting("crm_max_no_open_streak", "10")),
      maxPerRun: Number(await getSetting("crm_max_per_run", "60")),
    },
    keys: Object.fromEntries(Object.entries(KEYS).map(([key, meta]) => [key, meta.label])),
  });
}

export async function POST(request) {
  const guard = await requireCrmAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));

  // Ação de teste: roda um ciclo agora, sem esperar o cron.
  if (body.action === "run_now") {
    const result = await runDispatch({
      limit: Number(body.limit || 20),
      dryRun: body.dryRun === true,
    });
    return NextResponse.json({ ok: true, action: "run_now", result });
  }

  const applied = {};

  for (const [key, meta] of Object.entries(KEYS)) {
    if (key in body) {
      const value = meta.parse(body[key]);
      await setSetting(key, value);
      applied[key] = value;
    }
  }

  if (!Object.keys(applied).length) {
    return NextResponse.json({ error: "Nenhuma configuração reconhecida no corpo." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, applied });
}
