import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPresignedUploadUrl } from '@/lib/r2'

const ALLOWED_TYPES = [
  'image/jpeg','image/png','image/webp','image/gif',
  'video/mp4','video/quicktime','video/webm','video/x-msvideo',
]
const MAX_SIZE_MB = 500
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename, contentType, title, fileSize } = await req.json()

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: `Tipo não permitido: ${contentType}. Use imagem ou vídeo.` }, { status: 400 })
  }

  if (fileSize && fileSize > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: `Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.` }, { status: 400 })
  }

  const ext = filename.split('.').pop() || 'bin'
  const key = `users/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType)

  return NextResponse.json({ uploadUrl, publicUrl, key, userId, title })
}
