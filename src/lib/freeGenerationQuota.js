import { d1Rows, queryD1 } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

const DEFAULT_POLICY = {
  trial: {
    imageDailyLimit: 10,
    videoMonthlyLimit: 10,
    maxVideoSeconds: 10,
  },
  paid: {
    imageDailyLimit: 10,
    videoMonthlyLimit: 20,
    maxVideoSeconds: 10,
  },
};

let ensureUsageTablePromise = null;
let ensureCycleTablePromise = null;

function positiveIntFromEnv(name, fallback) {
  const raw = Number(process.env[name]);
  if (Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
  return fallback;
}

function isPaidPlan(plan) {
  const normalized = String(plan || "trial").toLowerCase();
  return !["trial", "free", "guest"].includes(normalized);
}

function utcDayPeriod(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function nextUtcDayReset(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    0, 0, 0, 0
  )).toISOString();
}

function utcMonthPeriod(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function nextUtcMonthReset(date = new Date()) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    1,
    0, 0, 0, 0
  )).toISOString();
}

function subscriptionPeriod(subscription) {
  const item = subscription?.items?.data?.[0] || {};
  const start = Number(item.current_period_start || subscription?.current_period_start || 0);
  const end = Number(item.current_period_end || subscription?.current_period_end || 0);
  return { start, end, item };
}

function normalizedBillingInterval(value, item) {
  const raw = String(value || item?.price?.recurring?.interval || "monthly").toLowerCase();
  return raw === "year" || raw === "annual" ? "annual" : "monthly";
}

function addUtcMonthClamped(date) {
  const day = date.getUTCDate();
  const targetYear = date.getUTCFullYear();
  const targetMonth = date.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(
    targetYear,
    targetMonth,
    Math.min(day, lastDay),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    0
  ));
}

function paidMonthlyWindow(cycle, nowSeconds = Math.floor(Date.now() / 1000)) {
  const cycleStart = Number(cycle.period_start || 0);
  const cycleEnd = Number(cycle.period_end || 0);
  const subscriptionId = String(cycle.stripe_subscription_id || "subscription");
  const billing = String(cycle.billing_interval || "monthly").toLowerCase();

  if (!cycleStart || !cycleEnd || nowSeconds < cycleStart || nowSeconds >= cycleEnd) {
    return null;
  }

  if (billing !== "annual") {
    return {
      period: `paid:${subscriptionId}:${cycleStart}`,
      resetAt: new Date(cycleEnd * 1000).toISOString(),
    };
  }

  let windowStart = new Date(cycleStart * 1000);
  const hardEnd = new Date(cycleEnd * 1000);
  for (let i = 0; i < 12; i += 1) {
    let windowEnd = addUtcMonthClamped(windowStart);
    if (windowEnd > hardEnd) windowEnd = hardEnd;
    if (nowSeconds < Math.floor(windowEnd.getTime() / 1000)) {
      const startSeconds = Math.floor(windowStart.getTime() / 1000);
      return {
        period: `paid:${subscriptionId}:${startSeconds}`,
        resetAt: windowEnd.toISOString(),
      };
    }
    windowStart = windowEnd;
  }
  return null;
}

export function getFreeGenerationPolicy(plan = "trial") {
  const paid = isPaidPlan(plan);
  const base = paid ? DEFAULT_POLICY.paid : DEFAULT_POLICY.trial;

  const imageDailyLimit = paid
    ? positiveIntFromEnv("NOVA_PAID_IMAGE_DAILY_LIMIT", base.imageDailyLimit)
    : positiveIntFromEnv("NOVA_FREE_IMAGE_DAILY_LIMIT", base.imageDailyLimit);

  const videoMonthlyLimit = paid
    ? positiveIntFromEnv("NOVA_PAID_VIDEO_MONTHLY_LIMIT", base.videoMonthlyLimit)
    : positiveIntFromEnv("NOVA_FREE_VIDEO_MONTHLY_LIMIT", base.videoMonthlyLimit);

  const maxVideoSeconds = paid
    ? positiveIntFromEnv("NOVA_PAID_FREE_VIDEO_MAX_SECONDS", base.maxVideoSeconds)
    : positiveIntFromEnv("NOVA_FREE_VIDEO_MAX_SECONDS", base.maxVideoSeconds);

  const normalizedMaxVideoSeconds = Math.max(
    5,
    Math.min(10, maxVideoSeconds || base.maxVideoSeconds)
  );

  return {
    paid,
    plan: String(plan || "trial"),
    imageDailyLimit,
    videoMonthlyLimit,
    maxVideoSeconds: normalizedMaxVideoSeconds,
    videoDurations: normalizedMaxVideoSeconds >= 10 ? [5, 10] : [5],
    period: paid ? null : `free:${utcMonthPeriod()}`,
    resetAt: paid ? null : nextUtcMonthReset(),
  };
}

