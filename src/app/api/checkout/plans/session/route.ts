import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

const PRICE_MAP: Record<string, string> = {
  basic_monthly:    "price_1TTbBXPsIezuzlaECvxgoy59",
  basic_annual:     "price_1TTbElPsIezuzlaEdfyVUJw7",
  plus_monthly:     "price_1TTbORPsIezuzlaEwyo0LYhF",
  plus_annual:      "price_1TTbQHPsIezuzlaE7gXw5TEb",
  ultra_monthly:    "price_1TTbVuPsIezuzlaEiJP3ukGR",
  ultra_annual:     "price_1TTbbDPsIezuzlaESnMNcqne",
  business_monthly: "price_1TTbkxPsIezuzlaEysolpSAz",
  business_annual:  "price_1TTbirPsIezuzlaECJ38sSiO",
};

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, billing } = await req.json();
    const key = `${plan}_${billing}`;
    const priceId = PRICE_MAP[key];

    if (!priceId) {
      return NextResponse.json({ error: `Invalid plan: ${key}` }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
      metadata: { userId, plan, billing },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err: unknown) {
    console.error("Plan checkout error:", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
