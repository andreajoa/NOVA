import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { d1Rows, queryD1 } from "@/lib/db";

let ensureTablePromise = null;

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function tokenHash(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function safeEqualHex(left, right) {
  try {
    const a = Buffer.from(String(left || ""), "hex");
    const b = Buffer.from(String(right || ""), "hex");
    if (!a.length || a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function safeInputJson(input) {
  if (!input || typeof input !== "object") return null;
  const allowed = {
    task: String(input.task || "").slice(0, 40),
    prompt: String(input.prompt || "").slice(0, 2000),
    negative_prompt: String(input.negative_prompt || "").slice(0, 1200),
    image_url: String(input.image_url || "").slice(0, 2000),
    source_video_url: String(input.source_video_url || "").slice(0, 2000),
    speech_text: String(input.speech_text || "").slice(0, 500),
    duration: Number(input.duration || 5),
    resolution: String(input.resolution || "").slice(0, 40),
    aspect_ratio: String(input.aspect_ratio || "").slice(0, 20),
    frames_per_second: Number(input.frames_per_second || 24),
    num_frames: Number(input.num_frames || 0),
    seed: input.seed == null ? null : Number(input.seed),
  };
  return JSON.stringify(allowed);
}

function parseInput(value) {
  try {
    const parsed = JSON.parse(String(value || ""));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

async function ensureColumns() {
  const info = await queryD1("PRAGMA table_info(nova_included_video_jobs)");
  const names = new Set(d1Rows(info).map((row) => String(row.name || "")));
  const additions = [
    ["input_json", "TEXT"],
    ["engine", "TEXT"],
    ["attempt", "INTEGER NOT NULL DEFAULT 0"],
  ];
  for (const [name, definition] of additions) {
    if (!names.has(name)) {
      await queryD1(`ALTER TABLE nova_included_video_jobs ADD COLUMN ${name} ${definition}`);
    }
  }
}

async function ensureTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      await queryD1(`
        CREATE TABLE IF NOT EXISTS nova_included_video_jobs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          public_url TEXT NOT NULL,
          callback_token_hash TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'processing',
          error_code TEXT,
          quota_debited INTEGER NOT NULL DEFAULT 0,
          quota_refunded INTEGER NOT NULL DEFAULT 0,
          input_json TEXT,
          engine TEXT,
          attempt INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      await ensureColumns();
    })().catch((error) => {
      ensureTablePromise = null;
      throw error;
    });
  }
  await ensureTablePromise;
}

function rowToJob(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    publicUrl: String(row.public_url),
    status: String(row.status),
    errorCode: row.error_code ? String(row.error_code) : null,
    quotaDebited: Number(row.quota_debited || 0) === 1,
    quotaRefunded: Number(row.quota_refunded || 0) === 1,
    input: parseInput(row.input_json),
    engine: row.engine ? String(row.engine) : null,
    attempt: Number(row.attempt || 0),
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0),
  };
}

export async function createFreeVideoJob({
  userId,
  publicUrl,
  quotaDebited = false,
  input = null,
  engine = null,
}) {
  if (!userId || !publicUrl) throw new Error("Invalid NOVA video job");
  await ensureTable();

  const id = randomUUID();
  const callbackToken = randomBytes(32).toString("hex");
  const now = nowSeconds();

  await queryD1(
    `INSERT INTO nova_included_video_jobs
      (id, user_id, public_url, callback_token_hash, status, quota_debited,
       quota_refunded, input_json, engine, attempt, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'processing', ?, 0, ?, ?, 0, ?, ?)`,
    [
      id,
      userId,
      publicUrl,
      tokenHash(callbackToken),
      quotaDebited ? 1 : 0,
      safeInputJson(input),
      engine ? String(engine).slice(0, 80) : null,
      now,
      now,
    ]
  );

  return {
    id,
    callbackToken,
    publicUrl,
    status: "processing",
    input,
    engine,
    attempt: 0,
  };
}

export async function getFreeVideoJob({ jobId, userId, admin = false }) {
  if (!jobId || !userId) return null;
  await ensureTable();

  const res = await queryD1(
    `SELECT id, user_id, public_url, status, error_code, quota_debited,
            quota_refunded, input_json, engine, attempt, created_at, updated_at
     FROM nova_included_video_jobs
     WHERE id = ?
     LIMIT 1`,
    [jobId]
  );
  const job = rowToJob(d1Rows(res)[0]);
  if (!job) return null;
  if (!admin && String(job.userId) !== String(userId)) return null;
  return job;
}

export async function getFreeVideoJobForCallback({ jobId, callbackToken }) {
  if (!jobId || !callbackToken) return null;
  await ensureTable();
  const res = await queryD1(
    `SELECT id, user_id, public_url, callback_token_hash, status, error_code,
            quota_debited, quota_refunded, input_json, engine, attempt,
            created_at, updated_at
     FROM nova_included_video_jobs
     WHERE id = ?
     LIMIT 1`,
    [jobId]
  );
  const row = d1Rows(res)[0];
  if (!row) return null;
  if (!safeEqualHex(tokenHash(callbackToken), row.callback_token_hash)) return null;
  return rowToJob(row);
}

export async function prepareFreeVideoJobRetry({
  jobId,
  callbackToken,
  publicUrl,
  engine,
}) {
  if (!jobId || !callbackToken || !publicUrl || !engine) return false;
  await ensureTable();

  const current = await getFreeVideoJobForCallback({ jobId, callbackToken });
  if (!current || current.status !== "processing") return false;

  await queryD1(
    `UPDATE nova_included_video_jobs
     SET public_url = ?,
         engine = ?,
         attempt = attempt + 1,
         error_code = NULL,
         updated_at = ?
     WHERE id = ? AND status = 'processing'`,
    [String(publicUrl), String(engine).slice(0, 80), nowSeconds(), jobId]
  );
  return true;
}

export async function markFreeVideoJobCompleted(jobId, publicUrl = "") {
  if (!jobId) return false;
  await ensureTable();
  if (publicUrl) {
    await queryD1(
      `UPDATE nova_included_video_jobs
       SET status = 'completed', public_url = ?, error_code = NULL, updated_at = ?
       WHERE id = ? AND status = 'processing'`,
      [String(publicUrl), nowSeconds(), jobId]
    );
  } else {
    await queryD1(
      `UPDATE nova_included_video_jobs
       SET status = 'completed', error_code = NULL, updated_at = ?
       WHERE id = ? AND status = 'processing'`,
      [nowSeconds(), jobId]
    );
  }
  return true;
}

export async function markFreeVideoJobFailed(jobId, errorCode = "GENERATION_FAILED") {
  if (!jobId) return { ok: false };
  await ensureTable();

  const res = await queryD1(
    `SELECT id, user_id, status, quota_debited, quota_refunded
     FROM nova_included_video_jobs WHERE id = ? LIMIT 1`,
    [jobId]
  );
  const row = d1Rows(res)[0];
  if (!row || String(row.status) !== "processing") return { ok: false };

  const shouldRefund =
    Number(row.quota_debited || 0) === 1 &&
    Number(row.quota_refunded || 0) !== 1;

  await queryD1(
    `UPDATE nova_included_video_jobs
     SET status = 'failed',
         error_code = ?,
         quota_refunded = ?,
         updated_at = ?
     WHERE id = ? AND status = 'processing'`,
    [String(errorCode || "GENERATION_FAILED").slice(0, 120), shouldRefund ? 1 : 0, nowSeconds(), jobId]
  );

  return {
    ok: true,
    userId: String(row.user_id),
    shouldRefund,
  };
}

export async function failStaleFreeVideoJob(jobId) {
  return markFreeVideoJobFailed(jobId, "JOB_TIMEOUT");
}

export async function finalizeFreeVideoJob({
  jobId,
  callbackToken,
  status,
  errorCode = null,
}) {
  if (!jobId || !callbackToken) return { ok: false, reason: "invalid" };
  if (!["completed", "failed"].includes(status)) return { ok: false, reason: "invalid_status" };
  await ensureTable();

  const res = await queryD1(
    `SELECT id, user_id, callback_token_hash, status, quota_debited, quota_refunded
     FROM nova_included_video_jobs
     WHERE id = ?
     LIMIT 1`,
    [jobId]
  );
  const row = d1Rows(res)[0];
  if (!row) return { ok: false, reason: "not_found" };

  if (!safeEqualHex(tokenHash(callbackToken), row.callback_token_hash)) {
    return { ok: false, reason: "unauthorized" };
  }

  if (String(row.status) !== "processing") {
    return {
      ok: true,
      duplicate: true,
      status: String(row.status),
      userId: String(row.user_id),
      quotaDebited: Number(row.quota_debited || 0) === 1,
      quotaRefunded: Number(row.quota_refunded || 0) === 1,
    };
  }

  const shouldRefund =
    status === "failed" &&
    Number(row.quota_debited || 0) === 1 &&
    Number(row.quota_refunded || 0) !== 1;

  await queryD1(
    `UPDATE nova_included_video_jobs
     SET status = ?,
         error_code = ?,
         quota_refunded = ?,
         updated_at = ?
     WHERE id = ? AND status = 'processing'`,
    [
      status,
      errorCode ? String(errorCode).slice(0, 120) : null,
      shouldRefund ? 1 : 0,
      nowSeconds(),
      jobId,
    ]
  );

  return {
    ok: true,
    duplicate: false,
    status,
    userId: String(row.user_id),
    quotaDebited: Number(row.quota_debited || 0) === 1,
    shouldRefund,
  };
}
