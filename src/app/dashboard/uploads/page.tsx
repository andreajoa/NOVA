"use client"

import { useEffect, useState } from "react"

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
    return (
      <video
        src={url}
        controls
        className="h-56 w-full object-cover"
      />
    )
  }

  return (
    <img
      src={url}
      alt={title}
      className="h-56 w-full object-cover"
    />
  )
}

export default function UploadsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function loadProjects() {
    setLoading(true)
    const res = await fetch("/api/projects")
    const data = await res.json()
    setProjects(data.projects || [])
    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  async function handleDelete(id: number) {
    const ok = window.confirm("Excluir este upload?")
    if (!ok) return

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
        <h1 className="mb-6 text-3xl font-bold">Uploads</h1>

        {loading ? (
          <p className="text-white/60">Carregando...</p>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/60">
            Nenhum upload ainda.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <MediaPreview
                  url={item.r2_url}
                  mimeType={item.mime_type}
                  title={item.title}
                />

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
