"use client"

import { useRef, useState } from "react"

export default function BrandKitUpload() {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setMessage("Selecione um arquivo primeiro."); return }

    setLoading(true)
    setMessage("")
    setProgress(0)

    try {
      // Passo 1 — pede presigned URL
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, title: title || file.name }),
      })
      if (!res.ok) throw new Error(`Erro ao obter URL: ${res.status}`)
      const { uploadUrl, publicUrl, key } = await res.json()

      // Passo 2 — PUT direto para R2
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`R2 falhou: ${xhr.status}`))
        xhr.onerror = () => reject(new Error("Erro de rede"))
        xhr.open("PUT", uploadUrl)
        xhr.setRequestHeader("Content-Type", file.type)
        xhr.send(file)
      })

      // Passo 3 — salva no D1
      const saveRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, publicUrl, title: title || file.name, mimeType: file.type, fileSize: file.size }),
      })
      if (!saveRes.ok) throw new Error(`Erro ao salvar: ${saveRes.status}`)

      setMessage("Upload feito com sucesso.")
      setFile(null)
      setTitle("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      setMessage(err.message || "Erro ao enviar arquivo.")
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-black uppercase">Upload Assets</h1>
        <p className="mb-8 text-white/60">Envie uma imagem ou vídeo para salvar no seu dashboard.</p>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Título</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Produto hero, imagem relógio, vídeo UGC..."
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Arquivo</label>
            <input ref={fileInputRef} type="file" accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-lime-300 file:px-4 file:py-2 file:font-semibold file:text-black hover:file:bg-lime-200" />
          </div>

          {file && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              Arquivo selecionado: {file.name}
            </div>
          )}

          {loading && progress > 0 && (
            <div>
              <p className="mb-1 text-sm text-white/60">Enviando... {progress}%</p>
              <div className="overflow-hidden rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-lime-300 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-black transition hover:bg-lime-200 disabled:opacity-50">
            {loading ? `Enviando${progress > 0 ? ` ${progress}%` : "..."}` : "Fazer upload"}
          </button>

          {message && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">{message}</div>
          )}
        </form>
      </div>
    </main>
  )
}
