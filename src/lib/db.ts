export async function saveProjectRow(data: {
  id: string
  user_id: string
  title: string
  type: string
  r2_key: string
  mime_type: string
  url: string
}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      queries: [
        {
          sql: `INSERT INTO projects (id, user_id, title, status, r2_url, created_at) VALUES (?, ?, ?, 'done', ?, datetime('now'))`,
          params: [data.id, data.user_id, data.title, data.url],
        },
      ],
    }),
  })
  return res.json()
}
