"use client";
import { useState, useRef } from "react";
import Link from "next/link";
const UPGRADE_CODES = ["INSUFFICIENT_CREDITS"];
function UpgradeBanner({ data, onDismiss }) {
  return (
    <div className="mt-5 rounded-[2rem] border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-5">
      <p className="text-xs font-black uppercase text-[#D7FF00]">Upgrade necessario</p>
      <h3 className="mt-2 text-2xl font-black uppercase text-white">{data?.message || "Saldo insuficiente."}</h3>
      <div className="mt-5 flex gap-3">
        <Link href="/pricing" className="rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase text-black no-underline">Ver planos</Link>
        <button onClick={onDismiss} className="rounded-xl border border-white/15 px-5 py-3 text-xs font-black uppercase text-white/50">Fechar</button>
      </div>
    </div>
  );
}
async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", file.type.startsWith("audio/") ? "audio" : "image");
  fd.append("title", file.name);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Upload failed");
  const url = data?.url || data?.publicUrl || data?.fileUrl;
  if (!url) throw new Error("Sem URL.");
  return url;
}
export default function TalkingAvatarPage() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [script, setScript] = useState("");
  const [prompt, setPrompt] = useState("Natural talking head video, realistic facial expressions.");
  const [modelId, setModelId] = useState("wan-2-2-speech");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [upgradeOffer, setUpgradeOffer] = useState(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);
  function handleImageChange(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setImageFile(file); setImagePreview(URL.createObjectURL(file)); setImageUrl(""); setResult(null); setError("");
  }
  function handleAudioChange(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setAudioFile(file); setAudioUrl("");
  }
  async function handleSubmit() {
    if (!imageFile && !imageUrl) { setError("Adicione uma foto."); return; }
    if (!script.trim() && !audioFile && !audioUrl.trim()) { setError("Adicione script ou audio."); return; }
    setLoading(true); setError(""); setResult(null); setUpgradeOffer(null);
    try {
      let fi = imageUrl.trim(); let fa = audioUrl.trim();
      if (imageFile && !fi) { setStatus("Enviando imagem..."); fi = await uploadFile(imageFile); }
      if (audioFile && !fa) { setStatus("Enviando audio..."); fa = await uploadFile(audioFile); }
      setStatus("Gerando...");
      const res = await fetch("/api/talking-avatar/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: fi, audioUrl: fa, script: fa ? "" : script, prompt, modelId, seconds: 5 }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402 || UPGRADE_CODES.includes(data?.code)) { setUpgradeOffer(data); return; }
      if (!res.ok || !data?.success) throw new Error(data?.message || "Falha.");
      setResult(data); window.dispatchEvent(new Event("nova:credits-refresh"));
    } catch (err) { setError(err?.message || "Falha."); }
    finally { setLoading(false); setStatus(""); }
  }
  return (
    <main className="min-h-screen bg-[#020303] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-xs font-black uppercase text-white/35 no-underline hover:text-white">Dashboard</Link>
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#070707] p-6 md:p-10">
          <p className="text-xs font-black uppercase text-[#D7FF00]">NOVA Advanced Media</p>
          <h1 className="mt-4 text-5xl font-black uppercase md:text-7xl">Talking Avatar</h1>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-[#070707] p-6">
            <p className="text-xs font-black uppercase text-[#D7FF00]">1. Foto do avatar</p>
            <div onClick={() => imageInputRef.current?.click()} className="mt-4 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 hover:border-[#D7FF00]/40">
              {imagePreview ? <img src={imagePreview} alt="Avatar" className="max-h-[160px] w-full rounded-2xl object-cover" /> : <p className="text-xs text-white/35">Clique para enviar foto JPG PNG WEBP</p>}
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {imagePreview && <button onClick={() => { setImageFile(null); setImagePreview(""); setImageUrl(""); }} className="mt-2 text-xs font-black uppercase text-white/30 hover:text-white">remover</button>}
            <p className="mt-4 text-[10px] font-black uppercase text-white/35">Ou URL</p>
            <input value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); setImagePreview(""); }} placeholder="https://..." className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none" />
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-[#070707] p-6">
            <p className="text-xs font-black uppercase text-[#D7FF00]">2. Audio ou script</p>
            <p className="mt-4 text-[10px] font-black uppercase text-white/35">Script</p>
            <textarea value={script} onChange={(e) => { setScript(e.target.value); setAudioFile(null); setAudioUrl(""); }} placeholder="O que o avatar deve falar..." rows={4} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none" />
            <p className="mt-4 text-[10px] font-black uppercase text-white/35">Arquivo de audio</p>
            <button onClick={() => audioInputRef.current?.click()} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-left text-sm text-white/50 hover:text-white">
              {audioFile ? ("Selecionado: " + audioFile.name) : "Clique para enviar MP3 WAV M4A"}
            </button>
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioChange} />
            <p className="mt-4 text-[10px] font-black uppercase text-white/35">Ou URL de audio</p>
            <input value={audioUrl} onChange={(e) => { setAudioUrl(e.target.value); setAudioFile(null); }} placeholder="https://.../voice.mp3" className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none" />
          </div>
        </div>
        <div className="mt-5 rounded-[2rem] border border-white/10 bg-[#070707] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none">
              <option value="wan-2-2-speech">Wan 2.2 Speech to Video</option>
              <option value="sync-lipsync-v2">Sync Lipsync v2</option>
              <option value="kling-lipsync">Kling LipSync</option>
            </select>
            <button onClick={handleSubmit} disabled={loading} className="min-h-14 rounded-2xl bg-[#D7FF00] px-8 py-4 text-sm font-black uppercase text-black disabled:opacity-45">
              {loading ? (status || "Gerando...") : "Gerar Talking Avatar"}
            </button>
          </div>
          {error && !upgradeOffer && <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">{error}</div>}
        </div>
        {upgradeOffer && <UpgradeBanner data={upgradeOffer} onDismiss={() => setUpgradeOffer(null)} />}
        {result && (
          <div className="mt-5 rounded-[2rem] border border-white/10 bg-[#070707] p-6">
            <p className="text-xs font-black uppercase text-[#D7FF00]">Resultado</p>
            {result.audioUrl && <audio src={result.audioUrl} controls className="mt-4 w-full" />}
            {result.videoUrl && (
              <div className="mt-4">
                <video src={result.videoUrl} controls playsInline className="w-full rounded-2xl border border-white/10 bg-black" />
                <div className="mt-3 flex gap-3">
                  <a href={result.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-center text-xs font-black uppercase text-white/60 no-underline hover:text-white">Abrir</a>
                  <a href={"/api/download?url=" + encodeURIComponent(result.videoUrl) + "&filename=talking-avatar"} className="flex-1 rounded-xl bg-[#D7FF00] px-4 py-3 text-center text-xs font-black uppercase text-black no-underline">Baixar</a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
