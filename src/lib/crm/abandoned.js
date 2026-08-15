/**
 * Motor de abandoned checkout.
 *
 * Fluxo:
 *   1. Checkout session criada → recordCheckoutAttempt()
 *   2. checkout.session.completed → markCheckoutConverted()
 *   3. checkout.session.expired  → activateAbandoned() + envia email 0 na hora
 *   4. Cron diário → runAbandonedDispatch() → envia emails 1-4
 *
 * Cadência a partir do momento de ativação:
 *   Email 0: imediato (enviado pelo webhook)
 *   Email 1: +24h
 *   Email 2: +48h
 *   Email 3: +72h
 *   Email 4: +7 dias
 */

import crypto from "crypto";
import { Resend } from "resend";
import { queryD1, d1Rows } from "@/lib/db";
import { renderEmailHtml, renderEmailText } from "@/lib/crm/emails/shell";
import { ABANDONED_EMAILS, ABANDONED_TACTICS } from "@/lib/crm/emails/abandoned";
import { normalizeLocale, baseUrl, unsubscribeUrl } from "@/lib/crm/render";
import {
  ensureCrmTables,
  getContactByEmail,
  isSuppressed,
  logEmail,
  normalizeEmail,
} from "@/lib/crm/db";

// ── bootstrap ──────────────────────────────────────────────────────────────

let tablesReady = false;

const DDL = [
  `CREATE TABLE IF NOT EXISTS crm_abandoned (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    user_id TEXT DEFAULT '',
    plan TEXT NOT NULL DEFAULT 'basic',
    billing TEXT NOT NULL DEFAULT 'monthly',
    stripe_session_id TEXT DEFAULT '',
    current_step INTEGER NOT NULL DEFAULT -1,
    next_send_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_abn_email ON crm_abandoned (email)`,
  `CREATE INDEX IF NOT EXISTS idx_abn_status ON crm_abandoned (status, next_send_at)`,
  `CREATE INDEX IF NOT EXISTS idx_abn_stripe ON crm_abandoned (stripe_session_id)`,
];

async function ensureAbandonedTables() {
  if (tablesReady) return;
  await ensureCrmTables();
  for (const stmt of DDL) {
    await queryD1(stmt, []);
  }
  tablesReady = true;
}

function now() {
  return Math.floor(Date.now() / 1000);
}

// ── cadência ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = ABANDONED_EMAILS.length; // 5

// Segundos a partir da ativação para cada step
const STEP_OFFSETS = [
  0,           // email 0: imediato
  86_400,      // email 1: +24h
  172_800,     // email 2: +48h
  259_200,     // email 3: +72h
  604_800,     // email 4: +7 dias
];

// Delay entre steps (para avançar a partir do step atual)
function delayAfterStep(stepNumber) {
  if (stepNumber + 1 >= TOTAL_STEPS) return null;
  return STEP_OFFSETS[stepNumber + 1] - STEP_OFFSETS[stepNumber];
}

// ── CRUD ───────────────────────────────────────────────────────────────────

/**
 * Registra a tentativa de checkout. Chamado quando o Stripe session é criado.
 * Status 'pending' — só vira 'active' quando o checkout expira/é abandonado.
 * Se já existe um abandoned ativo para esse email, não duplica.
 */
export async function recordCheckoutAttempt({ email, userId, plan, billing, stripeSessionId }) {
  await ensureAbandonedTables();
  const clean = normalizeEmail(email);
  const ts = now();

  // Não criar se já existe um ativo ou pendente
  const existing = await queryD1(
    `SELECT id FROM crm_abandoned
     WHERE email = ? AND status IN ('pending','active') LIMIT 1`,
    [clean]
  );
  if (d1Rows(existing).length > 0) return null;

  // Não criar se já é cliente
  const suppressed = await isSuppressed(clean);
  if (suppressed) return null;

  const id = crypto.randomUUID();
  await queryD1(
    `INSERT INTO crm_abandoned
      (id, email, user_id, plan, billing, stripe_session_id,
       current_step, next_send_at, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, -1, ?, 'pending', ?, ?)`,
    [id, clean, userId || "", plan || "basic", billing || "monthly",
     stripeSessionId || "", ts + 7200, ts, ts]
  );
  return id;
}

/**
 * Marca o checkout como convertido. Chamado pelo webhook checkout.session.completed.
 * Desativa qualquer sequência abandoned em andamento para esse email/userId.
 */
