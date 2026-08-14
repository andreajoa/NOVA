import { Resend } from "resend";
import {
  dueEnrollments,
  advanceEnrollment,
  pauseEnrollment,
  logEmail,
  getSetting,
  isSuppressed,
  serializeContact,
} from "@/lib/crm/db";
import { getStep, nextStepAfter, TOTAL_STEPS, SEQUENCE_ID } from "@/lib/crm/sequence";
import { renderStepEmail, unsubscribeUrl } from "@/lib/crm/render";

const FROM = process.env.CRM_FROM_EMAIL || "NOVA AI Studio <noreply@novvideos.online>";
const REPLY_TO = process.env.CRM_REPLY_TO || "novavideoai@proton.me";

// Resend limita requisições por segundo. 550ms entre envios mantém margem
// confortável e não estoura o tempo da função em lotes normais.
const SEND_INTERVAL_MS = 550;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Um ciclo de disparo. Chamado pelo cron a cada hora.
 *
 * Regras de proteção, nesta ordem:
 *   1. kill switch global (crm_paused)
 *   2. limite de envios por ciclo
 *   3. supressão (bounce, reclamação, unsubscribe) — checada de novo na hora do envio
 *   4. freio por engajamento — pausa quem não abre há N e-mails
 */
export async function runDispatch({ limit = 60, dryRun = false } = {}) {
  const paused = (await getSetting("crm_paused", "0")) === "1";
  if (paused) {
    return { ok: true, paused: true, sent: 0, skipped: 0, failed: 0, results: [] };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey && !dryRun) {
    return { ok: false, error: "RESEND_API_KEY_MISSING", sent: 0, skipped: 0, failed: 0, results: [] };
  }

  const cadenceDays = Number(await getSetting("crm_cadence_days", "0")) || null;
  const maxNoOpen = Number(await getSetting("crm_max_no_open_streak", "10")) || 10;
  const perRun = Math.min(Number(await getSetting("crm_max_per_run", String(limit))) || limit, 200);

  const rows = await dueEnrollments(perRun);
  const resend = apiKey ? new Resend(apiKey) : null;

  const results = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const contact = serializeContact({
      id: row.contact_id,
      email: row.email,
      first_name: row.first_name,
      locale: row.locale,
      status: row.status,
      unsub_token: row.unsub_token,
      no_open_streak: row.no_open_streak,
    });

    const stepNumber = Number(row.current_step);
    const step = getStep(stepNumber);

    // Sequência terminou.
    if (!step) {
      await advanceEnrollment(row.enrollment_id, stepNumber, Number(row.next_send_at), "completed");
      results.push({ email: contact.email, action: "completed" });
      skipped += 1;
      continue;
    }

    // Freio de engajamento: quem não abre há muitos e-mails sai da fila.
    // É o que segura a taxa de reclamação e mantém o domínio entregando.
    if (contact.noOpenStreak >= maxNoOpen) {
      await pauseEnrollment(row.enrollment_id, `no_open_streak_${contact.noOpenStreak}`);
      results.push({ email: contact.email, action: "paused_unengaged" });
      skipped += 1;
      continue;
    }

    // Revalida supressão na hora do envio — a lista pode ter mudado
    // entre a query e este ponto do loop.
    if (await isSuppressed(contact.email)) {
      await pauseEnrollment(row.enrollment_id, "suppressed");
      results.push({ email: contact.email, action: "skipped_suppressed" });
      skipped += 1;
      continue;
    }

    const rendered = renderStepEmail({ step, contact });

    if (dryRun) {
      results.push({ email: contact.email, action: "dry_run", step: step.id, subject: rendered.subject });
      skipped += 1;
      continue;
    }

    try {
      const response = await resend.emails.send({
        from: FROM,
        to: contact.email,
        replyTo: REPLY_TO,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        headers: {
          // Exigido pelas regras de remetente em massa do Gmail/Yahoo.
          // Sem isto, a caixa marca como spam em vez de descadastrar.
          "List-Unsubscribe": `<${unsubscribeUrl(contact.unsubToken)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        tags: [
          { name: "sequence", value: SEQUENCE_ID },
          { name: "step", value: String(stepNumber) },
        ],
      });

      const resendId = response?.data?.id || "";

      if (response?.error) throw new Error(response.error.message || "Resend error");

      await logEmail({
        contactId: contact.id,
        email: contact.email,
        sequenceId: row.sequence_id,
        stepNumber,
        stepId: step.id,
        locale: rendered.locale,
        subject: rendered.subject,
        resendId,
        status: "sent",
      });

      const next = nextStepAfter(stepNumber, cadenceDays);

      if (next) {
        await advanceEnrollment(
          row.enrollment_id,
          next.stepNumber,
          Math.floor(Date.now() / 1000) + next.delaySeconds,
          "active"
        );
      } else {
        await advanceEnrollment(row.enrollment_id, TOTAL_STEPS, Number(row.next_send_at), "completed");
      }

      sent += 1;
      results.push({ email: contact.email, action: "sent", step: step.id, resendId });
    } catch (error) {
      failed += 1;
      const message = String(error?.message || error);

      await logEmail({
        contactId: contact.id,
        email: contact.email,
        sequenceId: row.sequence_id,
        stepNumber,
        stepId: step.id,
        locale: rendered.locale,
        subject: rendered.subject,
        status: "failed",
        error: message.slice(0, 500),
      });

      // Não avança o passo: o contato tenta de novo no próximo ciclo.
      // Só empurra o next_send_at para não travar a fila num erro permanente.
      await advanceEnrollment(
        row.enrollment_id,
        stepNumber,
        Math.floor(Date.now() / 1000) + 3600,
        "active"
      );

      results.push({ email: contact.email, action: "failed", step: step.id, error: message });
    }

    await sleep(SEND_INTERVAL_MS);
  }

  return { ok: true, paused: false, due: rows.length, sent, skipped, failed, results };
}
