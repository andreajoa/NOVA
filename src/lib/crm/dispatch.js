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

// A Resend aceita até 100 e-mails por chamada de batch. Enviar em lote é o que
// torna o plano free do Vercel viável: um envio individual leva ~550ms (rate
// limit), então 60s de função dariam ~90 e-mails/dia. Em lote, 100 e-mails
// custam UMA requisição.
const BATCH_SIZE = 100;

// Orçamento de tempo. O plano Hobby do Vercel mata a função em 60s; paramos
// antes disso e deixamos o resto para o próximo ciclo, com o ponteiro de cada
// inscrição intacto (nada é perdido, nada é enviado duas vezes).
const TIME_BUDGET_MS = 45000;

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Um ciclo de disparo. Chamado pelo cron.
 *
 * Proteções, nesta ordem:
 *   1. kill switch global (crm_paused)
 *   2. limite de envios por ciclo
 *   3. supressão (bounce, reclamação, unsubscribe)
 *   4. freio por engajamento — pausa quem não abre há N e-mails
 *   5. orçamento de tempo — nunca estoura o limite da função
 */
export async function runDispatch({ limit = 500, dryRun = false } = {}) {
  const startedAt = Date.now();

  const paused = (await getSetting("crm_paused", "0")) === "1";
  if (paused) {
    return { ok: true, paused: true, due: 0, sent: 0, skipped: 0, failed: 0, batches: 0, results: [] };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey && !dryRun) {
    return { ok: false, error: "RESEND_API_KEY_MISSING", due: 0, sent: 0, skipped: 0, failed: 0, batches: 0, results: [] };
  }

  const cadenceDays = Number(await getSetting("crm_cadence_days", "0")) || null;
  const maxNoOpen = Number(await getSetting("crm_max_no_open_streak", "10")) || 10;
  const perRun = Math.min(Number(await getSetting("crm_max_per_run", String(limit))) || limit, 2000);

  const rows = await dueEnrollments(perRun);
  const resend = apiKey ? new Resend(apiKey) : null;

  const results = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let batches = 0;

  // ── 1. Filtra e renderiza ────────────────────────────────────────────────
  const pending = [];

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

    if (!step) {
      await advanceEnrollment(row.enrollment_id, stepNumber, Number(row.next_send_at), "completed");
      results.push({ email: contact.email, action: "completed" });
      skipped += 1;
      continue;
    }

    if (contact.noOpenStreak >= maxNoOpen) {
      await pauseEnrollment(row.enrollment_id, `no_open_streak_${contact.noOpenStreak}`);
      results.push({ email: contact.email, action: "paused_unengaged" });
      skipped += 1;
      continue;
    }

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

    pending.push({ row, contact, step, stepNumber, rendered });
  }

  // ── 2. Envia em lotes ────────────────────────────────────────────────────
  for (const group of chunk(pending, BATCH_SIZE)) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      // Sem tempo para mais um lote. Estes contatos continuam vencidos e
      // entram no próximo ciclo — nenhum ponteiro foi movido.
      skipped += group.length;
      results.push({ action: "deferred_time_budget", count: group.length });
      break;
    }

    const payload = group.map(({ contact, rendered, stepNumber }) => ({
      from: FROM,
      to: contact.email,
      replyTo: REPLY_TO,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        // Exigido pelas regras de remetente em massa do Gmail/Yahoo. Sem isto,
        // a caixa marca como spam em vez de oferecer o descadastro.
        "List-Unsubscribe": `<${unsubscribeUrl(contact.unsubToken)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [
        { name: "sequence", value: SEQUENCE_ID },
        { name: "step", value: String(stepNumber) },
      ],
    }));

    batches += 1;

    let response;
    try {
      // 'permissive' faz a Resend enviar os válidos e devolver os índices que
      // falharam, em vez de recusar o lote inteiro por causa de um endereço.
      response = await resend.batch.send(payload, { batchValidation: "permissive" });
    } catch (error) {
      response = { error: { message: String(error?.message || error) } };
    }

    // Falha do lote inteiro: ninguém avança, todos tentam de novo no próximo ciclo.
    if (response?.error) {
      const message = String(response.error.message || "batch failed");

      for (const item of group) {
        failed += 1;
        await logEmail({
          contactId: item.contact.id,
          email: item.contact.email,
          sequenceId: item.row.sequence_id,
          stepNumber: item.stepNumber,
          stepId: item.step.id,
          locale: item.rendered.locale,
          subject: item.rendered.subject,
          status: "failed",
          error: message.slice(0, 500),
        });
        await advanceEnrollment(
          item.row.enrollment_id,
          item.stepNumber,
          Math.floor(Date.now() / 1000) + 3600,
          "active"
        );
      }

      results.push({ action: "batch_failed", count: group.length, error: message });
      continue;
    }

    // Mapeia a resposta de volta para cada contato.
    const errorsByIndex = new Map(
      (response?.data?.errors || []).map((item) => [Number(item.index), String(item.message || "invalid")])
    );
    const ids = response?.data?.data || [];
    const aligned = ids.length === group.length;
    let cursor = 0;

    for (let index = 0; index < group.length; index += 1) {
      const item = group[index];
      const itemError = errorsByIndex.get(index);

      if (itemError) {
        failed += 1;
        await logEmail({
          contactId: item.contact.id,
          email: item.contact.email,
          sequenceId: item.row.sequence_id,
          stepNumber: item.stepNumber,
          stepId: item.step.id,
          locale: item.rendered.locale,
          subject: item.rendered.subject,
          status: "failed",
          error: itemError.slice(0, 500),
        });
        await advanceEnrollment(
          item.row.enrollment_id,
          item.stepNumber,
          Math.floor(Date.now() / 1000) + 3600,
          "active"
        );
        results.push({ email: item.contact.email, action: "failed", step: item.step.id, error: itemError });
        continue;
      }

      // Quando há erros, a lista de ids só traz os que passaram — por isso o
      // cursor, em vez de indexar direto pela posição do lote.
      const resendId = aligned ? ids[index]?.id || "" : ids[cursor]?.id || "";
      cursor += 1;

      await logEmail({
        contactId: item.contact.id,
        email: item.contact.email,
        sequenceId: item.row.sequence_id,
        stepNumber: item.stepNumber,
        stepId: item.step.id,
        locale: item.rendered.locale,
        subject: item.rendered.subject,
        resendId,
        status: "sent",
      });

      const next = nextStepAfter(item.stepNumber, cadenceDays);

      if (next) {
        await advanceEnrollment(
          item.row.enrollment_id,
          next.stepNumber,
          Math.floor(Date.now() / 1000) + next.delaySeconds,
          "active"
        );
      } else {
        await advanceEnrollment(
          item.row.enrollment_id,
          TOTAL_STEPS,
          Number(item.row.next_send_at),
          "completed"
        );
      }

      sent += 1;
      results.push({ email: item.contact.email, action: "sent", step: item.step.id, resendId });
    }
  }

  return {
    ok: true,
    paused: false,
    due: rows.length,
    sent,
    skipped,
    failed,
    batches,
    elapsedMs: Date.now() - startedAt,
    results,
  };
}
