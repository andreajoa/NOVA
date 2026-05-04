import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql: "SELECT id, user_id, title, status, r2_key, mime_type, r2_url, created_at FROM projects WHERE user_id = ? ORDER BY created_at DESC",
        params: [userId],
      }),
    }
  )

  const data = await res.json()
  const rows = data?.result?.[0]?.results ?? []

  return NextResponse.json({ projects: rows })
}
