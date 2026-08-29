from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Expected block not found in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


FREE_QUOTA = r'''import { d1Rows, queryD1 } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

const DEFAULT_POLICY = {
  trial: {
    imageDailyLimit: 10,
    videoMonthlyLimit: 10,
    maxVideoSeconds: 5,
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
    videoDurations: paid && normalizedMaxVideoSeconds >= 10 ? [5, 10] : [5],
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
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const { start, end, item } = subscriptionPeriod(subscription);
    const billingInterval = normalizedBillingInterval(account?.billing_interval, item);
    const active = subscription?.status === "active";

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
'''

WEBHOOK = r'''import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { activatePlanSubscription, addApiCredits, d1Rows, PLAN_CONFIG, queryD1 } from "@/lib/db";
import { activatePaidVideoCycle, deactivatePaidVideoCycle } from "@/lib/freeGenerationQuota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRICE_TO_PLAN = {
  "price_1TTbBXPsIezuzlaECvxgoy59": "basic",
  "price_1TTbElPsIezuzlaEdfyVUJw7": "basic",
  "price_1TTbORPsIezuzlaEwyo0LYhF": "plus",
  "price_1TTbQHPsIezuzlaE7gXw5TEb": "plus",
  "price_1TTbVuPsIezuzlaEiJP3ukGR": "ultra",
  "price_1TTbbDPsIezuzlaESnMNcqne": "ultra",
  "price_1TTbkxPsIezuzlaEysolpSAz": "business",
  "price_1TTbirPsIezuzlaECJ38sSiO": "business",
};

function invoiceSubscriptionId(invoice) {
  return String(
    invoice?.subscription ||
    invoice?.parent?.subscription_details?.subscription ||
    ""
  );
}

function subscriptionDetails(subscription, fallbackBilling = "monthly") {
  const item = subscription?.items?.data?.[0] || {};
  const priceId = String(item?.price?.id || "");
  const interval = String(item?.price?.recurring?.interval || fallbackBilling || "month").toLowerCase();
  const billingInterval = interval === "year" || interval === "annual" ? "annual" : "monthly";
  const periodStart = Number(item.current_period_start || subscription?.current_period_start || 0);
  const periodEnd = Number(item.current_period_end || subscription?.current_period_end || 0);
  const plan = PRICE_TO_PLAN[priceId] || "basic";
  return { item, priceId, plan, billingInterval, periodStart, periodEnd };
}

async function findUserByStripe({ customerId = "", subscriptionId = "" }) {
  if (subscriptionId) {
    const bySubscription = await queryD1(
      `SELECT id, clerk_id, plan, stripe_customer_id, stripe_subscription_id, billing_interval
       FROM users WHERE stripe_subscription_id = ? LIMIT 1`,
      [subscriptionId]
    );
    const row = d1Rows(bySubscription)[0];
    if (row) return row;
  }

  if (customerId) {
    const byCustomer = await queryD1(
      `SELECT id, clerk_id, plan, stripe_customer_id, stripe_subscription_id, billing_interval
       FROM users WHERE stripe_customer_id = ? LIMIT 1`,
      [customerId]
    );
    return d1Rows(byCustomer)[0] || null;
  }

  return null;
}

async function activateCycleForSubscription({ userId, subscription, invoiceId = "", fallbackBilling = "monthly" }) {
  const details = subscriptionDetails(subscription, fallbackBilling);
  if (subscription?.status !== "active" || !details.periodStart || !details.periodEnd) return false;

  await activatePaidVideoCycle({
    userId,
    stripeSubscriptionId: String(subscription.id),
    stripeInvoiceId: invoiceId,
    billingInterval: details.billingInterval,
    periodStart: details.periodStart,
    periodEnd: details.periodEnd,
  });
  return true;
}

export async function POST(request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json({ error: `Invalid Stripe signature: ${error.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata || {};
    const userId = metadata.userId || session.client_reference_id;

    if (metadata.type === "api_credits") {
      const credits = Number(metadata.credits || 0);
      const pack = metadata.pack || "unknown";
      if (userId && credits > 0 && session.payment_status === "paid") {
        await addApiCredits({ userId, amount: credits, pack, stripeSessionId: session.id });
      }
      return NextResponse.json({ received: true, type: "api_credits" });
    }

    if (userId && session.customer && session.subscription && session.payment_status === "paid") {
      try {
        const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
        const details = subscriptionDetails(subscription, metadata.billing || "monthly");
        const requestedPlan = String(metadata.plan || "").toLowerCase();
        const plan = ["basic", "plus", "ultra", "business"].includes(requestedPlan)
          ? requestedPlan
          : details.plan;
        const billing = metadata.billing || details.billingInterval;

        await activatePlanSubscription({
          userId,
          plan,
          stripeCustomerId: String(session.customer),
          stripeSubscriptionId: String(session.subscription),
          billingInterval: billing,
        });

        await activateCycleForSubscription({
          userId,
          subscription,
          invoiceId: typeof subscription.latest_invoice === "string"
            ? subscription.latest_invoice
            : String(subscription.latest_invoice?.id || ""),
          fallbackBilling: billing,
        });

        console.log(`[stripe webhook] initial paid subscription plan=${plan} billing=${billing} userId=${userId}`);
      } catch (err) {
        console.error("[stripe webhook] checkout activation error:", err);
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    const subscriptionId = invoiceSubscriptionId(invoice);
    const customerId = String(invoice.customer || "");

    if (subscriptionId && customerId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const details = subscriptionDetails(subscription);
        const user = await findUserByStripe({ customerId, subscriptionId });

        if (user) {
          const userId = String(user.clerk_id || user.id);
          const credits = PLAN_CONFIG[details.plan]?.credits ?? 70;

          await activatePlanSubscription({
            userId,
            plan: details.plan,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            billingInterval: details.billingInterval,
          });

          await queryD1(
            `UPDATE users SET credits = ?, image_gens_used = 0, subscription_status = 'active'
             WHERE id = ? OR clerk_id = ?`,
            [credits, userId, userId]
          );

          await activateCycleForSubscription({
            userId,
            subscription,
            invoiceId: String(invoice.id || ""),
            fallbackBilling: details.billingInterval,
          });

          console.log(`[stripe webhook] renewal paid plan=${details.plan} userId=${userId} videoQuota=20`);
        }
      } catch (err) {
        console.error("[stripe webhook] renewal error:", err);
      }
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const subscriptionId = invoiceSubscriptionId(invoice);
    const customerId = String(invoice.customer || "");
    const user = await findUserByStripe({ customerId, subscriptionId });
    if (user) {
      const userId = String(user.clerk_id || user.id);
      await queryD1(
        `UPDATE users SET subscription_status = 'past_due' WHERE id = ? OR clerk_id = ?`,
        [userId, userId]
      );
      await deactivatePaidVideoCycle({ userId });
      console.log(`[stripe webhook] renewal payment failed userId=${userId}; paid video quota locked`);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const subscriptionId = String(subscription.id || "");
    const customerId = String(subscription.customer || "");
    const user = await findUserByStripe({ customerId, subscriptionId });
    if (user) {
      const userId = String(user.clerk_id || user.id);
      await queryD1(
        `UPDATE users
         SET plan = 'trial', credits = 10, image_gens_used = 0, subscription_status = 'canceled'
         WHERE id = ? OR clerk_id = ?`,
        [userId, userId]
      );
      await deactivatePaidVideoCycle({ userId });
      console.log(`[stripe webhook] subscription canceled userId=${userId}; returned to free plan`);
    }
  }

  return NextResponse.json({ received: true });
}
'''

