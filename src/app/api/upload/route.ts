import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { uploadToR2 } from '@/lib/r2'
import { saveProjectRow } from '@/lib/db'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const type = (form.get('type') as string) || 'image'
  const title = (form.get('title') as string) || 'Untitled'

  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop() || 'bin'
  const key = `users/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`
  const url = await uploadToR2(key, buf, file.type || 'application/octet-stream')
  const id = crypto.randomUUID()

  await saveProjectRow({
    id,
    user_id: userId,
    title,
    type,
    r2_key: key,
    mime_type: file.type || 'application/octet-stream',
    url,
  })

  return NextResponse.json({ ok: true, id, userId, title, type, key, url })
}
