import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireCrmAdmin } from "@/lib/crm/guard";
import { getStep } from "@/lib/crm/sequence";
import { renderStepEmail } from "@/lib/crm/render";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/admin/crm/test-email
 * Envia um e-mail de preview da sequência para um endereço qualquer.
 *
 * Body: { email, step?: number, locale?: "en"|"pt" }
 *
 * Também aceita auth via ?secret=CRON_SECRET para chamadas externas.
 */
export async function POST(req) {
  // Auth: admin session OR cron secret
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const cronOk =
    secret && process.env.CRON_SECRET && secret === process.env.CRON_SECRET;

  if (!cronOk) {
    const guard = await requireCrmAdmin();
    if (!guard.ok) return guard.response;
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const stepNumber = Number(body.step ?? 1);
  const locale = String(body.locale || "pt");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
  }

  const step = getStep(stepNumber);
  if (!step) {
    return NextResponse.json(
      { error: `Step ${stepNumber} não existe (0-59)` },
      { status: 400 }
    );
  }

  const mockContact = {
    locale,
    firstName: "Andre",
    unsubToken: "test-preview-token",
  };

  const rendered = renderStepEmail({ step, contact: mockContact });

  const fromEmail =
    process.env.CRM_FROM_EMAIL || "NOVA AI Studio <noreply@novvideos.online>";
  const replyTo = process.env.CRM_REPLY_TO || "novavideoai@proton.me";

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      replyTo,
      to: email,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
      headers: {
        "List-Unsubscribe": `<${rendered.unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    return NextResponse.json({
      ok: true,
      step: stepNumber,
      stepId: step.id,
      subject: rendered.subject,
      locale: rendered.locale,
      ask: rendered.ask,
      resendId: result.data?.id || null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Falha ao enviar", detail: err.message },
      { status: 500 }
    );
  }
}
