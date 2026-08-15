import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { recordCheckoutAttempt } from "@/lib/crm/abandoned";

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

    // Gravar tentativa de checkout para abandoned checkout tracking.
    // Buscar email do user no D1 (o Stripe session ainda não tem customer_details).
    try {
      const { queryD1, d1Rows } = await import("@/lib/db");
      const userRes = await queryD1(
        "SELECT email FROM users WHERE id = ? OR clerk_id = ? LIMIT 1",
        [userId, userId]
      );
      const userRow = d1Rows(userRes)[0];
      const email = userRow?.email ? String(userRow.email) : "";
      if (email) {
        await recordCheckoutAttempt({
          email,
          userId,
          plan,
          billing,
          stripeSessionId: session.id,
        });
      }
    } catch {
      // Falha no tracking não pode bloquear o checkout
    }

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err: unknown) {
    console.error("Plan checkout error:", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
