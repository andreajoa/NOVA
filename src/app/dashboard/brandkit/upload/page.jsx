"use client"

import { useRef, useState } from "react"

const MAX_MB = 500
const ALLOWED = ['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/quicktime','video/webm','video/x-msvideo']

function generateVideoThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    const url = URL.createObjectURL(file)
    video.src = url
    video.currentTime = 1
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 360
      canvas.getContext('2d').drawImage(video, 0, 0, 640, 360)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8)
    }
    video.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
  })
}

export default function BrandKitUpload() {
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null
    setError(""); setSuccess(""); setPreview(null)
    if (!f) { setFile(null); return }

    if (!ALLOWED.includes(f.type)) {
      setError(`Tipo não permitido. Use JPG, PNG, WEBP, GIF, MP4, MOV ou WEBM.`)
      setFile(null); return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo ${MAX_MB}MB.`)
      setFile(null); return
    }

    setFile(f)
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setError("Selecione um arquivo primeiro."); return }

    setLoading(true); setError(""); setSuccess(""); setProgress(0)

    try {
      setStatusMsg("Validando arquivo...")
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, title: title || file.name, fileSize: file.size }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Erro ${res.status}`)
      const { uploadUrl, publicUrl, key } = json

      setStatusMsg("Uploading file...")
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload falhou: ${xhr.status}`))
        xhr.onerror = () => reject(new Error("Erro de rede"))
        xhr.open("PUT", uploadUrl)
        xhr.setRequestHeader("Content-Type", file.type)
        xhr.send(file)
      })

      let thumbnailUrl = null
      if (file.type.startsWith('video/')) {
        setStatusMsg("Generating thumbnail...")
        const thumbBlob = await generateVideoThumbnail(file)
        if (thumbBlob) {
          const thumbRes = await fetch("/api/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: `${key}_thumb.jpg`, contentType: 'image/jpeg', title: 'thumbnail', fileSize: thumbBlob.size }),
          })
          if (thumbRes.ok) {
            const { uploadUrl: thumbUploadUrl, publicUrl: thumbPublicUrl } = await thumbRes.json()
            await fetch(thumbUploadUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: thumbBlob })
            thumbnailUrl = thumbPublicUrl
          }
        }
      }

      setStatusMsg("Salvando no banco...")
      const saveRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, publicUrl: thumbnailUrl || publicUrl, title: title || file.name, mimeType: file.type, fileSize: file.size }),
      })
      if (!saveRes.ok) throw new Error(`Erro ao salvar: ${saveRes.status}`)

      setSuccess("Upload feito com sucesso!")
      setFile(null); setTitle(""); setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      setError(err.message || "Erro ao enviar arquivo.")
    } finally {
      setLoading(false); setProgress(0); setStatusMsg("")
    }
  }

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-black uppercase">Upload Assets</h1>
        <p className="mb-8 text-white/60">Imagens e vídeos até {MAX_MB}MB. JPG, PNG, WEBP, GIF, MP4, MOV, WEBM.</p>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Título</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Produto hero, vídeo UGC..."
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Arquivo</label>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange}
              className="block w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-lime-300 file:px-4 file:py-2 file:font-semibold file:text-black hover:file:bg-lime-200" />
          </div>

          {preview && <img src={preview} alt="preview" className="w-full rounded-xl object-cover max-h-48" />}

          {file && !preview && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              📹 {file.name} — {(file.size / 1024 / 1024).toFixed(1)}MB
            </div>
          )}

          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">⚠ {error}</div>}
          {success && <div className="rounded-xl border border-lime-500/30 bg-lime-500/10 p-4 text-sm text-lime-400">✓ {success}</div>}

          {loading && (
            <div>
              <p className="mb-1 text-sm text-white/60">{statusMsg} {progress > 0 ? `${progress}%` : ""}</p>
              <div className="overflow-hidden rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-lime-300 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || !file}
            className="w-full rounded-xl bg-lime-300 px-5 py-3 font-bold text-black transition hover:bg-lime-200 disabled:opacity-40">
            {loading ? `${statusMsg}${progress > 0 ? ` ${progress}%` : ""}` : "Fazer upload"}
          </button>
        </form>
      </div>
    </main>
  )
}
