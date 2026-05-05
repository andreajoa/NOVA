type D1Response = {
  success?: boolean
  errors?: unknown[]
  result?: { results?: Record<string, unknown>[] }[]
  raw?: string
}

const CLOUDFLARE_BASE = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}`

export async function queryD1(sql: string, params: unknown[] = []): Promise<D1Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(`${CLOUDFLARE_BASE}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
      signal: controller.signal,
    })

    const text = await res.text()
    let json: D1Response = {}

    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { raw: text }
    }

    if (!res.ok) throw new Error(`D1 HTTP ${res.status}: ${text}`)

    const errors = json.errors ?? []
    if (Array.isArray(errors) && errors.length > 0) {
      throw new Error(`D1 query failed: ${JSON.stringify(errors)}`)
    }

    return json
  } finally {
    clearTimeout(timeout)
  }
}

export function d1Rows(response: D1Response): Record<string, unknown>[] {
  return response.result?.[0]?.results ?? []
}

export async function createUser(clerkId: string, email: string) {
  return queryD1(
    `INSERT OR IGNORE INTO users (id, email, clerk_id, plan, credits, created_at)
     VALUES (?, ?, ?, 'trial', 10, datetime('now'))`,
    [clerkId, email, clerkId]
  )
}

export async function saveProjectRow(data: {
  user_id: string
  title: string
  type: string
  r2_key: string
  mime_type: string
  url: string
}) {
  return queryD1(
    `INSERT INTO projects (user_id, title, status, r2_key, mime_type, r2_url, created_at)
     VALUES (?, ?, 'done', ?, ?, ?, unixepoch())`,
    [data.user_id, data.title, data.r2_key, data.mime_type, data.url]
  )
}

export async function getProjectsByUser(user_id: string) {
  return queryD1(
    `SELECT id, title, status, r2_url, mime_type, created_at
     FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
    [user_id]
  )
}

export async function deleteProjectById(id: string, user_id: string) {
  return queryD1(
    `DELETE FROM projects WHERE id = ? AND user_id = ?`,
    [id, user_id]
  )
}

export type ApiKeyRow = {
  id: string
  user_id: string
  name: string
  key_hash: string
  key_prefix: string
  key_suffix: string
  created_at: number
  last_used_at: number | null
  revoked_at: number | null
}

export async function listApiKeysByUser(userId: string) {
  const res = await queryD1(
    `SELECT id, user_id, name, key_prefix, key_suffix, created_at, last_used_at, revoked_at
     FROM api_keys
     WHERE user_id = ? AND revoked_at IS NULL
     ORDER BY created_at DESC`,
    [userId]
  )

  return d1Rows(res)
}

export async function createApiKeyRow(data: {
  id: string
  userId: string
  name: string
  keyHash: string
  keyPrefix: string
  keySuffix: string
}) {
  await queryD1(
    `INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, key_suffix, created_at)
     VALUES (?, ?, ?, ?, ?, ?, unixepoch())`,
    [data.id, data.userId, data.name, data.keyHash, data.keyPrefix, data.keySuffix]
  )

  const res = await queryD1(
    `SELECT id, user_id, name, key_prefix, key_suffix, created_at, last_used_at, revoked_at
     FROM api_keys
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [data.id, data.userId]
  )

  return d1Rows(res)[0] ?? null
}

export async function revokeApiKeyById(id: string, userId: string) {
  const existing = await queryD1(
    `SELECT id FROM api_keys WHERE id = ? AND user_id = ? AND revoked_at IS NULL LIMIT 1`,
    [id, userId]
  )

  const row = d1Rows(existing)[0]
  if (!row) return false

  await queryD1(
    `UPDATE api_keys SET revoked_at = unixepoch() WHERE id = ? AND user_id = ?`,
    [id, userId]
  )

  return true
}

export async function findApiKeyByHash(keyHash: string) {
  const res = await queryD1(
    `SELECT id, user_id, name, key_hash, key_prefix, key_suffix, created_at, last_used_at, revoked_at
     FROM api_keys
     WHERE key_hash = ? AND revoked_at IS NULL
     LIMIT 1`,
    [keyHash]
  )

  return d1Rows(res)[0] ?? null
}

export async function touchApiKeyLastUsed(id: string) {
  return queryD1(
    `UPDATE api_keys SET last_used_at = unixepoch() WHERE id = ?`,
    [id]
  )
}

export async function ensureUserGenerationAccount(userId: string) {
  const existing = await queryD1(
    `SELECT id, clerk_id, plan, credits
     FROM users
     WHERE id = ? OR clerk_id = ?
     LIMIT 1`,
    [userId, userId]
  )

  const row = d1Rows(existing)[0]

  if (row) {
    return {
      id: String(row.id ?? userId),
      userId,
      plan: String(row.plan ?? 'trial'),
      credits: Number(row.credits ?? 0),
    }
  }

  await queryD1(
    `INSERT OR IGNORE INTO users (id, email, clerk_id, plan, credits, created_at)
     VALUES (?, ?, ?, 'trial', 10, datetime('now'))`,
    [userId, '', userId]
  )

  return {
    id: userId,
    userId,
    plan: 'trial',
    credits: 10,
  }
}

export async function debitGenerationCredits(userId: string, amount: number) {
  const account = await ensureUserGenerationAccount(userId)

  if (account.credits < amount) {
    return {
      ok: false,
      plan: account.plan,
      currentCredits: account.credits,
      requiredCredits: amount,
      remainingCredits: account.credits,
    }
  }

  await queryD1(
    `UPDATE users
     SET credits = credits - ?
     WHERE (id = ? OR clerk_id = ?) AND credits >= ?`,
    [amount, userId, userId, amount]
  )

  return {
    ok: true,
    plan: account.plan,
    currentCredits: account.credits,
    requiredCredits: amount,
    remainingCredits: account.credits - amount,
  }
}

