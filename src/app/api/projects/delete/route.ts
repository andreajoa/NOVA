import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { r2 } from "@/lib/r2"

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const lookupRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql: "SELECT id, r2_key FROM projects WHERE id = ? AND user_id = ? LIMIT 1",
        params: [id, userId],
      }),
    }
  )

  const lookupData = await lookupRes.json()
  const row = lookupData?.result?.[0]?.results?.[0]

  if (!row) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  if (row.r2_key) {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: row.r2_key,
      })
    )
  }

  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql: "DELETE FROM projects WHERE id = ? AND user_id = ?",
        params: [id, userId],
      }),
    }
  )

  return NextResponse.json({ success: true })
}
