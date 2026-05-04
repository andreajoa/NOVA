export async function saveProjectRow(data: {
  user_id: string
  title: string
  type: string
  r2_key: string
  mime_type: string
  url: string
}) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `INSERT INTO projects (user_id, title, status, r2_key, mime_type, r2_url, created_at)
              VALUES (?, ?, 'done', ?, ?, ?, unixepoch())`,
        params: [data.user_id, data.title, data.r2_key, data.mime_type, data.url],
      }),
    }
  )

  const text = await res.text()
  let json = {}
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }

  if (!res.ok) {
    throw new Error(`D1 HTTP ${res.status}: ${text}`)
  }

  const success = json?.success ?? true
  const errors = json?.errors ?? []

  if (!success || (Array.isArray(errors) && errors.length > 0)) {
    throw new Error(`D1 query failed: ${JSON.stringify(json)}`)
  }

  return json
}
