import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_API_CREDITS_STARTER!,
  growth: process.env.STRIPE_PRICE_API_CREDITS_GROWTH!,
  pro: process.env.STRIPE_PRICE_API_CREDITS_PRO!,
  scale: process.env.STRIPE_PRICE_API_CREDITS_SCALE!,
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pack } = await req.json();
    const priceId = PRICE_MAP[pack];

    if (!priceId) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/api-keys?payment=success`,
      metadata: { userId, pack },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err: any) {
    console.error("Checkout session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
