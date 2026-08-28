"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const ASPECTS = ["16:9", "9:16", "1:1"];
const HF_TOKEN_KEY = "nova_hf_access_token";
const HF_EXPIRY_KEY = "nova_hf_token_expiry";
const HF_VERIFIER_KEY = "nova_hf_pkce_verifier";
const HF_STATE_KEY = "nova_hf_oauth_state";
const HF_RETURN_KEY = "nova_hf_return_to";

async function uploadReference(file) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || payload?.error || "Falha ao enviar a imagem.");
  const url = payload?.url || payload?.publicUrl || payload?.fileUrl || payload?.location;
  if (!url) throw new Error("O upload terminou sem uma URL pública.");
  return url;
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomUrlSafe(byteLength = 48) {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function pkceChallenge(verifier) {
  const bytes = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return base64Url(new Uint8Array(digest));
}

function activeHfToken() {
  if (typeof window === "undefined") return "";
  const token = sessionStorage.getItem(HF_TOKEN_KEY) || "";
  const expiry = Number(sessionStorage.getItem(HF_EXPIRY_KEY) || 0);
  if (!token || !token.startsWith("hf_") || (expiry && Date.now() >= expiry)) {
    sessionStorage.removeItem(HF_TOKEN_KEY);
    sessionStorage.removeItem(HF_EXPIRY_KEY);
    return "";
  }
  return token;
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

export default function NovaFreeVideoStudio({ initialModeKey = "text-to-video" }) {
  const [mode, setMode] = useState(initialModeKey === "image-to-video" ? "image-to-video" : "text-to-video");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState(5);
  const [referenceFile, setReferenceFile] = useState(null);
  const [referencePreview, setReferencePreview] = useState("");
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [continuePrompt, setContinuePrompt] = useState("");
  const [hfConnected, setHfConnected] = useState(false);
  const [showHfConnect, setShowHfConnect] = useState(false);
  const pollToken = useRef(0);

  const videoUsage = usage?.video;
  const durations = useMemo(() => {
    const values = Array.isArray(videoUsage?.durations) && videoUsage.durations.length
      ? videoUsage.durations
      : [5];
    return values.filter((n) => n === 5 || n === 10);
  }, [videoUsage]);
  const effectiveDuration = durations.includes(duration) ? duration : (durations[0] || 5);

  const unlimited = Boolean(usage?.admin || videoUsage?.unlimited);
  const exhausted = !unlimited && Number(videoUsage?.remaining ?? 1) <= 0;

  async function refreshUsage() {
    try {
      const response = await fetch("/api/free-usage", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload?.success) setUsage(payload);
    } catch {
      // Server-side quota enforcement remains authoritative.
    }
  }

  async function activatePersonalFreeGpu() {
    const verifier = randomUrlSafe(48);
    const state = randomUrlSafe(32);
    const challenge = await pkceChallenge(verifier);
    const origin = window.location.origin;
    const returnTo = `${window.location.pathname}${window.location.search}`;

    sessionStorage.setItem(HF_VERIFIER_KEY, verifier);
    sessionStorage.setItem(HF_STATE_KEY, state);
    sessionStorage.setItem(HF_RETURN_KEY, returnTo);

    const params = new URLSearchParams({
      client_id: `${origin}/.well-known/oauth-cimd`,
      redirect_uri: `${origin}/oauth/callback/huggingface`,
      response_type: "code",
      scope: "openid profile",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    window.location.assign(`https://huggingface.co/oauth/authorize?${params.toString()}`);
  }

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (!cancelled) setHfConnected(Boolean(activeHfToken()));
      try {
        const response = await fetch("/api/free-usage", { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && payload?.success) setUsage(payload);
      } catch {
        // Server-side quota enforcement remains authoritative.
      }
    }, 0);

    return () => {
      cancelled = true;
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
    setReferenceFile(file);
    setReferencePreview(URL.createObjectURL(file));
    setError("");
  }

  async function pollJob(id, increment, replacing) {
    const token = ++pollToken.current;
    const startedAt = Date.now();

    while (pollToken.current === token && Date.now() - startedAt < 12 * 60 * 1000) {
      await new Promise((resolve) => setTimeout(resolve, 3500));
      if (pollToken.current !== token) return;

      const response = await fetch(`/api/free-video-status?job=${encodeURIComponent(id)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 404) continue;
        throw new Error(payload?.message || payload?.error || "Não foi possível acompanhar o vídeo.");
      }

      if (payload?.status === "completed" && payload?.videoUrl) {
        setResultUrl(payload.videoUrl);
        setTotalSeconds((current) => replacing ? increment : current + increment);
        setStatus("Vídeo pronto.");
        setLoading(false);
        setJobId("");
        await refreshUsage();
        return;
      }

      if (payload?.status === "failed") {
        setLoading(false);
        setJobId("");
        setStatus("");
        setError(payload?.message || "A geração falhou. Sua cota foi devolvida.");
        await refreshUsage();
        return;
      }

      setStatus("Gerando seu vídeo...");
    }

    if (pollToken.current === token) {
      setLoading(false);
      setStatus("");
      setError("A geração está demorando mais que o esperado. Atualize a página em alguns minutos para tentar novamente.");
    }
  }

  async function startGeneration({ continueFrom = "", seconds = effectiveDuration } = {}) {
    if (!prompt.trim() && !continuePrompt.trim()) {
      setError("Descreva o vídeo que você quer criar.");
      return;
    }
    if (exhausted) {
      setError("Seu limite diário de NOVA VIDEO foi utilizado.");
      return;
    }
    if (!continueFrom && mode === "image-to-video" && !referenceFile) {
      setError("Adicione uma imagem para usar Image to Video.");
      return;
    }

    pollToken.current += 1;
    setLoading(true);
    setError("");
    setShowHfConnect(false);
    setStatus(continueFrom ? "Preparando continuação..." : "Preparando geração...");

    try {
      let imageUrl = "";
      if (!continueFrom && mode === "image-to-video") {
        setStatus("Enviando imagem de referência...");
        imageUrl = await uploadReference(referenceFile);
      }

      const hfToken = activeHfToken();
      setHfConnected(Boolean(hfToken));
      const requestMode = continueFrom ? "continue-video" : mode;
      const response = await fetch("/api/free-video-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: requestMode,
          prompt: String(continueFrom ? (continuePrompt || prompt) : prompt).trim(),
          negative_prompt: negativePrompt,
          aspect_ratio: aspectRatio,
          duration: seconds,
          seconds,
          ...(hfToken && { hf_token: hfToken }),
          ...(imageUrl && { image_url: imageUrl }),
          ...(continueFrom && { source_video_url: continueFrom }),
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.success || !payload?.jobId) {
        if (response.status === 402) await refreshUsage();
        if (
          payload?.code === "NOVA_FREE_VIDEO_ENGINE_QUOTA_REACHED" &&
          payload?.canConnectPersonalFreeGpu &&
          !hfToken
        ) {
          setShowHfConnect(true);
        }
        throw new Error(payload?.message || payload?.error || "Não foi possível iniciar o vídeo.");
      }

      setShowHfConnect(false);
      await refreshUsage();

      if (payload?.processing === false && payload?.videoUrl) {
        setResultUrl(payload.videoUrl);
        setTotalSeconds((current) => continueFrom ? current + seconds : seconds);
        setStatus("Vídeo pronto.");
        setLoading(false);
        setJobId("");
        return;
      }

      setJobId(payload.jobId);
      setStatus("Vídeo na fila de geração...");
      await pollJob(payload.jobId, seconds, !continueFrom);
    } catch (err) {
      setLoading(false);
      setStatus("");
      setJobId("");
      setError(err?.message || "Não foi possível gerar o vídeo.");
      await refreshUsage();
    }
  }

  const downloadHref = resultUrl
    ? `/api/download?url=${encodeURIComponent(resultUrl)}&filename=${encodeURIComponent("nova-video.mp4")}`
    : "";

  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-9">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/free" className="text-xs font-black uppercase tracking-[0.14em] text-white/35 no-underline hover:text-white">← Gerar Grátis</Link>
          <div className="flex flex-wrap items-center gap-2">
            {hfConnected && (
              <div className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">
                GPU pessoal grátis ativa
              </div>
            )}
            <div className="rounded-full border border-[#D7FF00]/25 bg-[#D7FF00]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#D7FF00]">
              {unlimited ? "Admin · Ilimitado" : `${videoUsage?.remaining ?? "—"} / ${videoUsage?.limit ?? "—"} hoje`}
            </div>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[#070707] p-5 md:p-8">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#D7FF00]/8 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#D7FF00] px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-black">Incluído · 0 créditos</span>
              <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white/45">480p</span>
            </div>
            <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-7xl">NOVA VIDEO FREE</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/48">Crie a partir de texto ou imagem e continue um vídeo pronto em novos blocos, respeitando o limite diário da sua conta.</p>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <div className="grid grid-cols-2 gap-2">
              <Choice active={mode === "text-to-video"} onClick={() => setMode("text-to-video")} disabled={loading}>Text to Video</Choice>
              <Choice active={mode === "image-to-video"} onClick={() => setMode("image-to-video")} disabled={loading}>Image to Video</Choice>
            </div>

            <label className="mt-6 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Prompt</label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={loading}
              placeholder="Descreva a cena, o movimento, a câmera e o que deve acontecer..."
              className="mt-2 min-h-[180px] w-full resize-none rounded-3xl border border-white/10 bg-black/35 px-5 py-5 text-sm leading-7 text-white outline-none placeholder:text-white/20 focus:border-[#D7FF00]/45"
            />

            <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Prompt negativo · opcional</label>
            <textarea
              value={negativePrompt}
              onChange={(event) => setNegativePrompt(event.target.value)}
              disabled={loading}
              placeholder="Ex: tremido, distorcido, baixa qualidade..."
              className="mt-2 min-h-[90px] w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none placeholder:text-white/20"
            />

            {mode === "image-to-video" && (
              <div className="mt-5">
                <label className="inline-flex cursor-pointer rounded-xl border border-[#D7FF00]/25 bg-[#D7FF00]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00]">
                  Adicionar imagem
                  <input type="file" accept="image/*" className="hidden" onChange={selectReference} disabled={loading} />
                </label>
                {referencePreview && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-3">
                    <img src={referencePreview} alt="Referência" className="max-h-[360px] w-full rounded-xl object-contain" />
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Duração desta geração</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {durations.map((item) => (
                <Choice key={item} active={effectiveDuration === item} onClick={() => setDuration(item)} disabled={loading}>{item}s</Choice>
              ))}
            </div>

            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Formato</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {ASPECTS.map((item) => (
                <Choice key={item} active={aspectRatio === item} onClick={() => setAspectRatio(item)} disabled={loading}>{item}</Choice>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#D7FF00]/20 bg-[#D7FF00]/8 p-4 text-xs leading-6 text-white/48">
              {unlimited
                ? "Conta admin: gerações NOVA incluídas ilimitadas."
                : `Restam ${videoUsage?.remaining ?? "—"} de ${videoUsage?.limit ?? "—"} gerações hoje.`}
            </div>

            <button
              type="button"
              onClick={() => startGeneration()}
              disabled={loading || exhausted || !prompt.trim()}
              className="mt-5 min-h-16 w-full rounded-2xl bg-[#D7FF00] px-5 text-sm font-black uppercase tracking-[0.13em] text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (status || "Gerando...") : exhausted ? "Limite diário utilizado" : `Gerar vídeo · ${effectiveDuration}s`}
            </button>

            {jobId && <p className="mt-3 text-center text-xs text-white/35">Processando com segurança. Você pode manter esta página aberta.</p>}
          </aside>
        </section>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-5 text-sm text-red-200">
            <p>{error}</p>
            {showHfConnect && (
              <button
                type="button"
                onClick={activatePersonalFreeGpu}
                className="mt-4 rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black"
              >
                Ativar capacidade gratuita pessoal
              </button>
            )}
          </div>
        )}

        {resultUrl && (
          <section className="mt-5 rounded-[2rem] border border-[#D7FF00]/20 bg-[#070707] p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Vídeo concluído</p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em]">Duração atual: {totalSeconds}s</h2>
              </div>
              <a href={downloadHref} className="rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black no-underline">Download</a>
            </div>

            <video src={resultUrl} controls playsInline preload="metadata" className="mt-5 aspect-video max-h-[72vh] w-full rounded-2xl bg-black object-contain" />

            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[.05] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Continuar este vídeo</p>
              <p className="mt-2 text-xs leading-6 text-white/40">A continuação usa o final do vídeo anterior, gera o próximo trecho e devolve um único arquivo mais longo. Cada continuação conta como uma nova geração diária.</p>
              <textarea
                value={continuePrompt}
                onChange={(event) => setContinuePrompt(event.target.value)}
                disabled={loading}
                placeholder="Opcional: diga o que deve acontecer na continuação. Se vazio, o prompt original será mantido."
                className="mt-4 min-h-[90px] w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none placeholder:text-white/20"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {durations.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => startGeneration({ continueFrom: resultUrl, seconds: item })}
                    disabled={loading || exhausted}
                    className="rounded-xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00] disabled:opacity-35"
                  >
                    + Continuar {item}s
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
