import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { activateBasicSubscription, addApiCredits } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Invalid Stripe signature: ${error.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata || {};
    const userId = metadata.userId || session.client_reference_id;

    if (metadata.type === "api_credits") {
      const credits = Number(metadata.credits || 0);
      const pack = metadata.pack || "unknown";

      if (userId && credits > 0 && session.payment_status === "paid") {
        await addApiCredits({
          userId,
          amount: credits,
          pack,
          stripeSessionId: session.id,
        });
      }

      return NextResponse.json({ received: true, type: "api_credits" });
    }

    const billing = metadata.billing || "annual";

    if (userId && session.customer && session.subscription) {
      await activateBasicSubscription({
        userId,
        stripeCustomerId: String(session.customer),
        stripeSubscriptionId: String(session.subscription),
        billingInterval: billing,
      });
    }
  }

  return NextResponse.json({ received: true });
}
