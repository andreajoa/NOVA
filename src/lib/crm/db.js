import crypto from "crypto";
import { queryD1, d1Rows } from "@/lib/db";

export const DEFAULT_SEQUENCE_ID = "nova-nurture-60";

// ── bootstrap ──────────────────────────────────────────────────────────────
// D1 aceita um statement por request, então rodamos a lista em ordem.
// O flag de módulo evita repetir o DDL a cada request do mesmo isolate.
let tablesReady = false;

const DDL = [
  `CREATE TABLE IF NOT EXISTS crm_contacts (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '', clerk_id TEXT DEFAULT '', locale TEXT NOT NULL DEFAULT 'en',
    status TEXT NOT NULL DEFAULT 'subscribed', source TEXT NOT NULL DEFAULT 'signup',
    plan TEXT DEFAULT 'trial', is_customer INTEGER NOT NULL DEFAULT 0,
    unsub_token TEXT NOT NULL, tags TEXT DEFAULT '', last_sent_at INTEGER,
    last_open_at INTEGER, last_click_at INTEGER, sent_count INTEGER NOT NULL DEFAULT 0,
    open_count INTEGER NOT NULL DEFAULT 0, click_count INTEGER NOT NULL DEFAULT 0,
    no_open_streak INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts (status)`,
  `CREATE INDEX IF NOT EXISTS idx_crm_contacts_clerk ON crm_contacts (clerk_id)`,
  `CREATE INDEX IF NOT EXISTS idx_crm_contacts_token ON crm_contacts (unsub_token)`,
  `CREATE TABLE IF NOT EXISTS crm_enrollments (
    id TEXT PRIMARY KEY, contact_id TEXT NOT NULL,
    sequence_id TEXT NOT NULL DEFAULT 'nova-nurture-60',
    current_step INTEGER NOT NULL DEFAULT 0, next_send_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', exit_reason TEXT DEFAULT '',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
    UNIQUE (contact_id, sequence_id))`,
  `CREATE INDEX IF NOT EXISTS idx_crm_enroll_due ON crm_enrollments (status, next_send_at)`,
  `CREATE TABLE IF NOT EXISTS crm_email_log (
    id TEXT PRIMARY KEY, contact_id TEXT NOT NULL, email TEXT NOT NULL,
    sequence_id TEXT NOT NULL, step_number INTEGER NOT NULL, step_id TEXT NOT NULL,
    locale TEXT NOT NULL, subject TEXT NOT NULL, resend_id TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'sent', error TEXT DEFAULT '',
    sent_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_crm_log_contact ON crm_email_log (contact_id)`,
  `CREATE INDEX IF NOT EXISTS idx_crm_log_step ON crm_email_log (step_id)`,
  `CREATE INDEX IF NOT EXISTS idx_crm_log_resend ON crm_email_log (resend_id)`,
  `CREATE TABLE IF NOT EXISTS crm_events (
    id TEXT PRIMARY KEY, email TEXT NOT NULL, type TEXT NOT NULL,
    resend_id TEXT DEFAULT '', payload TEXT DEFAULT '', created_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_crm_events_email ON crm_events (email)`,
  `CREATE TABLE IF NOT EXISTS crm_suppressions (
    email TEXT PRIMARY KEY, reason TEXT NOT NULL, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS crm_settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)`,
];

export async function ensureCrmTables() {
  if (tablesReady) return;
  for (const statement of DDL) {
    await queryD1(statement, []);
  }
  tablesReady = true;
}

// ── helpers ────────────────────────────────────────────────────────────────
export function now() {
  return Math.floor(Date.now() / 1000);
}

export function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(value));
}

function newToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export function serializeContact(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    firstName: String(row.first_name || ""),
    lastName: String(row.last_name || ""),
    clerkId: String(row.clerk_id || ""),
    locale: String(row.locale || "en"),
    status: String(row.status || "subscribed"),
    source: String(row.source || "signup"),
    plan: String(row.plan || "trial"),
    isCustomer: Number(row.is_customer || 0) === 1,
    unsubToken: String(row.unsub_token || ""),
    tags: String(row.tags || ""),
    lastSentAt: row.last_sent_at ? Number(row.last_sent_at) : null,
    lastOpenAt: row.last_open_at ? Number(row.last_open_at) : null,
    sentCount: Number(row.sent_count || 0),
    openCount: Number(row.open_count || 0),
    clickCount: Number(row.click_count || 0),
    noOpenStreak: Number(row.no_open_streak || 0),
    createdAt: Number(row.created_at || 0),
  };
}

// ── contatos ───────────────────────────────────────────────────────────────
export async function getContactByEmail(email) {
  await ensureCrmTables();
  const res = await queryD1(
    `SELECT * FROM crm_contacts WHERE email = ? LIMIT 1`,
    [normalizeEmail(email)]
  );
  return serializeContact(d1Rows(res)[0]);
}