async function ensureUsageTable() {
  if (!ensureUsageTablePromise) {
    ensureUsageTablePromise = queryD1(`
      CREATE TABLE IF NOT EXISTS free_generation_usage (
        user_id TEXT NOT NULL,
        period TEXT NOT NULL,
        kind TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, period, kind)
      )
    `).catch((error) => {
      ensureUsageTablePromise = null;
      throw error;
    });
  }
  await ensureUsageTablePromise;
}

async function ensureCycleTable() {
  if (!ensureCycleTablePromise) {
    ensureCycleTablePromise = queryD1(`
      CREATE TABLE IF NOT EXISTS video_subscription_cycles (
        user_id TEXT PRIMARY KEY,
        stripe_subscription_id TEXT NOT NULL,
        stripe_invoice_id TEXT,
        billing_interval TEXT NOT NULL DEFAULT 'monthly',
        period_start INTEGER NOT NULL,
        period_end INTEGER NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        updated_at INTEGER NOT NULL
      )
    `).catch((error) => {
      ensureCycleTablePromise = null;
      throw error;
    });
  }
  await ensureCycleTablePromise;
}

export async function activatePaidVideoCycle({
  userId,
  stripeSubscriptionId,
  stripeInvoiceId = "",
  billingInterval = "monthly",
  periodStart,
  periodEnd,
}) {
  if (!userId || !stripeSubscriptionId) return null;
  const start = Number(periodStart || 0);
  const end = Number(periodEnd || 0);
  if (!start || !end || end <= start) return null;

  await ensureCycleTable();
  const now = Math.floor(Date.now() / 1000);
  await queryD1(
    `INSERT INTO video_subscription_cycles
      (user_id, stripe_subscription_id, stripe_invoice_id, billing_interval, period_start, period_end, active, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       stripe_subscription_id = excluded.stripe_subscription_id,
       stripe_invoice_id = excluded.stripe_invoice_id,
       billing_interval = excluded.billing_interval,
       period_start = excluded.period_start,
       period_end = excluded.period_end,
       active = 1,
       updated_at = excluded.updated_at`,
    [
      userId,
      stripeSubscriptionId,
      stripeInvoiceId || null,
      String(billingInterval || "monthly").toLowerCase(),
      start,
      end,
      now,
    ]
  );

  return {
    userId,
    stripeSubscriptionId,
    billingInterval,
    periodStart: start,
    periodEnd: end,
  };
}

export async function deactivatePaidVideoCycle({ userId = "", stripeSubscriptionId = "" } = {}) {
  if (!userId && !stripeSubscriptionId) return;
  await ensureCycleTable();
  const now = Math.floor(Date.now() / 1000);
  if (userId) {
    await queryD1(
      `UPDATE video_subscription_cycles SET active = 0, updated_at = ? WHERE user_id = ?`,
      [now, userId]
    );
    return;
  }
  await queryD1(
    `UPDATE video_subscription_cycles SET active = 0, updated_at = ? WHERE stripe_subscription_id = ?`,
    [now, stripeSubscriptionId]
  );
}

async function refreshPaidCycleFromStripe(userId) {
  const accountRes = await queryD1(
    `SELECT id, clerk_id, stripe_subscription_id, billing_interval, subscription_status
     FROM users WHERE id = ? OR clerk_id = ? LIMIT 1`,
    [userId, userId]
  );
  const account = d1Rows(accountRes)[0];
  const subscriptionId = String(account?.stripe_subscription_id || "");
  if (!subscriptionId) return null;

  try {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice"],
    });
    const { start, end, item } = subscriptionPeriod(subscription);
    const billingInterval = normalizedBillingInterval(account?.billing_interval, item);
    const latestInvoiceStatus = typeof subscription.latest_invoice === "object"
      ? String(subscription.latest_invoice?.status || "")
      : "";
    const active = subscription?.status === "active" && latestInvoiceStatus === "paid";

    await queryD1(
      `UPDATE users SET subscription_status = ? WHERE id = ? OR clerk_id = ?`,
      [String(subscription?.status || "inactive"), userId, userId]
    ).catch(() => {});

    if (!active || !start || !end) {
      await deactivatePaidVideoCycle({ userId }).catch(() => {});
      return null;
    }

    const latestInvoice = typeof subscription.latest_invoice === "string"
      ? subscription.latest_invoice
      : String(subscription.latest_invoice?.id || "");

    await activatePaidVideoCycle({
      userId,
      stripeSubscriptionId: subscriptionId,
      stripeInvoiceId: latestInvoice,
      billingInterval,
      periodStart: start,
      periodEnd: end,
    });

    return {
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      billing_interval: billingInterval,
      period_start: start,
      period_end: end,
      active: 1,
    };
  } catch (error) {
    console.error("[NOVA_VIDEO_QUOTA] Stripe subscription refresh failed", {
      userId,
      message: error?.message || String(error),
    });
    return null;
  }
}

