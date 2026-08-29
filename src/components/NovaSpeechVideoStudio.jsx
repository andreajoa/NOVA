"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const ASPECTS = ["16:9", "9:16", "1:1"];

async function uploadReference(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("type", "image");
  form.append("title", "NOVA speech reference");
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || payload?.error || "Falha ao enviar a imagem.");
  const url = payload?.url || payload?.publicUrl || payload?.fileUrl || payload?.location;
  if (!url) throw new Error("O upload terminou sem uma URL pública.");
  return url;
}

function Choice({ active, children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        "rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-35 " +
        (active
          ? "border-[#D7FF00] bg-[#D7FF00] text-black"
          : "border-white/10 bg-white/[.035] text-white/55 hover:border-[#D7FF00]/45 hover:text-[#D7FF00]")
      }
    >
      {children}
    </button>
  );
}

export default function NovaSpeechVideoStudio() {
  const [usage, setUsage] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [speechText, setSpeechText] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [duration, setDuration] = useState(5);
  const [referenceFile, setReferenceFile] = useState(null);
  const [referencePreview, setReferencePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const pollToken = useRef(0);

  const video = usage?.video;
  const unlimited = Boolean(usage?.admin || video?.unlimited);
  const speechAvailable = Boolean(video?.speechAvailable || video?.capabilities?.speechVideo);
  const exhausted = !unlimited && Number(video?.remaining ?? 1) <= 0;
  const durations = useMemo(() => {
    const values = Array.isArray(video?.durations) && video.durations.length ? video.durations : [5];
    return values.filter((value) => value === 5 || value === 10);
  }, [video]);
  const effectiveDuration = durations.includes(duration) ? duration : (durations[0] || 5);

  async function refreshUsage() {
    try {
      const response = await fetch("/api/free-usage", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload?.success) setUsage(payload);
    } catch {
      // Generation endpoint remains authoritative.
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => refreshUsage(), 0);
    return () => {
      window.clearTimeout(timer);
      pollToken.current += 1;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (referencePreview) URL.revokeObjectURL(referencePreview);
    };
  }, [referencePreview]);

  function selectReference(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      setError("Escolha uma imagem válida.");
      return;
    }
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    setReferenceFile(file);
    setReferencePreview(URL.createObjectURL(file));
    setError("");
  }

  async function pollJob(jobId) {
    const token = ++pollToken.current;
    const startedAt = Date.now();
    while (pollToken.current === token && Date.now() - startedAt < 35 * 60 * 1000) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      if (pollToken.current !== token) return;

      const response = await fetch(`/api/free-video-status?job=${encodeURIComponent(jobId)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 404) continue;
        throw new Error(payload?.message || payload?.error || "Não foi possível acompanhar o vídeo.");
      }
      if (payload?.status === "completed" && payload?.videoUrl) {
        setResultUrl(payload.videoUrl);
        setStatus("Vídeo com fala pronto.");
        setLoading(false);
        await refreshUsage();
        return;
      }
      if (payload?.status === "failed") {
        setLoading(false);
        setStatus("");
        setError(payload?.message || "A geração falhou e a cota foi devolvida.");
        await refreshUsage();
        return;
      }
      const engine = payload?.engine ? ` · ${String(payload.engine).replace(/-/g, " ")}` : "";
      setStatus(`Gerando fala e movimento${engine}...`);
    }

    if (pollToken.current === token) {
      setLoading(false);
      setStatus("");
      setError("A geração está demorando mais que o esperado. O job continua salvo no NOVA.");
    }
  }

  async function generate() {
    if (!speechAvailable) {
      setError("A GPU de vídeo com fala ainda não está ativa.");
      return;
    }
    if (exhausted) {
      setError("Seu limite diário de NOVA VIDEO foi utilizado.");
      return;
    }
    if (!referenceFile) {
      setError("Adicione a imagem da pessoa ou personagem que irá falar.");
      return;
    }
    if (!prompt.trim()) {
      setError("Descreva a cena e o comportamento do personagem.");
      return;
    }
    if (!speechText.trim()) {
      setError("Escreva o que o personagem deve falar.");
      return;
    }

    pollToken.current += 1;
    setLoading(true);
    setError("");
    setResultUrl("");
    setStatus("Enviando imagem de referência...");

    try {
      const imageUrl = await uploadReference(referenceFile);
      setStatus("Enviando para a GPU de fala...");
      const response = await fetch("/api/free-video-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "speech-video",
          prompt: prompt.trim(),
          speech_text: speechText.trim(),
          image_url: imageUrl,
          duration: effectiveDuration,
          seconds: effectiveDuration,
          aspect_ratio: aspectRatio,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload?.jobId) {
        const diagnostic = unlimited && payload?.diagnostic ? ` Diagnóstico: ${payload.diagnostic}` : "";
        throw new Error(`${payload?.message || payload?.error || "Não foi possível iniciar o vídeo com fala."}${diagnostic}`);
      }
      await refreshUsage();
      setStatus("Vídeo com fala na fila de geração...");
      await pollJob(payload.jobId);
    } catch (generationError) {
      setLoading(false);
      setStatus("");
      setError(generationError?.message || "Não foi possível gerar o vídeo com fala.");
      await refreshUsage();
    }
  }

  const downloadHref = resultUrl
    ? `/api/download?url=${encodeURIComponent(resultUrl)}&filename=${encodeURIComponent("nova-video-com-fala.mp4")}`
    : "";

  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-9">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/free" className="text-xs font-black uppercase tracking-[0.14em] text-white/35 no-underline hover:text-white">← Gerar Grátis</Link>
          <div className="rounded-full border border-[#D7FF00]/25 bg-[#D7FF00]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#D7FF00]">
            {unlimited ? "Admin · Ilimitado" : `${video?.remaining ?? "—"} / ${video?.limit ?? "—"} hoje`}
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-fuchsia-400/20 bg-[#070707] p-5 md:p-8">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-fuchsia-400/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#D7FF00]/8 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#D7FF00] px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-black">NOVA VIDEO + FALA</span>
              <span className={"rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] " + (speechAvailable ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[.035] text-white/35")}>{speechAvailable ? "GPU Online" : "GPU em preparação"}</span>
            </div>
            <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-7xl">FAÇA A IMAGEM FALAR</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/48">Envie uma imagem, descreva a cena e escreva a fala. O NOVA gera movimento labial, expressão e áudio sincronizado.</p>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_390px]">
          <div className="rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Imagem da pessoa ou personagem</label>
            <input type="file" accept="image/*" disabled={loading} onChange={selectReference} className="mt-3 block w-full rounded-2xl border border-white/10 bg-white/[.035] p-3 text-xs text-white/55 file:mr-3 file:rounded-xl file:border-0 file:bg-[#D7FF00] file:px-4 file:py-2 file:font-black file:text-black" />
            {referencePreview && <img src={referencePreview} alt="Referência" className="mt-4 max-h-72 w-full rounded-2xl border border-white/10 object-contain" />}

            <label className="mt-6 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Cena e comportamento</label>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} disabled={loading} placeholder="Ex.: close-up cinematográfico, olha para a câmera, expressão acolhedora, movimentos naturais..." className="mt-2 min-h-32 w-full resize-none rounded-3xl border border-white/10 bg-black/35 px-5 py-4 text-sm text-white outline-none focus:border-[#D7FF00]/45" />

            <label className="mt-6 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Texto da fala</label>
            <textarea value={speechText} onChange={(event) => setSpeechText(event.target.value.slice(0, 500))} disabled={loading} placeholder="Escreva exatamente o que deve ser falado..." className="mt-2 min-h-36 w-full resize-none rounded-3xl border border-white/10 bg-black/35 px-5 py-4 text-sm text-white outline-none focus:border-fuchsia-400/45" />
            <p className="mt-2 text-right text-[10px] text-white/25">{speechText.length}/500</p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Formato</p>
                <div className="grid grid-cols-3 gap-2">{ASPECTS.map((aspect) => <Choice key={aspect} active={aspectRatio === aspect} onClick={() => setAspectRatio(aspect)} disabled={loading}>{aspect}</Choice>)}</div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Duração</p>
                <div className="grid grid-cols-2 gap-2">{durations.map((seconds) => <Choice key={seconds} active={effectiveDuration === seconds} onClick={() => setDuration(seconds)} disabled={loading}>{seconds}s</Choice>)}</div>
              </div>
            </div>

            <button type="button" onClick={generate} disabled={loading || exhausted || !speechAvailable} className="mt-7 flex min-h-16 w-full items-center justify-center rounded-2xl bg-[#D7FF00] px-5 text-sm font-black uppercase tracking-[0.12em] text-black disabled:cursor-not-allowed disabled:opacity-35">
              {loading ? "Gerando vídeo com fala..." : speechAvailable ? "Gerar vídeo com fala" : "Aguardando GPU de fala"}
            </button>

            {status && <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-100">{status}</div>}
            {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200">{error}</div>}
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Resultado</p>
            {resultUrl ? (
              <>
                <video src={resultUrl} controls playsInline className="mt-4 w-full rounded-2xl border border-white/10 bg-black" />
                <a href={downloadHref} className="mt-4 flex min-h-12 items-center justify-center rounded-xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00] no-underline">Baixar MP4</a>
              </>
            ) : (
              <div className="mt-4 flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm leading-6 text-white/30">O vídeo com fala aparecerá aqui quando a GPU terminar.</div>
            )}
            <p className="mt-5 text-xs leading-6 text-white/35">A fala é sintetizada e usada para dirigir o movimento do rosto e da boca. A disponibilidade depende de uma GPU compatível com o motor de fala.</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
