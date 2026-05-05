import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PACKS = {
  starter: {
    label: "API Credits Starter",
    credits: 140,
    price: "$10",
    priceId: process.env.STRIPE_PRICE_API_CREDITS_STARTER,
  },
  growth: {
    label: "API Credits Growth",
    credits: 375,
    price: "$25",
    priceId: process.env.STRIPE_PRICE_API_CREDITS_GROWTH,
  },
  pro: {
    label: "API Credits Pro",
    credits: 800,
    price: "$50",
    priceId: process.env.STRIPE_PRICE_API_CREDITS_PRO,
  },
  scale: {
    label: "API Credits Scale",
    credits: 1750,
    price: "$100",
    priceId: process.env.STRIPE_PRICE_API_CREDITS_SCALE,
  },
};

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const packKey = String(body.pack || "starter").toLowerCase();
    const pack = PACKS[packKey];

    if (!pack) {
      return NextResponse.json({ error: "Invalid API credits pack" }, { status: 400 });
    }

    if (!pack.priceId) {
      return NextResponse.json(
        { error: `Missing Stripe price for API credits pack: ${packKey}` },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress || undefined;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      customer_email: email,
      client_reference_id: userId,
      line_items: [
        {
          price: pack.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        type: "api_credits",
        userId,
        pack: packKey,
        credits: String(pack.credits),
        source: "embedded_checkout",
      },
      return_url: `${appUrl}/checkout/api-credits/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      pack: {
        key: packKey,
        label: pack.label,
        credits: pack.credits,
        price: pack.price,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to create embedded checkout session" },
      { status: 500 }
    );
  }
}
