import { d1Rows, queryD1 } from "@/lib/db";

const DEFAULT_POLICY = {
  trial: {
    imageDailyLimit: 10,
    videoDailyLimit: 3,
    maxVideoSeconds: 5,
  },
  paid: {
    imageDailyLimit: 10,
    videoDailyLimit: 10,
    maxVideoSeconds: 10,
  },
};

let ensureTablePromise = null;

function positiveIntFromEnv(name, fallback) {
  const raw = Number(process.env[name]);
  if (Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
  return fallback;
}

function isPaidPlan(plan) {
  const normalized = String(plan || "trial").toLowerCase();
  return !["trial", "free", "guest"].includes(normalized);
}

function utcPeriod(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function nextUtcReset(date = new Date()) {
  const next = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return next.toISOString();
}

export function getFreeGenerationPolicy(plan = "trial") {
  const paid = isPaidPlan(plan);
  const base = paid ? DEFAULT_POLICY.paid : DEFAULT_POLICY.trial;

  const imageDailyLimit = paid
    ? positiveIntFromEnv("NOVA_PAID_IMAGE_DAILY_LIMIT", base.imageDailyLimit)
    : positiveIntFromEnv("NOVA_FREE_IMAGE_DAILY_LIMIT", base.imageDailyLimit);

  const videoDailyLimit = paid
    ? positiveIntFromEnv("NOVA_PAID_VIDEO_DAILY_LIMIT", base.videoDailyLimit)
    : positiveIntFromEnv("NOVA_FREE_VIDEO_DAILY_LIMIT", base.videoDailyLimit);

  const maxVideoSeconds = paid
    ? positiveIntFromEnv("NOVA_PAID_FREE_VIDEO_MAX_SECONDS", base.maxVideoSeconds)
    : positiveIntFromEnv("NOVA_FREE_VIDEO_MAX_SECONDS", base.maxVideoSeconds);

  return {
    paid,
    plan: String(plan || "trial"),
    imageDailyLimit,
    videoDailyLimit,
    maxVideoSeconds: Math.max(5, Math.min(10, maxVideoSeconds || base.maxVideoSeconds)),
    videoDurations: paid && maxVideoSeconds >= 10 ? [5, 10] : [5],
    period: utcPeriod(),
    resetAt: nextUtcReset(),
  };
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

function limitFor(kind, plan) {
  const policy = getFreeGenerationPolicy(plan);
  return kind === "video" ? policy.videoDailyLimit : policy.imageDailyLimit;
}

export function getFreeGenerationLimit(kind, plan = "trial") {
  return limitFor(kind, plan);
}

export async function getFreeGenerationUsage(userId, kind, plan = "trial") {
  await ensureFreeUsageTable();
  const policy = getFreeGenerationPolicy(plan);
  const period = policy.period;
  const limit = limitFor(kind, plan);
  const res = await queryD1(
    `SELECT used FROM free_generation_usage WHERE user_id = ? AND period = ? AND kind = ? LIMIT 1`,
    [userId, period, kind]
  );
  const row = d1Rows(res)[0];
  const used = Number(row?.used ?? 0);
  return {
    kind,
    period,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: policy.resetAt,
    maxVideoSeconds: policy.maxVideoSeconds,
    videoDurations: policy.videoDurations,
  };
}

export async function checkAndDebitFreeGeneration(userId, kind, plan = "trial") {
  if (!userId) throw new Error("userId is required for free generation quota");
  if (kind !== "image" && kind !== "video") throw new Error(`Unsupported free quota kind: ${kind}`);

  await ensureFreeUsageTable();
  const policy = getFreeGenerationPolicy(plan);
  const period = policy.period;
  const limit = limitFor(kind, plan);

  if (limit <= 0) {
    return {
      ok: false,
      kind,
      period,
      used: 0,
      limit,
      remaining: 0,
      resetAt: policy.resetAt,
      maxVideoSeconds: policy.maxVideoSeconds,
      videoDurations: policy.videoDurations,
    };
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
    [userId, period, kind, now, limit]
  );

  const row = d1Rows(res)[0];
  if (!row) {
    const usage = await getFreeGenerationUsage(userId, kind, plan);
    return { ok: false, ...usage };
  }

  const used = Number(row.used ?? 0);
  return {
    ok: true,
    kind,
    period,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: policy.resetAt,
    maxVideoSeconds: policy.maxVideoSeconds,
    videoDurations: policy.videoDurations,
  };
}

export async function refundFreeGeneration(userId, kind) {
  if (!userId || (kind !== "image" && kind !== "video")) return;
  await ensureFreeUsageTable();
  const period = utcPeriod();
  await queryD1(
    `UPDATE free_generation_usage
     SET used = CASE WHEN used > 0 THEN used - 1 ELSE 0 END,
         updated_at = ?
     WHERE user_id = ? AND period = ? AND kind = ?`,
    [Math.floor(Date.now() / 1000), userId, period, kind]
  );
}
