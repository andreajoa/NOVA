import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser, queryD1, d1Rows } from "@/lib/db";

export const dynamic = "force-dynamic";

async function ensureFalBalanceTable() {
  await queryD1(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await queryD1(`
    CREATE TABLE IF NOT EXISTS fal_spending_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL DEFAULT '',
      estimated_cost REAL NOT NULL DEFAULT 0,
      credits_charged INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

/**
 * GET — Retorna saldo estimado, gastos recentes e alertas
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await isAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ensureFalBalanceTable();

  // Saldo informado pelo admin
  const balRow = d1Rows(
    await queryD1("SELECT value, updated_at FROM admin_settings WHERE key = 'fal_balance' LIMIT 1")
  )[0];
  const setBalance = balRow ? Number(balRow.value) : 0;
  const balanceSetAt = balRow?.updated_at || null;

  // Total gasto desde o último set de saldo
  const spentSinceRes = d1Rows(
    await queryD1(
      `SELECT COALESCE(SUM(estimated_cost), 0) as total
       FROM fal_spending_log
       WHERE created_at >= COALESCE((SELECT updated_at FROM admin_settings WHERE key = 'fal_balance'), '2000-01-01')`
    )
  )[0];
  const totalSpent = Number(spentSinceRes?.total || 0);

  // Gastos hoje
  const todayRes = d1Rows(
    await queryD1(
      `SELECT COALESCE(SUM(estimated_cost), 0) as total, COUNT(*) as count
       FROM fal_spending_log WHERE created_at >= date('now')`
    )
  )[0];
  const todaySpent = Number(todayRes?.total || 0);
  const todayCount = Number(todayRes?.count || 0);

  // Gastos últimos 7 dias
  const weekRes = d1Rows(
    await queryD1(
      `SELECT COALESCE(SUM(estimated_cost), 0) as total, COUNT(*) as count
       FROM fal_spending_log WHERE created_at >= date('now', '-7 days')`
    )
  )[0];
  const weekSpent = Number(weekRes?.total || 0);
  const weekCount = Number(weekRes?.count || 0);

  // Últimas 10 gerações
  const recentRows = d1Rows(
    await queryD1(
      `SELECT user_id, endpoint, estimated_cost, credits_charged, created_at
       FROM fal_spending_log ORDER BY created_at DESC LIMIT 10`
    )
  );

  const estimatedBalance = Math.max(0, setBalance - totalSpent);

  // Dias estimados restantes baseado na média diária da última semana
  const avgDaily = weekSpent > 0 ? weekSpent / 7 : 0;
  const estimatedDaysLeft = avgDaily > 0 ? Math.floor(estimatedBalance / avgDaily) : null;

  return NextResponse.json({
    balance: estimatedBalance,
    setBalance,
    balanceSetAt,
    totalSpent,
    todaySpent,
    todayCount,
    weekSpent,
    weekCount,
    avgDaily: Math.round(avgDaily * 100) / 100,
    estimatedDaysLeft,
    recentGenerations: recentRows,
  });
}

/**
 * POST — Admin define o saldo atual (quando recarrega no fal.ai)
 */
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await isAdminUser(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ensureFalBalanceTable();

  const { balance } = await req.json();
  await queryD1(
    "INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES ('fal_balance', ?, datetime('now'))",
    [String(balance)]
  );
  return NextResponse.json({ ok: true, balance });
}
