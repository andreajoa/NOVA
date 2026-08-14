import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { recordEvent, setContactStatus } from "@/lib/crm/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de eventos da Resend (entrega, abertura, clique, bounce, reclamação).
 *
 * Bounce e reclamação entram na supressão na hora. Isso não é opcional:
 * continuar mandando para endereço que deu hard bounce, ou para quem clicou
 * em "isto é spam", é o caminho mais rápido para o domínio ser bloqueado.
 *
 * A Resend assina com Svix, igual ao Clerk — a mesma lib já está no projeto.
 */
export async function POST(request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const payload = await request.text();

  let event;

  if (secret) {
    const h = await headers();
    const svixId = h.get("svix-id");
    const svixTimestamp = h.get("svix-timestamp");
    const svixSignature = h.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
    }

    try {
      event = new Webhook(secret).verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    // Sem segredo configurado o endpoint aceita o payload mas registra o aviso.
    // Configure RESEND_WEBHOOK_SECRET antes de expor isto em produção.
    console.warn("[crm] RESEND_WEBHOOK_SECRET ausente — webhook sem verificação de assinatura");
    try {
      event = JSON.parse(payload);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  const type = String(event?.type || "");
  const data = event?.data || {};
  const to = Array.isArray(data.to) ? data.to[0] : data.to;
  const email = String(to || data.email || "");
  const resendId = String(data.email_id || data.id || "");

  if (!email) {
    return NextResponse.json({ ok: true, ignored: "no_recipient" });
  }

  try {
    await recordEvent({ email, type, resendId, payload: data });

    if (type === "email.bounced") {
      // Soft bounce (caixa cheia, indisponível) não deve suprimir para sempre.
      const bounceType = String(data?.bounce?.type || data?.type || "").toLowerCase();
      if (bounceType.includes("soft") || bounceType.includes("transient")) {
        return NextResponse.json({ ok: true, handled: "soft_bounce_ignored" });
      }
      await setContactStatus(email, "bounced", "hard_bounce");
    }

    if (type === "email.complained") {
      await setContactStatus(email, "complained", "spam_complaint");
    }

    return NextResponse.json({ ok: true, type });
  } catch (error) {
    console.error("[crm] resend webhook failed:", error);
    return NextResponse.json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}
