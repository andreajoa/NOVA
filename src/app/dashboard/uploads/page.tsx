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
  if (!url) return <div className="flex h-56 items-center justify-center bg-white/5 text-white/40">Sem preview</div>
  if (mimeType?.startsWith("video/")) return <video src={url} controls className="h-56 w-full object-cover" />
  return <img src={url} alt={title} className="h-56 w-full object-cover" />
}

export default function UploadsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadProjects() {
    setLoading(true)
    try {
      const res = await fetch("/api/projects", { cache: "no-store" })
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error("Erro ao carregar projetos:", error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" })
        const data = await res.json()
        if (mounted) setProjects(data.projects || [])
      } catch (error) {
        console.error("Erro ao carregar projetos:", error)
        if (mounted) setProjects([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress(0)
    setStatusMsg("Obtendo URL de upload...")

    try {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, title: file.name.split(".")[0] }),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`upload-url falhou ${res.status}: ${txt}`)
      }

      const json = await res.json()
      const { uploadUrl, publicUrl, key, title } = json

      if (!uploadUrl) throw new Error("uploadUrl não veio na resposta")

      setStatusMsg("Uploading to R2...")

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status < 300) resolve()
          else reject(new Error(`R2 PUT falhou: ${xhr.status} ${xhr.responseText}`))
        }
        xhr.onerror = () => reject(new Error("Erro de rede no XHR para R2"))
        xhr.open("PUT", uploadUrl)
        xhr.setRequestHeader("Content-Type", file.type)
        xhr.send(file)
      })

      setStatusMsg("Salvando no banco...")

      const saveRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, publicUrl, title, mimeType: file.type, fileSize: file.size }),
      })

      if (!saveRes.ok) {
        const txt = await saveRes.text()
        throw new Error(`Salvar no D1 falhou ${saveRes.status}: ${txt}`)
      }

      setStatusMsg("Upload concluído!")
      await loadProjects()
    } catch (err) {
      console.error("Erro no upload:", err)
      alert("Erro: " + (err as Error).message)
    } finally {
      setUploading(false)
      setProgress(0)
      setStatusMsg("")
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
    if (res.ok) setProjects((prev) => prev.filter((item) => item.id !== id))
    else alert("Erro ao excluir upload")
    setDeletingId(null)
  }

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Uploads</h1>
          <label className="cursor-pointer rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-black transition hover:bg-yellow-300">
            {uploading ? `${statusMsg} ${progress > 0 ? progress + "%" : ""}` : "+ Novo Upload"}
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {uploading && (
          <div className="mb-4">
            <p className="mb-2 text-sm text-white/60">{statusMsg}</p>
            <div className="overflow-hidden rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-yellow-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-white/60">Carregando...</p>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/60">Nenhum upload ainda.</div>
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
