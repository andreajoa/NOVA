import { d1Rows, queryD1 } from "@/lib/db";

const DEFAULT_DAILY_UNITS = 30;
let ensureTablePromise = null;

function utcPeriod(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function nextUtcReset(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    0, 0, 0, 0
  )).toISOString();
}

function dailyLimit() {
  const raw = Number(process.env.NOVA_VIDEO_INCLUDED_DAILY_CAP_UNITS);
  if (Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
  return DEFAULT_DAILY_UNITS;
}

export function videoCapacityUnits(seconds) {
  return Math.max(1, Math.ceil(Number(seconds || 5) / 5));
}

async function ensureTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = queryD1(`
      CREATE TABLE IF NOT EXISTS nova_compute_budget (
        period TEXT NOT NULL,
        kind TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (period, kind)
      )
    `).catch((error) => {
      ensureTablePromise = null;
      throw error;
    });
  }
  await ensureTablePromise;
}

export async function reserveVideoCapacity(seconds) {
  await ensureTable();
  const period = utcPeriod();
  const limit = dailyLimit();
  const units = videoCapacityUnits(seconds);
  const now = Math.floor(Date.now() / 1000);

  if (limit <= 0 || units > limit) {
    return { ok: false, used: 0, limit, units, remaining: 0, resetAt: nextUtcReset() };
  }

  const result = await queryD1(
    `INSERT INTO nova_compute_budget (period, kind, used, updated_at)
     VALUES (?, 'included-video', ?, ?)
     ON CONFLICT(period, kind) DO UPDATE SET
       used = nova_compute_budget.used + excluded.used,
       updated_at = excluded.updated_at
     WHERE nova_compute_budget.used + excluded.used <= ?
     RETURNING used`,
    [period, units, now, limit]
  );

  const row = d1Rows(result)[0];
  if (!row) {
    const current = await queryD1(
      `SELECT used FROM nova_compute_budget WHERE period = ? AND kind = 'included-video' LIMIT 1`,
      [period]
    );
    const used = Number(d1Rows(current)[0]?.used ?? limit);
    return { ok: false, used, limit, units, remaining: Math.max(0, limit - used), resetAt: nextUtcReset() };
  }

  const used = Number(row.used || 0);
  return {
    ok: true,
    used,
    limit,
    units,
    remaining: Math.max(0, limit - used),
    resetAt: nextUtcReset(),
  };
}

export async function refundVideoCapacity(units) {
  const amount = Math.max(1, Number(units || 1));
  await ensureTable();
  const period = utcPeriod();
  await queryD1(
    `UPDATE nova_compute_budget
     SET used = CASE WHEN used >= ? THEN used - ? ELSE 0 END,
         updated_at = ?
     WHERE period = ? AND kind = 'included-video'`,
    [amount, amount, Math.floor(Date.now() / 1000), period]
  );
}
