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

export const PLAN_CONFIG: Record<string, {
  credits: number
  imageUnlimited: boolean
  imageMonthlyLimit: number | null
}> = {
  trial:    { credits: 10,     imageUnlimited: false, imageMonthlyLimit: 10   },
  basic:    { credits: 70,     imageUnlimited: false, imageMonthlyLimit: null },
  plus:     { credits: 500,    imageUnlimited: false, imageMonthlyLimit: null },
  ultra:    { credits: 3000,   imageUnlimited: true,  imageMonthlyLimit: null },
  business: { credits: 3000,   imageUnlimited: true,  imageMonthlyLimit: null },
  admin:    { credits: 999999, imageUnlimited: true,  imageMonthlyLimit: null },
}

export async function createUser(clerkId: string, email: string) {
  return queryD1(
    `INSERT OR IGNORE INTO users (id, email, clerk_id, plan, credits, image_gens_used, created_at)
     VALUES (?, ?, ?, 'trial', 10, 0, datetime('now'))`,
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
     FROM api_keys WHERE user_id = ? AND revoked_at IS NULL ORDER BY created_at DESC`,
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
     FROM api_keys WHERE id = ? AND user_id = ? LIMIT 1`,
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
     FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL LIMIT 1`,
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
    `SELECT id, clerk_id, plan, credits, image_gens_used
     FROM users WHERE id = ? OR clerk_id = ? LIMIT 1`,
    [userId, userId]
  )
  const row = d1Rows(existing)[0]

  if (row) {
    const plan = String(row.plan ?? 'trial')
    const planConfig = PLAN_CONFIG[plan] ?? PLAN_CONFIG.trial
    return {
      id: String(row.id ?? userId),
      userId,
      plan,
      credits: Number(row.credits ?? 0),
      imageUnlimited: planConfig.imageUnlimited,
      imageMonthlyLimit: planConfig.imageMonthlyLimit,
      imageGensUsed: Number(row.image_gens_used ?? 0),
    }
  }

  await queryD1(
    `INSERT OR IGNORE INTO users (id, email, clerk_id, plan, credits, image_gens_used, created_at)
     VALUES (?, ?, ?, 'trial', 10, 0, datetime('now'))`,
    [userId, '', userId]
  )

  return {
    id: userId,
    userId,
    plan: 'trial',
    credits: 10,
    imageUnlimited: false,
    imageMonthlyLimit: 10,
    imageGensUsed: 0,
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
    `UPDATE users SET credits = credits - ?
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

export async function checkAndDebitImageGen(userId: string): Promise<{
  ok: boolean
  reason?: string
  imageUnlimited: boolean
  imageGensUsed: number
  imageMonthlyLimit: number | null
}> {
  const account = await ensureUserGenerationAccount(userId)

  if (account.imageUnlimited) {
    return {
      ok: true,
      imageUnlimited: true,
      imageGensUsed: account.imageGensUsed,
      imageMonthlyLimit: null,
    }
  }

  const limit = account.imageMonthlyLimit ?? 10
  if (account.imageGensUsed >= limit) {
    return {
      ok: false,
      reason: 'trial_image_limit_reached',
      imageUnlimited: false,
      imageGensUsed: account.imageGensUsed,
      imageMonthlyLimit: limit,
    }
  }

  await queryD1(
    `UPDATE users SET image_gens_used = image_gens_used + 1
     WHERE id = ? OR clerk_id = ?`,
    [userId, userId]
  )

  return {
    ok: true,
    imageUnlimited: false,
    imageGensUsed: account.imageGensUsed + 1,
    imageMonthlyLimit: limit,
  }
}

export async function ensureApiCreditWallet(userId: string) {
  const existing = await queryD1(
    `SELECT id, user_id, balance, created_at, updated_at
     FROM api_credit_wallets WHERE user_id = ? LIMIT 1`,
    [userId]
  )
  const row = d1Rows(existing)[0]

  if (row) {
    return {
      id: String(row.id),
      userId: String(row.user_id),
      balance: Number(row.balance ?? 0),
      createdAt: Number(row.created_at ?? 0),
      updatedAt: Number(row.updated_at ?? 0),
    }
  }

  const id = globalThis.crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  await queryD1(
    `INSERT OR IGNORE INTO api_credit_wallets (id, user_id, balance, created_at, updated_at)
     VALUES (?, ?, 0, ?, ?)`,
    [id, userId, now, now]
  )

  const created = await queryD1(
    `SELECT id, user_id, balance, created_at, updated_at
     FROM api_credit_wallets WHERE user_id = ? LIMIT 1`,
    [userId]
  )
  const createdRow = d1Rows(created)[0]

  return {
    id: String(createdRow.id),
    userId: String(createdRow.user_id),
    balance: Number(createdRow.balance ?? 0),
    createdAt: Number(createdRow.created_at ?? 0),
    updatedAt: Number(createdRow.updated_at ?? 0),
  }
}

export async function getApiCreditBalance(userId: string) {
  const wallet = await ensureApiCreditWallet(userId)
  return { userId, balance: wallet.balance }
}

export async function addApiCredits(data: {
  userId: string
  amount: number
  pack: string
  stripeSessionId?: string
}) {
  await ensureApiCreditWallet(data.userId)

  if (data.stripeSessionId) {
    const existing = await queryD1(
      `SELECT id FROM api_credit_transactions WHERE stripe_session_id = ? LIMIT 1`,
      [data.stripeSessionId]
    )
    if (d1Rows(existing)[0]) return getApiCreditBalance(data.userId)
  }

  const now = Math.floor(Date.now() / 1000)

  await queryD1(
    `UPDATE api_credit_wallets SET balance = balance + ?, updated_at = ? WHERE user_id = ?`,
    [data.amount, now, data.userId]
  )

  await queryD1(
    `INSERT OR IGNORE INTO api_credit_transactions
      (id, user_id, amount, type, reason, pack, stripe_session_id, created_at)
     VALUES (?, ?, ?, 'purchase', 'stripe_checkout', ?, ?, ?)`,
    [globalThis.crypto.randomUUID(), data.userId, data.amount, data.pack, data.stripeSessionId ?? null, now]
  )

  return getApiCreditBalance(data.userId)
}

export async function debitApiCredits(data: {
  userId: string
  amount: number
  apiKeyId?: string
  reason?: string
}) {
  const wallet = await ensureApiCreditWallet(data.userId)

  if (wallet.balance < data.amount) {
    return {
      ok: false,
      currentBalance: wallet.balance,
      requiredCredits: data.amount,
      remainingBalance: wallet.balance,
    }
  }

  const now = Math.floor(Date.now() / 1000)

  await queryD1(
    `UPDATE api_credit_wallets SET balance = balance - ?, updated_at = ?
     WHERE user_id = ? AND balance >= ?`,
    [data.amount, now, data.userId, data.amount]
  )

  await queryD1(
    `INSERT INTO api_credit_transactions
      (id, user_id, amount, type, reason, api_key_id, created_at)
     VALUES (?, ?, ?, 'debit', ?, ?, ?)`,
    [globalThis.crypto.randomUUID(), data.userId, -Math.abs(data.amount), data.reason ?? 'api_generation', data.apiKeyId ?? null, now]
  )

  const updated = await getApiCreditBalance(data.userId)

  return {
    ok: true,
    currentBalance: wallet.balance,
    requiredCredits: data.amount,
    remainingBalance: updated.balance,
  }
}

export async function activatePlanSubscription(data: {
  userId: string
  plan: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  billingInterval: string
}) {
  await ensureUserGenerationAccount(data.userId)

  const planKey = data.plan.toLowerCase()
  const config = PLAN_CONFIG[planKey] ?? PLAN_CONFIG.basic
  const credits = config.credits

  return queryD1(
    `UPDATE users
     SET plan = ?,
         credits = CASE WHEN credits < ? THEN ? ELSE credits END,
         image_gens_used = 0,
         stripe_customer_id = ?,
         stripe_subscription_id = ?,
         billing_interval = ?,
         subscription_status = 'active'
     WHERE id = ? OR clerk_id = ?`,
    [planKey, credits, credits, data.stripeCustomerId, data.stripeSubscriptionId, data.billingInterval, data.userId, data.userId]
  )
}

export async function activateBasicSubscription(data: {
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  billingInterval: string
}) {
  return activatePlanSubscription({ ...data, plan: 'basic' })
}

export async function isAdminUser(clerkId: string): Promise<boolean> {
  try {
    const res = await queryD1(`SELECT role FROM users WHERE clerk_id = ? LIMIT 1`, [clerkId])
    const rows = d1Rows(res)
    return rows[0]?.role === 'admin'
  } catch {
    return false
  }
}

export async function setAdminRole(clerkId: string): Promise<void> {
  await queryD1(
    `UPDATE users SET role = 'admin', credits = 999999, plan = 'admin', image_gens_used = 0 WHERE clerk_id = ?`,
    [clerkId]
  )
}
