"use client"

import { useEffect, useRef, useState } from "react"

type Project = {
  id: number
  title: string
  status: string
  r2_url?: string
  mime_type?: string
  created_at?: number
}

function MediaPreview({ url, mimeType, title }: { url?: string; mimeType?: string; title: string }) {
  if (!url) {
    return (
      <div className="flex h-56 items-center justify-center bg-white/5 text-white/40">
        Sem preview
      </div>
    )
  }
  if (mimeType?.startsWith("video/")) {
    return <video src={url} controls className="h-56 w-full object-cover" />
  }
  return <img src={url} alt={title} className="h-56 w-full object-cover" />
}

export default function UploadsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadProjects() {
    setLoading(true)
    const res = await fetch("/api/projects")
    const data = await res.json()
    setProjects(data.projects || [])
    setLoading(false)
  }

  useEffect(() => { loadProjects() }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress(0)

    try {
      // 1. Pede a presigned URL
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          title: file.name.split(".")[0],
        }),
      })
      const { uploadUrl, publicUrl, key, userId, title } = await res.json()

      // 2. Faz upload direto para o R2
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))
        xhr.onerror = () => reject(new Error("Upload error"))
        xhr.open("PUT", uploadUrl)
        xhr.setRequestHeader("Content-Type", file.type)
        xhr.send(file)
      })

      // 3. Salva no D1
      await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          publicUrl,
          title,
          mimeType: file.type,
          fileSize: file.size,
        }),
      })

      await loadProjects()
    } catch (err) {
      alert("Erro no upload: " + (err as Error).message)
    } finally {
      setUploading(false)
      setProgress(0)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Excluir este upload?")) return
    setDeletingId(id)
    const res = await fetch("/api/projects/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setProjects((prev) => prev.filter((item) => item.id !== id))
    } else {
      alert("Erro ao excluir upload")
    }
    setDeletingId(null)
  }

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Uploads</h1>
          <label className="cursor-pointer rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-black transition hover:bg-yellow-300">
            {uploading ? `Enviando ${progress}%...` : "+ Novo Upload"}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {uploading && (
          <div className="mb-6 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-yellow-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {loading ? (
          <p className="text-white/60">Carregando...</p>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/60">
            Nenhum upload ainda.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <MediaPreview url={item.r2_url} mimeType={item.mime_type} title={item.title} />
                <div className="space-y-3 p-4">
                  <div>
                    <h2 className="text-lg font-semibold">{item.title || "Sem título"}</h2>
                    <p className="text-sm text-white/50">{item.status}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                  >
                    {deletingId === item.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
