import { d1Rows, queryD1 } from "@/lib/db";

const DEFAULT_LIMITS = {
  image: 10,
  video: 1,
};

const FREE_PERIOD = "lifetime";
let ensureTablePromise = null;

function limitFor(kind) {
  const envName = kind === "video"
    ? "NOVA_FREE_VIDEO_LIMIT"
    : "NOVA_FREE_IMAGE_LIMIT";
  const raw = Number(process.env[envName]);
  if (Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
  return DEFAULT_LIMITS[kind] ?? 0;
}

async function ensureFreeUsageTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = queryD1(`
      CREATE TABLE IF NOT EXISTS free_generation_usage (
        user_id TEXT NOT NULL,
        period TEXT NOT NULL,
        kind TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, period, kind)
      )
    `).catch((error) => {
      ensureTablePromise = null;
      throw error;
    });
  }
  await ensureTablePromise;
}

export function getFreeGenerationLimit(kind) {
  return limitFor(kind);
}

export async function getFreeGenerationUsage(userId, kind) {
  await ensureFreeUsageTable();
  const limit = limitFor(kind);
  const res = await queryD1(
    `SELECT used FROM free_generation_usage WHERE user_id = ? AND period = ? AND kind = ? LIMIT 1`,
    [userId, FREE_PERIOD, kind]
  );
  const row = d1Rows(res)[0];
  const used = Number(row?.used ?? 0);
  return {
    kind,
    period: FREE_PERIOD,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function checkAndDebitFreeGeneration(userId, kind) {
  if (!userId) throw new Error("userId is required for free generation quota");
  if (kind !== "image" && kind !== "video") throw new Error(`Unsupported free quota kind: ${kind}`);

  await ensureFreeUsageTable();
  const limit = limitFor(kind);

  if (limit <= 0) {
    return { ok: false, kind, period: FREE_PERIOD, used: 0, limit, remaining: 0 };
  }

  const now = Math.floor(Date.now() / 1000);
  const res = await queryD1(
    `INSERT INTO free_generation_usage (user_id, period, kind, used, updated_at)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(user_id, period, kind) DO UPDATE SET
       used = free_generation_usage.used + 1,
       updated_at = excluded.updated_at
     WHERE free_generation_usage.used < ?
     RETURNING used`,
    [userId, FREE_PERIOD, kind, now, limit]
  );

  const row = d1Rows(res)[0];
  if (!row) {
    const usage = await getFreeGenerationUsage(userId, kind);
    return { ok: false, ...usage };
  }

  const used = Number(row.used ?? 0);
  return {
    ok: true,
    kind,
    period: FREE_PERIOD,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function refundFreeGeneration(userId, kind) {
  if (!userId || (kind !== "image" && kind !== "video")) return;
  await ensureFreeUsageTable();
  await queryD1(
    `UPDATE free_generation_usage
     SET used = CASE WHEN used > 0 THEN used - 1 ELSE 0 END,
         updated_at = ?
     WHERE user_id = ? AND period = ? AND kind = ?`,
    [Math.floor(Date.now() / 1000), userId, FREE_PERIOD, kind]
  );
}