export async function getContactByToken(token) {
  await ensureCrmTables();
  if (!token) return null;
  const res = await queryD1(
    `SELECT * FROM crm_contacts WHERE unsub_token = ? LIMIT 1`,
    [String(token)]
  );
  return serializeContact(d1Rows(res)[0]);
}

/**
 * Cria o contato se não existir; se existir, completa os campos vazios.
 * Nunca reativa quem descadastrou — status só sobe para 'subscribed' manualmente.
 */
export async function upsertContact(data) {
  await ensureCrmTables();

  const email = normalizeEmail(data.email);
  if (!isValidEmail(email)) throw new Error(`E-mail inválido: ${data.email}`);

  const existing = await getContactByEmail(email);
  const ts = now();

  if (existing) {
    await queryD1(
      `UPDATE crm_contacts SET
         first_name = CASE WHEN first_name = '' THEN ? ELSE first_name END,
         last_name  = CASE WHEN last_name  = '' THEN ? ELSE last_name  END,
         clerk_id   = CASE WHEN clerk_id   = '' THEN ? ELSE clerk_id   END,
         locale     = COALESCE(NULLIF(?, ''), locale),
         plan       = COALESCE(NULLIF(?, ''), plan),
         updated_at = ?
       WHERE email = ?`,
      [
        data.firstName || "",
        data.lastName || "",
        data.clerkId || "",
        data.locale || "",
        data.plan || "",
        ts,
        email,
      ]
    );
    return getContactByEmail(email);
  }

  // Quem já está suprimido entra como suprimido, não como inscrito.
  const suppressed = await isSuppressed(email);

  await queryD1(
    `INSERT OR IGNORE INTO crm_contacts
      (id, email, first_name, last_name, clerk_id, locale, status, source, plan,
       is_customer, unsub_token, tags, sent_count, open_count, click_count,
       no_open_streak, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, 0, 0, 0, ?, ?)`,
    [
      crypto.randomUUID(),
      email,
      data.firstName || "",
      data.lastName || "",
      data.clerkId || "",
      data.locale || "en",
      suppressed ? "suppressed" : "subscribed",
      data.source || "signup",
      data.plan || "trial",
      newToken(),
      data.tags || "",
      ts,
      ts,
    ]
  );

  return getContactByEmail(email);
}

export async function setContactStatus(email, status, reason = "") {
  await ensureCrmTables();
  const clean = normalizeEmail(email);

  await queryD1(
    `UPDATE crm_contacts SET status = ?, updated_at = ? WHERE email = ?`,
    [status, now(), clean]
  );

  if (["unsubscribed", "bounced", "complained", "suppressed"].includes(status)) {
    await addSuppression(clean, reason || status);
    await queryD1(
      `UPDATE crm_enrollments SET status = 'exited_unsub', exit_reason = ?, updated_at = ?
       WHERE contact_id IN (SELECT id FROM crm_contacts WHERE email = ?)
         AND status IN ('active','paused')`,
      [reason || status, now(), clean]
    );
  }
}

/** Marca como cliente e tira da sequência de venda — quem já comprou não leva pitch. */
export async function markContactAsCustomer(identifier, plan = "") {
  await ensureCrmTables();
  const email = normalizeEmail(identifier);
  const ts = now();

  await queryD1(
    `UPDATE crm_contacts SET is_customer = 1, plan = COALESCE(NULLIF(?, ''), plan), updated_at = ?
     WHERE email = ? OR clerk_id = ?`,
    [plan, ts, email, String(identifier)]
  );

  await queryD1(
    `UPDATE crm_enrollments SET status = 'exited_converted', exit_reason = 'converted', updated_at = ?
     WHERE status IN ('active','paused')
       AND contact_id IN (SELECT id FROM crm_contacts WHERE email = ? OR clerk_id = ?)`,
    [ts, email, String(identifier)]
  );
}

// ── supressão ──────────────────────────────────────────────────────────────
export async function addSuppression(email, reason) {
  await ensureCrmTables();
  await queryD1(
    `INSERT OR REPLACE INTO crm_suppressions (email, reason, created_at) VALUES (?, ?, ?)`,
    [normalizeEmail(email), String(reason || "manual"), now()]
  );
}

export async function isSuppressed(email) {
  await ensureCrmTables();
  const res = await queryD1(
    `SELECT email FROM crm_suppressions WHERE email = ? LIMIT 1`,
    [normalizeEmail(email)]
  );
  return Boolean(d1Rows(res)[0]);
}

// ── enrollments ────────────────────────────────────────────────────────────
/**
 * @param startStep passo inicial. O cadastro entra em 1, não em 0, porque o
 *   passo 0 é o e-mail de boas-vindas que o webhook do Clerk já dispara
 *   como transacional — enrolar em 0 mandaria dois "bem-vindo" seguidos.
 */