Path("src/lib/freeGenerationQuota.js").write_text(FREE_QUOTA, encoding="utf-8")
Path("src/app/api/webhooks/stripe/route.js").write_text(WEBHOOK, encoding="utf-8")

replace_once(
    "src/app/api/checkout/plans/session/route.ts",
    '      mode: "subscription",\n      return_url:',
    '      mode: "subscription",\n      client_reference_id: userId,\n      subscription_data: { metadata: { userId, plan, billing } },\n      return_url:',
)

replace_once(
    "src/app/api/free-video-generate/route.js",
    "  // ADMIN never enters a NOVA daily quota/capacity gate. External free GPU\n",
    "  // ADMIN never enters a NOVA monthly quota/capacity gate. External free GPU\n",
)

old_quota = '''  let quota = null;\n  if (!admin) {\n    quota = await checkAndDebitFreeGeneration(userId, "video", account.plan);\n    if (!quota.ok) {\n      if (capacity?.ok) await refundVideoCapacity(capacity.units).catch(() => {});\n      return NextResponse.json(\n        {\n          success: false,\n          code: "FREE_MODEL_DAILY_LIMIT_REACHED",\n          message: `Você atingiu o limite de ${quota.limit} vídeos incluídos hoje.`,\n          used: quota.used,\n          limit: quota.limit,\n          remaining: quota.remaining,\n          resetAt: quota.resetAt,\n        },\n        { status: 402 }\n      );\n    }\n  }\n'''
new_quota = '''  let quota = null;\n  if (!admin) {\n    quota = await checkAndDebitFreeGeneration(userId, "video", account.plan);\n    if (!quota.ok) {\n      if (capacity?.ok) await refundVideoCapacity(capacity.units).catch(() => {});\n\n      if (quota.reason === "subscription_payment_required") {\n        return NextResponse.json(\n          {\n            success: false,\n            code: "NOVA_SUBSCRIPTION_PAYMENT_REQUIRED",\n            message: "Sua assinatura precisa estar ativa e com o pagamento aprovado para liberar os 20 vídeos do novo ciclo.",\n            used: quota.used,\n            limit: quota.limit,\n            remaining: 0,\n            resetAt: quota.resetAt,\n            paymentRequired: true,\n            upgradeUrl: "/pricing",\n          },\n          { status: 402 }\n        );\n      }\n\n      const freeAccount = !policy.paid;\n      return NextResponse.json(\n        {\n          success: false,\n          code: freeAccount ? "NOVA_FREE_VIDEO_MONTHLY_LIMIT_REACHED" : "NOVA_VIDEO_MONTHLY_LIMIT_REACHED",\n          message: freeAccount\n            ? `Você usou seus ${quota.limit} vídeos gratuitos deste mês. Assine o NOVA para liberar 20 vídeos por mês.`\n            : `Você usou os ${quota.limit} vídeos incluídos neste ciclo mensal. O limite será renovado no próximo ciclo da sua assinatura.`,\n          used: quota.used,\n          limit: quota.limit,\n          remaining: quota.remaining,\n          resetAt: quota.resetAt,\n          upgradeRequired: freeAccount,\n          upgradeUrl: freeAccount ? "/pricing" : null,\n        },\n        { status: 402 }\n      );\n    }\n  }\n'''
replace_once("src/app/api/free-video-generate/route.js", old_quota, new_quota)