export async function markCheckoutConverted({ stripeSessionId, email, userId }) {
  await ensureAbandonedTables();
  const ts = now();

  if (stripeSessionId) {
    await queryD1(
      `UPDATE crm_abandoned SET status = 'converted', updated_at = ?
       WHERE stripe_session_id = ? AND status IN ('pending','active')`,
      [ts, stripeSessionId]
    );
  }

  if (email) {
    await queryD1(
      `UPDATE crm_abandoned SET status = 'converted', updated_at = ?
       WHERE email = ? AND status IN ('pending','active')`,
      [ts, normalizeEmail(email)]
    );
  }

  if (userId) {
    await queryD1(
      `UPDATE crm_abandoned SET status = 'converted', updated_at = ?
       WHERE user_id = ? AND status IN ('pending','active')`,
      [ts, userId]
    );
  }
}

/**
 * Ativa a sequência de abandoned e retorna o registro.
 * Chamado pelo webhook checkout.session.expired ou pelo cron ao detectar
 * checkout sessions pendentes que passaram do prazo.
 */
export async function activateAbandoned(id) {
  await ensureAbandonedTables();
  const ts = now();

  await queryD1(
    `UPDATE crm_abandoned SET status = 'active', current_step = 0,
       next_send_at = ?, updated_at = ?
     WHERE id = ? AND status = 'pending'`,
    [ts, ts, id]
  );

  const res = await queryD1(`SELECT * FROM crm_abandoned WHERE id = ? LIMIT 1`, [id]);
  return d1Rows(res)[0] || null;
}

/**
 * Ativa todos os checkouts pendentes que já passaram do prazo de espera.
 * Chamado pelo cron como fallback (caso o webhook checkout.session.expired
 * não esteja configurado no Stripe).
 */
export async function activateStalePending() {
  await ensureAbandonedTables();
  const ts = now();

  const res = await queryD1(
    `SELECT id FROM crm_abandoned
     WHERE status = 'pending' AND next_send_at <= ?
     LIMIT 20`,
    [ts]
  );
  const rows = d1Rows(res);

  const activated = [];
  for (const row of rows) {
    const record = await activateAbandoned(String(row.id));
    if (record) activated.push(record);
  }
  return activated;
}

/**
 * Busca abandoned entries prontas para envio.
 */
async function getDueAbandoned(limit = 50) {
  await ensureAbandonedTables();
  return d1Rows(
    await queryD1(
      `SELECT * FROM crm_abandoned
       WHERE status = 'active' AND next_send_at <= ?
       ORDER BY next_send_at ASC LIMIT ?`,
      [now(), limit]
    )
  );
}

async function advanceAbandoned(id, nextStep, nextSendAt, status = "active") {
  await ensureAbandonedTables();
  await queryD1(
    `UPDATE crm_abandoned SET current_step = ?, next_send_at = ?,
       status = ?, updated_at = ?
     WHERE id = ?`,
    [nextStep, nextSendAt, status, now(), id]
  );
}

// ── render ─────────────────────────────────────────────────────────────────

function replacePlan(text, plan) {
  if (!text) return text;
  const name = String(plan || "Basic");
  const upper = name.toUpperCase();
  const cap = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return String(text)
    .replace(/\{\{planUpper\}\}/g, upper)
    .replace(/\{\{PLAN\}\}/g, upper)
    .replace(/\{\{plan\}\}/g, cap);
}

function replaceInObj(obj, plan) {
  if (!obj) return obj;
  if (typeof obj === "string") return replacePlan(obj, plan);
  if (Array.isArray(obj)) return obj.map((v) => replaceInObj(v, plan));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = replaceInObj(v, plan);
  }
  return out;
}

/**
 * Renderiza um e-mail de abandoned checkout.
 * Retorna { subject, html, text, locale, ask } pronto para o Resend.
 */
