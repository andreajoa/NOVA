import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { revokeUserApiKey } from "@/lib/apiKeys"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const revoked = await revokeUserApiKey(id, userId)

  if (!revoked) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
