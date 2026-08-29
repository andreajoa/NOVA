import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

const PRICE_MAP: Record<string, string> = {
  basic: "price_1TTbBXPsIezuzlaECvxgoy59",
  plus: "price_1TTbORPsIezuzlaEwyo0LYhF",
  ultra: "price_1TTbVuPsIezuzlaEiJP3ukGR",
  business: "price_1TTbkxPsIezuzlaEysolpSAz",
};

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const plan = String(body?.plan || "").toLowerCase();
    const billing = "monthly";
    const priceId = PRICE_MAP[plan];

    if (!priceId) {
      return NextResponse.json({ error: `Invalid plan: ${plan}` }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      client_reference_id: userId,
      subscription_data: { metadata: { userId, plan, billing } },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
      metadata: { userId, plan, billing },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected checkout error";
    console.error("Plan checkout error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
