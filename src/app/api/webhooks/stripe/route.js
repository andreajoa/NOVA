import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { activatePlanSubscription, addApiCredits } from "@/lib/db";

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

    if (userId && session.customer && session.subscription) {
      let plan = (metadata.plan || "").toLowerCase();

      if (!plan || !["basic", "plus", "ultra", "business"].includes(plan)) {
        try {
          const subscription = await stripe.subscriptions.retrieve(String(session.subscription));
          const priceId = subscription.items.data[0]?.price?.id ?? "";
          plan = PRICE_TO_PLAN[priceId] ?? "basic";
        } catch {
          plan = "basic";
        }
      }

      const billing = metadata.billing || "monthly";

      await activatePlanSubscription({
        userId,
        plan,
        stripeCustomerId: String(session.customer),
        stripeSubscriptionId: String(session.subscription),
        billingInterval: billing,
      });

      console.log(`[stripe webhook] plan=${plan} billing=${billing} userId=${userId}`);
    }
  }

  return NextResponse.json({ received: true });
}