replace_once(
    "src/app/api/free-usage/route.js",
    "    resetAt: policy.resetAt,\n",
    "    resetAt: video.resetAt,\n",
)
replace_once(
    "src/app/api/free-usage/route.js",
    "      available: videoAvailable,\n      speechAvailable,\n      capabilities: videoCapabilities,\n",
    "      available: videoAvailable,\n      active: video.active !== false,\n      paymentRequired: video.reason === \"subscription_payment_required\",\n      speechAvailable,\n      capabilities: videoCapabilities,\n",
)

studio = Path("src/components/NovaFreeVideoStudio.jsx")
text = studio.read_text(encoding="utf-8")
text = text.replace(
    '  const [showHfConnect, setShowHfConnect] = useState(false);\n',
    '  const [showHfConnect, setShowHfConnect] = useState(false);\n  const [showUpgradePopup, setShowUpgradePopup] = useState(false);\n',
    1,
)
text = text.replace(
    '  const unlimited = Boolean(usage?.admin || videoUsage?.unlimited);\n  const exhausted = !unlimited && Number(videoUsage?.remaining ?? 1) <= 0;\n',
    '  const unlimited = Boolean(usage?.admin || videoUsage?.unlimited);\n  const paidUser = Boolean(usage?.paid);\n  const exhausted = !unlimited && Number(videoUsage?.remaining ?? 1) <= 0;\n\n  useEffect(() => {\n    if (usage && exhausted && !paidUser) setShowUpgradePopup(true);\n  }, [usage, exhausted, paidUser]);\n',
    1,
)
text = text.replace(
    '    if (exhausted) {\n      setError("Seu limite diário de NOVA VIDEO foi utilizado.");\n      return;\n    }\n',
    '    if (exhausted) {\n      if (!paidUser) setShowUpgradePopup(true);\n      setError(\n        paidUser\n          ? "Você usou os 20 vídeos incluídos neste ciclo mensal."\n          : "Você usou seus 10 vídeos gratuitos deste mês."\n      );\n      return;\n    }\n',
    1,
)
text = text.replace(
    '      if (!response.ok || !payload?.success || !payload?.jobId) {\n        if (response.status === 402) await refreshUsage();\n',
    '      if (!response.ok || !payload?.success || !payload?.jobId) {\n        if (response.status === 402) await refreshUsage();\n        if (payload?.upgradeRequired) setShowUpgradePopup(true);\n',
    1,
)
text = text.replace(
    '${videoUsage?.remaining ?? "—"} / ${videoUsage?.limit ?? "—"} hoje',
    '${videoUsage?.remaining ?? "—"} / ${videoUsage?.limit ?? "—"} este mês',
    1,
)
text = text.replace(
    'respeitando o limite diário da sua conta.',
    'respeitando o limite mensal da sua conta.',
    1,
)

