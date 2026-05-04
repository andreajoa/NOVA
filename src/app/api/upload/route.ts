import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { uploadToR2 } from '@/lib/r2'
import { saveProjectRow } from '@/lib/db'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const { key, publicUrl, title, mimeType } = await req.json()
      await saveProjectRow({
        user_id: userId,
        title: title || 'Untitled',
        type: mimeType?.startsWith('video/') ? 'video' : 'image',
        r2_key: key,
        mime_type: mimeType,
        url: publicUrl,
      })
      return NextResponse.json({ ok: true })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    const type = (form.get('type') as string) || 'image'
    const title = (form.get('title') as string) || 'Untitled'

    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'bin'
    const key = `users/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`
    const url = await uploadToR2(key, buf, file.type || 'application/octet-stream')

    await saveProjectRow({
      user_id: userId,
      title,
      type,
      r2_key: key,
      mime_type: file.type || 'application/octet-stream',
      url,
    })

    return NextResponse.json({ ok: true, url })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
