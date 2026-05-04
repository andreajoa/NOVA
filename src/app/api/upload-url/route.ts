import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPresignedUploadUrl } from '@/lib/r2'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename, contentType, title } = await req.json()
  const ext = filename.split('.').pop() || 'bin'
  const key = `users/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`

  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType)

  return NextResponse.json({ uploadUrl, publicUrl, key, userId, title })
}
