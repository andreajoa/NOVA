import { d1Rows, queryD1 } from "@/lib/db";

const DEFAULT_CLOUDFLARE_IMAGE_DAILY_CAP = 150;
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

function cloudflareImageCap() {
  const value = Number(process.env.NOVA_CLOUDFLARE_IMAGE_DAILY_CAP);
  if (Number.isFinite(value) && value >= 0) return Math.floor(value);
  return DEFAULT_CLOUDFLARE_IMAGE_DAILY_CAP;
}

async function ensureTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = queryD1(`
      CREATE TABLE IF NOT EXISTS free_provider_usage (
        provider TEXT NOT NULL,
        period TEXT NOT NULL,
        kind TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (provider, period, kind)
      )
    `).catch((error) => {
      ensureTablePromise = null;
      throw error;
    });
  }
  await ensureTablePromise;
}

export async function reserveCloudflareFreeImage() {
  await ensureTable();
  const period = utcPeriod();
  const limit = cloudflareImageCap();
  const now = Math.floor(Date.now() / 1000);

  if (limit <= 0) {
    return { ok: false, used: 0, limit, remaining: 0, period, resetAt: nextUtcReset() };
  }

  const res = await queryD1(
    `INSERT INTO free_provider_usage (provider, period, kind, used, updated_at)
     VALUES ('cloudflare-workers-ai', ?, 'image', 1, ?)
     ON CONFLICT(provider, period, kind) DO UPDATE SET
       used = free_provider_usage.used + 1,
       updated_at = excluded.updated_at
     WHERE free_provider_usage.used < ?
     RETURNING used`,
    [period, now, limit]
  );

  const row = d1Rows(res)[0];
  if (!row) {
    const current = await queryD1(
      `SELECT used FROM free_provider_usage
       WHERE provider = 'cloudflare-workers-ai' AND period = ? AND kind = 'image' LIMIT 1`,
      [period]
    );
    const used = Number(d1Rows(current)[0]?.used ?? limit);
    return { ok: false, used, limit, remaining: Math.max(0, limit - used), period, resetAt: nextUtcReset() };
  }

  const used = Number(row.used ?? 0);
  return { ok: true, used, limit, remaining: Math.max(0, limit - used), period, resetAt: nextUtcReset() };
}

export async function refundCloudflareFreeImage() {
  await ensureTable();
  const period = utcPeriod();
  await queryD1(
    `UPDATE free_provider_usage
     SET used = CASE WHEN used > 0 THEN used - 1 ELSE 0 END,
         updated_at = ?
     WHERE provider = 'cloudflare-workers-ai' AND period = ? AND kind = 'image'`,
    [Math.floor(Date.now() / 1000), period]
  );
}
