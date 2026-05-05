import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PACKS = {
  starter: {
    label: "API Credits Starter",
    credits: 140,
    priceId: process.env.STRIPE_PRICE_API_CREDITS_STARTER,
  },
  growth: {
    label: "API Credits Growth",
    credits: 375,
    priceId: process.env.STRIPE_PRICE_API_CREDITS_GROWTH,
  },
  pro: {
    label: "API Credits Pro",
    credits: 800,
    priceId: process.env.STRIPE_PRICE_API_CREDITS_PRO,
  },
  scale: {
    label: "API Credits Scale",
    credits: 1750,
    priceId: process.env.STRIPE_PRICE_API_CREDITS_SCALE,
  },
};

async function createApiCreditsCheckout(request) {
  const stripe = getStripe();
  const { userId } = await auth();

  if (!userId) {
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  const url = new URL(request.url);
  const packKey = url.searchParams.get("pack") || "starter";
  const pack = PACKS[packKey];

  if (!pack) {
    return NextResponse.json({ error: "Invalid API credits pack" }, { status: 400 });
  }

  if (!pack.priceId) {
    return NextResponse.json({ error: `Missing Stripe price for API credits pack: ${packKey}` }, { status: 500 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || undefined;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || url.origin).replace(/\/$/, "");

  const session = await stripe.checkout.sessions.create({
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
    },
    success_url: `${appUrl}/dashboard/settings/api-keys?api_credits=success`,
    cancel_url: `${appUrl}/dashboard/settings/api-keys?api_credits=cancelled`,
  });

  return NextResponse.redirect(session.url);
}

export async function GET(request) {
  return createApiCreditsCheckout(request);
}

export async function POST(request) {
  return createApiCreditsCheckout(request);
}
