type D1Response = {
  success?: boolean
  errors?: unknown[]
  result?: unknown
  raw?: string
}

const CLOUDFLARE_BASE = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}`

async function queryD1(sql: string, params: unknown[] = []): Promise<D1Response> {
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
    try { json = text ? JSON.parse(text) : {} } catch { json = { raw: text } }

    if (!res.ok) throw new Error(`D1 HTTP ${res.status}: ${text}`)

    const errors = json.errors ?? []
    if (Array.isArray(errors) && errors.length > 0) throw new Error(`D1 query failed: ${JSON.stringify(errors)}`)

    return json
  } finally {
    clearTimeout(timeout)
  }
}

export async function createUser(clerkId: string, email: string) {
  return queryD1(
    `INSERT OR IGNORE INTO users (id, email, clerk_id, plan, credits, created_at)
     VALUES (?, ?, ?, 'free', 10, datetime('now'))`,
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
