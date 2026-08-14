-- NOVA CRM — schema (Cloudflare D1 / SQLite)
-- Aplicado automaticamente por ensureCrmTables() em src/lib/crm/db.js.

-- Contatos. Uma linha por endereço de e-mail, único no sistema.
CREATE TABLE IF NOT EXISTS crm_contacts (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  first_name     TEXT DEFAULT '',
  last_name      TEXT DEFAULT '',
  clerk_id       TEXT DEFAULT '',
  locale         TEXT NOT NULL DEFAULT 'en',      -- 'pt' | 'en'
  status         TEXT NOT NULL DEFAULT 'subscribed',
                 -- subscribed | unsubscribed | bounced | complained | suppressed
  source         TEXT NOT NULL DEFAULT 'signup',  -- signup | import | manual | api
  plan           TEXT DEFAULT 'trial',
  is_customer    INTEGER NOT NULL DEFAULT 0,
  unsub_token    TEXT NOT NULL,
  tags           TEXT DEFAULT '',                 -- csv livre
  last_sent_at   INTEGER,
  last_open_at   INTEGER,
  last_click_at  INTEGER,
  sent_count     INTEGER NOT NULL DEFAULT 0,
  open_count     INTEGER NOT NULL DEFAULT 0,
  click_count    INTEGER NOT NULL DEFAULT 0,
  no_open_streak INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts (status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_clerk  ON crm_contacts (clerk_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_token  ON crm_contacts (unsub_token);

-- Inscrição de um contato numa sequência. Guarda o ponteiro do próximo envio.
CREATE TABLE IF NOT EXISTS crm_enrollments (
  id            TEXT PRIMARY KEY,
  contact_id    TEXT NOT NULL,
  sequence_id   TEXT NOT NULL DEFAULT 'nova-nurture-60',
  current_step  INTEGER NOT NULL DEFAULT 0,
  next_send_at  INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
                -- active | paused | completed | exited_converted | exited_unsub
  exit_reason   TEXT DEFAULT '',
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  UNIQUE (contact_id, sequence_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_enroll_due ON crm_enrollments (status, next_send_at);

-- Log de envio. Uma linha por e-mail disparado.
CREATE TABLE IF NOT EXISTS crm_email_log (
  id           TEXT PRIMARY KEY,
  contact_id   TEXT NOT NULL,
  email        TEXT NOT NULL,
  sequence_id  TEXT NOT NULL,
  step_number  INTEGER NOT NULL,
  step_id      TEXT NOT NULL,
  locale       TEXT NOT NULL,
  subject      TEXT NOT NULL,
  resend_id    TEXT DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'sent',
               -- sent | delivered | opened | clicked | bounced | complained | failed
  error        TEXT DEFAULT '',
  sent_at      INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_log_contact ON crm_email_log (contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_log_step    ON crm_email_log (step_id);
CREATE INDEX IF NOT EXISTS idx_crm_log_resend  ON crm_email_log (resend_id);

-- Eventos crus vindos do webhook da Resend (auditoria).
CREATE TABLE IF NOT EXISTS crm_events (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  type       TEXT NOT NULL,
  resend_id  TEXT DEFAULT '',
  payload    TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_events_email ON crm_events (email);

-- Lista de supressão. Consultada antes de QUALQUER envio.
CREATE TABLE IF NOT EXISTS crm_suppressions (
  email      TEXT PRIMARY KEY,
  reason     TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Config global (kill switch, cadência, limites).
CREATE TABLE IF NOT EXISTS crm_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
