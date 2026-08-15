import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { activatePlanSubscription, addApiCredits } from "@/lib/db";
import { markContactAsCustomer } from "@/lib/crm/db";
import {
  markCheckoutConverted,
  activateAbandoned,
  sendAbandonedEmail,
} from "@/lib/crm/abandoned";

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

      // CRM: quem assinou sai da sequência de venda na hora. Continuar
      // mandando "assine a NOVA" para quem acabou de assinar é a forma mais
      // rápida de ganhar uma reclamação de spam de um cliente pagante.
      try {
        await markContactAsCustomer(userId, plan);
        if (session.customer_details?.email) {
          await markContactAsCustomer(session.customer_details.email, plan);
        }
      } catch (error) {
        console.error("[crm] failed to exit converted contact:", error);
      }

      // Abandoned checkout: marcar como convertido (para qualquer sequência ativa)
      try {
        await markCheckoutConverted({
          stripeSessionId: session.id,
          email: session.customer_details?.email || "",
          userId,
        });
      } catch (error) {
        console.error("[abandoned] failed to mark converted:", error);
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;

    if (subscriptionId && customerId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(String(subscriptionId));
        const priceId = subscription.items.data[0]?.price?.id ?? "";
        const plan = PRICE_TO_PLAN[priceId] ?? "basic";

        // Find user by stripe customer id
        const { queryD1, d1Rows, PLAN_CONFIG } = await import("@/lib/db");
        const res = await queryD1(
          "SELECT id, clerk_id FROM users WHERE stripe_customer_id = ? LIMIT 1",
          [customerId]
        );
        const rows = d1Rows(res);
        const user = rows[0];

        if (user) {
          const userId = String(user.clerk_id || user.id);
          const credits = PLAN_CONFIG[plan]?.credits ?? 70;
          await queryD1(
            `UPDATE users SET credits = ?, image_gens_used = 0 WHERE id = ? OR clerk_id = ?`,
            [credits, userId, userId]
          );
          console.log(`[stripe webhook] monthly renewal plan=${plan} userId=${userId} credits=${credits}`);
        }
      } catch (err) {
        console.error("[stripe webhook] renewal error:", err);
      }
    }
  }

  // ── Abandoned checkout: checkout expirou sem pagar ───────────────────────
  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const metadata = session.metadata || {};

    // Só interessa para checkouts de plano (não API credits)
    if (metadata.type !== "api_credits" && metadata.userId) {
      try {
        const { queryD1, d1Rows: d1R } = await import("@/lib/db");
        const email = session.customer_details?.email || "";

        // Se não temos email pelo Stripe, buscar no D1
        let contactEmail = email;
        if (!contactEmail) {
          const userRes = await queryD1(
            "SELECT email FROM users WHERE id = ? OR clerk_id = ? LIMIT 1",
            [metadata.userId, metadata.userId]
          );
          const userRow = d1R(userRes)[0];
          contactEmail = userRow?.email ? String(userRow.email) : "";
        }

        if (contactEmail) {
          // Importar e gravar a tentativa (caso não tenha sido gravada no checkout)
          const { recordCheckoutAttempt } = await import("@/lib/crm/abandoned");
          const newId = await recordCheckoutAttempt({
            email: contactEmail,
            userId: metadata.userId,
            plan: metadata.plan || "basic",
            billing: metadata.billing || "monthly",
            stripeSessionId: session.id,
          });

          // Se foi criado agora (ou já existia como pendente), ativar e enviar email 0
          const { ensureCrmTables } = await import("@/lib/crm/db");
          await ensureCrmTables();

          // Buscar o registro pendente para esse email
          const pendingRes = await queryD1(
            `SELECT id FROM crm_abandoned
             WHERE email = ? AND status = 'pending' LIMIT 1`,
            [contactEmail.toLowerCase()]
          );
          const pending = d1R(pendingRes)[0];
          const recordId = pending ? String(pending.id) : newId;

          if (recordId) {
            const activated = await activateAbandoned(recordId);
            if (activated) {
              // Enviar email 0 imediatamente (não esperar o cron)
              await sendAbandonedEmail(activated);
              console.log(`[abandoned] email 0 sent to ${contactEmail} (plan=${metadata.plan})`);
            }
          }
        }
      } catch (error) {
        console.error("[abandoned] expired handler error:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
