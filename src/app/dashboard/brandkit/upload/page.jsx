"use client"

import { useRef, useState } from "react"

export default function BrandKitUpload() {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()

    if (!file) {
      setMessage("Selecione um arquivo primeiro.")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title || file.name)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const text = await res.text()
      let data = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = {}
      }

      if (!res.ok) {
        throw new Error(data?.error || text || "Erro no upload")
      }

      setMessage("Upload feito com sucesso.")
      setFile(null)
      setTitle("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      setMessage(err.message || "Erro ao enviar arquivo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-black uppercase">Upload Assets</h1>
        <p className="mb-8 text-white/60">
          Envie uma imagem ou vídeo para salvar no seu dashboard.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Produto hero, imagem relógio, vídeo UGC..."
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Arquivo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-lime-300 file:px-4 file:py-2 file:font-semibold file:text-black hover:file:bg-lime-200"
            />
          </div>

          {file && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              Arquivo selecionado: {file.name}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-lime-300 px-5 py-3 font-bold text-black transition hover:bg-lime-200 disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Fazer upload"}
          </button>

          {message && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              {message}
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