popup = '''\n        {showUpgradePopup && !paidUser && !unlimited && (\n          <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">\n            <div className="w-full max-w-md rounded-[2rem] border border-[#D7FF00]/35 bg-[#080a08] p-7 text-center shadow-[0_0_80px_rgba(215,255,0,.16)]">\n              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#D7FF00] text-2xl font-black text-black">✦</div>\n              <h2 className="mt-5 text-2xl font-black text-white">Seus vídeos grátis do mês acabaram</h2>\n              <p className="mt-3 text-sm leading-6 text-white/60">\n                Você usou os 10 vídeos gratuitos deste mês. Assine um plano NOVA e libere 20 vídeos por mês.\n              </p>\n              <Link\n                href="/pricing"\n                className="mt-6 grid h-12 w-full place-items-center rounded-xl bg-[#D7FF00] text-xs font-black uppercase tracking-[0.14em] text-black no-underline"\n              >\n                Ver planos e assinar\n              </Link>\n              <button\n                type="button"\n                onClick={() => setShowUpgradePopup(false)}\n                className="mt-3 text-xs font-bold text-white/40 hover:text-white/70"\n              >\n                Agora não\n              </button>\n              <p className="mt-4 text-[11px] leading-5 text-white/35">Se você não assinar, seus 10 vídeos gratuitos voltam no próximo mês.</p>\n            </div>\n          </div>\n        )}\n'''
needle = '      </div>\n    </main>\n  );\n}\n'
if needle not in text:
    raise SystemExit("Could not find NovaFreeVideoStudio closing block")
text = text.replace(needle, f'      </div>{popup}    </main>\n  );\n}}\n', 1)
studio.write_text(text, encoding="utf-8")

print("Monthly NOVA video quota patch applied")