async function paidVideoCycle(userId) {
  await ensureCycleTable();
  const now = Math.floor(Date.now() / 1000);
  const res = await queryD1(
    `SELECT user_id, stripe_subscription_id, stripe_invoice_id, billing_interval,
            period_start, period_end, active, updated_at
     FROM video_subscription_cycles WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  let cycle = d1Rows(res)[0] || null;

  if (!cycle || Number(cycle.active || 0) !== 1 || now >= Number(cycle.period_end || 0)) {
    cycle = await refreshPaidCycleFromStripe(userId);
  }

  if (!cycle || Number(cycle.active || 0) !== 1) return null;
  return cycle;
}

async function periodContext(userId, kind, policy) {
  if (kind === "image") {
    return {
      active: true,
      period: utcDayPeriod(),
      resetAt: nextUtcDayReset(),
    };
  }

  if (!policy.paid) {
    return {
      active: true,
      period: `free:${utcMonthPeriod()}`,
      resetAt: nextUtcMonthReset(),
    };
  }

  const cycle = await paidVideoCycle(userId);
  const window = cycle ? paidMonthlyWindow(cycle) : null;
  if (!window) {
    return {
      active: false,
      reason: "subscription_payment_required",
      period: "paid:inactive",
      resetAt: null,
    };
  }

  return { active: true, ...window };
}

function limitFor(kind, plan) {
  const policy = getFreeGenerationPolicy(plan);
  return kind === "video" ? policy.videoMonthlyLimit : policy.imageDailyLimit;
}

export function getFreeGenerationLimit(kind, plan = "trial") {
  return limitFor(kind, plan);
}

export async function getFreeGenerationUsage(userId, kind, plan = "trial") {
  await ensureUsageTable();
  const policy = getFreeGenerationPolicy(plan);
  const context = await periodContext(userId, kind, policy);
  const limit = limitFor(kind, plan);

  if (!context.active) {
    return {
      kind,
      period: context.period,
      used: 0,
      limit,
      remaining: 0,
      resetAt: context.resetAt,
      active: false,
      reason: context.reason,
      maxVideoSeconds: policy.maxVideoSeconds,
      videoDurations: policy.videoDurations,
    };
  }

  const res = await queryD1(
    `SELECT used FROM free_generation_usage WHERE user_id = ? AND period = ? AND kind = ? LIMIT 1`,
    [userId, context.period, kind]
  );
  const row = d1Rows(res)[0];
  const used = Number(row?.used ?? 0);
  return {
    kind,
    period: context.period,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: context.resetAt,
    active: true,
    maxVideoSeconds: policy.maxVideoSeconds,
    videoDurations: policy.videoDurations,
  };
}

export async function checkAndDebitFreeGeneration(userId, kind, plan = "trial") {
  if (!userId) throw new Error("userId is required for free generation quota");
  if (kind !== "image" && kind !== "video") throw new Error(`Unsupported free quota kind: ${kind}`);

  await ensureUsageTable();
  const policy = getFreeGenerationPolicy(plan);
  const context = await periodContext(userId, kind, policy);
  const limit = limitFor(kind, plan);

  if (!context.active || limit <= 0) {
    return {
      ok: false,
      kind,
      period: context.period,
      used: 0,
      limit,
      remaining: 0,
      resetAt: context.resetAt,
      active: false,
      reason: context.reason || "limit_reached",
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
    [userId, context.period, kind, now, limit]
  );

  const row = d1Rows(res)[0];
  if (!row) {
    const usage = await getFreeGenerationUsage(userId, kind, plan);
    return { ok: false, reason: "limit_reached", ...usage };
  }

  const used = Number(row.used ?? 0);
  return {
    ok: true,
    kind,
    period: context.period,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: context.resetAt,
    active: true,
    maxVideoSeconds: policy.maxVideoSeconds,
    videoDurations: policy.videoDurations,
  };
}

export async function refundFreeGeneration(userId, kind) {
  if (!userId || (kind !== "image" && kind !== "video")) return;
  await ensureUsageTable();
  const latest = await queryD1(
    `SELECT period FROM free_generation_usage
     WHERE user_id = ? AND kind = ?
     ORDER BY updated_at DESC LIMIT 1`,
    [userId, kind]
  );
  const period = String(d1Rows(latest)[0]?.period || "");
  if (!period) return;

  await queryD1(
    `UPDATE free_generation_usage
     SET used = CASE WHEN used > 0 THEN used - 1 ELSE 0 END,
         updated_at = ?
     WHERE user_id = ? AND period = ? AND kind = ?`,
    [Math.floor(Date.now() / 1000), userId, period, kind]
  );
}