export function renderAbandonedEmail({ stepNumber, plan, locale, contact }) {
  const emailDef = ABANDONED_EMAILS[stepNumber];
  if (!emailDef) return null;

  const loc = normalizeLocale(locale);
  const rawCopy = emailDef[loc] || emailDef.en;
  const copy = replaceInObj(rawCopy, plan);

  const tacticsEntry = ABANDONED_TACTICS[emailDef.id] || {};
  const rawTactics = tacticsEntry[loc] || tacticsEntry.en || {};
  const extra = replaceInObj(rawTactics, plan);

  // Media fields live at the top level of the tactics entry (not inside en/pt)
  const heroImage = tacticsEntry.heroImage || null;
  const images = tacticsEntry.images || null;
  const videoThumb = tacticsEntry.videoThumb || null;

  const ask = emailDef.ask || "hook";

  // Personalização com primeiro nome
  const firstName = String(contact?.firstName || "").trim();
  const body = [...copy.body];
  if (firstName && body.length) {
    body[0] = `${firstName}, ${body[0].charAt(0).toLowerCase()}${body[0].slice(1)}`;
  }

  const base = baseUrl();
  const ctaUrl = `${base}${copy.href}?utm_source=email&utm_medium=crm&utm_campaign=abandoned&utm_content=${emailDef.id}`;
  const unsubUrl = contact?.unsubToken
    ? unsubscribeUrl(contact.unsubToken)
    : `${base}/api/crm/unsubscribe`;

  const opts = {
    headline: copy.headline,
    body,
    tactic: extra.tactic || null,
    proof: extra.proof || null,
    cta: copy.cta,
    ctaUrl,
    ask,
    ps: extra.ps || "",
    preheader: copy.preheader,
    unsubUrl,
    locale: loc,
    heroImage,
    images,
    videoThumb,
  };

  return {
    subject: copy.subject,
    html: renderEmailHtml(opts),
    text: renderEmailText(opts),
    unsubUrl,
    locale: loc,
    ask,
    stepId: emailDef.id,
  };
}

// ── envio individual ───────────────────────────────────────────────────────

/**
 * Envia UM e-mail de abandoned checkout. Usado pelo webhook (email 0)
 * e pelo dispatch (emails 1-4).
 */
export async function sendAbandonedEmail(record) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail =
    process.env.CRM_FROM_EMAIL || "NOVA AI Studio <noreply@novvideos.online>";
  const replyTo = process.env.CRM_REPLY_TO || "novavideoai@proton.me";

  const email = String(record.email);
  const step = Number(record.current_step);
  const plan = String(record.plan || "Basic");

  // Buscar o contato para locale e personalização
  const contact = await getContactByEmail(email);
  const locale = contact?.locale || process.env.CRM_DEFAULT_LOCALE || "en";

  const rendered = renderAbandonedEmail({
    stepNumber: step,
    plan,
    locale,
    contact: contact || { firstName: "", unsubToken: "" },
  });

  if (!rendered) return { ok: false, error: "step not found" };

  // Checar supressão
  const suppressed = await isSuppressed(email);
  if (suppressed) {
    await advanceAbandoned(record.id, step, now(), "cancelled");
    return { ok: false, error: "suppressed" };
  }

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      replyTo,
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        "List-Unsubscribe": `<${rendered.unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    // Logar no CRM email log
    try {
      await logEmail({
        contactId: contact?.id || record.user_id || "unknown",
        email,
        sequenceId: "nova-abandoned-5",
        stepNumber: step,
        stepId: rendered.stepId,
        locale: rendered.locale,
        subject: rendered.subject,
        resendId: result.data?.id || "",
        status: "sent",
      });
    } catch { /* log failure shouldn't break send */ }

    // Avançar para o próximo step
    const delay = delayAfterStep(step);
    if (delay === null) {
      // Último step — marcar como completo
      await advanceAbandoned(record.id, step, now(), "completed");
    } else {
      await advanceAbandoned(record.id, step + 1, now() + delay);
    }

    return { ok: true, resendId: result.data?.id };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── dispatch (cron) ────────────────────────────────────────────────────────

/**
 * Roda um ciclo de envio de abandoned checkout.
 * Chamado pelo cron /api/cron/abandoned-dispatch.
 *
 * Etapas:
 *   1. Ativar checkouts pendentes que já passaram do prazo (fallback)
 *   2. Buscar entries ativas com next_send_at <= now
 *   3. Enviar o e-mail de cada uma
 */
export async function runAbandonedDispatch({ dryRun = false, limit = 50 } = {}) {
  await ensureAbandonedTables();

  // 1. Ativar pendentes stale (fallback caso webhook não esteja ativo)
  const activated = await activateStalePending();

  // Para entries recém-ativadas, o email 0 ainda não foi enviado.
  // O getDueAbandoned vai pegá-las porque next_send_at <= now.

  // 2. Buscar entries prontas
  const due = await getDueAbandoned(limit);

  if (dryRun) {
    return {
      dryRun: true,
      activated: activated.length,
      due: due.length,
      entries: due.map((r) => ({
        email: r.email,
        plan: r.plan,
        step: r.current_step,
        status: r.status,
      })),
    };
  }

  // 3. Enviar
  let sent = 0;
  let failed = 0;
  const results = [];

  for (const record of due) {
    const result = await sendAbandonedEmail(record);
    if (result.ok) {
      sent++;
    } else {
      failed++;
    }
    results.push({ email: record.email, step: record.current_step, ...result });
  }

  return { activated: activated.length, due: due.length, sent, failed, results };
}