export async function enrollContact(
  contactId,
  sequenceId = DEFAULT_SEQUENCE_ID,
  firstDelaySeconds = 0,
  startStep = 0
) {
  await ensureCrmTables();
  const ts = now();

  await queryD1(
    `INSERT OR IGNORE INTO crm_enrollments
      (id, contact_id, sequence_id, current_step, next_send_at, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
    [crypto.randomUUID(), contactId, sequenceId, Number(startStep), ts + firstDelaySeconds, ts, ts]
  );

  const res = await queryD1(
    `SELECT * FROM crm_enrollments WHERE contact_id = ? AND sequence_id = ? LIMIT 1`,
    [contactId, sequenceId]
  );
  return d1Rows(res)[0] ?? null;
}

/**
 * Enrollments vencidos, já com os dados do contato, filtrando
 * quem está suprimido / descadastrado / convertido direto no SQL.
 */
export async function dueEnrollments(limit = 100) {
  await ensureCrmTables();
  const res = await queryD1(
    `SELECT e.id AS enrollment_id, e.sequence_id, e.current_step, e.next_send_at,
            c.id AS contact_id, c.email, c.first_name, c.locale, c.status,
            c.no_open_streak, c.is_customer, c.unsub_token
     FROM crm_enrollments e
     JOIN crm_contacts c ON c.id = e.contact_id
     WHERE e.status = 'active'
       AND e.next_send_at <= ?
       AND c.status = 'subscribed'
       AND c.is_customer = 0
       AND c.email NOT IN (SELECT email FROM crm_suppressions)
     ORDER BY e.next_send_at ASC
     LIMIT ?`,
    [now(), Number(limit)]
  );
  return d1Rows(res);
}

export async function advanceEnrollment(enrollmentId, nextStep, nextSendAt, status = "active") {
  await ensureCrmTables();
  await queryD1(
    `UPDATE crm_enrollments SET current_step = ?, next_send_at = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [Number(nextStep), Number(nextSendAt), status, now(), enrollmentId]
  );
}

export async function pauseEnrollment(enrollmentId, reason) {
  await ensureCrmTables();
  await queryD1(
    `UPDATE crm_enrollments SET status = 'paused', exit_reason = ?, updated_at = ? WHERE id = ?`,
    [String(reason || "paused"), now(), enrollmentId]
  );
}

// ── log de envio ───────────────────────────────────────────────────────────
export async function logEmail(data) {
  await ensureCrmTables();
  const ts = now();

  await queryD1(
    `INSERT INTO crm_email_log
      (id, contact_id, email, sequence_id, step_number, step_id, locale, subject,
       resend_id, status, error, sent_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      data.contactId,
      normalizeEmail(data.email),
      data.sequenceId,
      Number(data.stepNumber),
      data.stepId,
      data.locale,
      data.subject,
      data.resendId || "",
      data.status || "sent",
      data.error || "",
      ts,
      ts,
    ]
  );

  if (data.status === "sent") {
    // no_open_streak sobe a cada envio e zera quando o contato abre.
    await queryD1(
      `UPDATE crm_contacts
       SET sent_count = sent_count + 1, last_sent_at = ?,
           no_open_streak = no_open_streak + 1, updated_at = ?
       WHERE id = ?`,
      [ts, ts, data.contactId]
    );
  }
}

export async function recordEvent({ email, type, resendId, payload }) {
  await ensureCrmTables();
  const clean = normalizeEmail(email);
  const ts = now();

  await queryD1(
    `INSERT INTO crm_events (id, email, type, resend_id, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), clean, String(type), resendId || "", JSON.stringify(payload ?? {}).slice(0, 4000), ts]
  );

  if (type === "email.opened") {
    await queryD1(
      `UPDATE crm_contacts SET open_count = open_count + 1, last_open_at = ?,
         no_open_streak = 0, updated_at = ? WHERE email = ?`,
      [ts, ts, clean]
    );
  }

  if (type === "email.clicked") {
    await queryD1(
      `UPDATE crm_contacts SET click_count = click_count + 1, last_click_at = ?,
         no_open_streak = 0, updated_at = ? WHERE email = ?`,
      [ts, ts, clean]
    );
  }

  if (resendId) {
    const statusByType = {
      "email.delivered": "delivered",
      "email.opened": "opened",
      "email.clicked": "clicked",
      "email.bounced": "bounced",
      "email.complained": "complained",
    };
    const mapped = statusByType[type];
    if (mapped) {
      await queryD1(
        `UPDATE crm_email_log SET status = ?, updated_at = ? WHERE resend_id = ?`,
        [mapped, ts, resendId]
      );
    }
  }
}

// ── settings ───────────────────────────────────────────────────────────────
export async function getSetting(key, fallback = null) {
  await ensureCrmTables();
  const res = await queryD1(`SELECT value FROM crm_settings WHERE key = ? LIMIT 1`, [key]);
  const row = d1Rows(res)[0];
  return row ? String(row.value) : fallback;
}

export async function setSetting(key, value) {
  await ensureCrmTables();
  await queryD1(
    `INSERT OR REPLACE INTO crm_settings (key, value, updated_at) VALUES (?, ?, ?)`,
    [key, String(value), now()]
  );
}
