'use client'

import { useEffect, useState } from 'react'

export default function UploadsPage() {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function loadItems() {
    const res = await fetch('/api/projects')
    const data = await res.json()
    const rows = data?.result?.[0]?.results || []
    setItems(rows)
  }

  useEffect(() => {
    loadItems()
  }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)

    const form = new FormData()
    form.append('title', title || file.name)
    form.append('type', file.type.startsWith('video/') ? 'video' : 'image')
    form.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: form,
    })

    setLoading(false)
    if (res.ok) {
      setTitle('')
      setFile(null)
      await loadItems()
      alert('Upload concluído')
    } else {
      alert('Erro no upload')
    }
  }

  return (
    <div style={{ padding: '120px 24px 40px', color: '#fff', background: '#050505', minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Uploads</h1>

        <form onSubmit={handleUpload} style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
            style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: '#111', color: '#fff' }}
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: '#111', color: '#fff' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '14px 16px', borderRadius: 10, border: 'none', background: '#D7FF00', color: '#000', fontWeight: 900 }}
          >
            {loading ? 'Uploading...' : 'Upload file'}
          </button>
        </form>

        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} style={{ padding: 16, borderRadius: 12, background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 700 }}>{item.title}</div>
              <div style={{ opacity: 0.65, fontSize: 14, marginTop: 4 }}>{item.created_at}</div>
              <a
                href={item.r2_url}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', marginTop: 10, color: '#D7FF00', textDecoration: 'none' }}
              >
                Open file
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
