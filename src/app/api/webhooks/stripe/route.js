import { NextResponse } from "next/server";
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
