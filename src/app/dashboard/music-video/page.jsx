"use client";

import { useEffect, useMemo, useState } from "react";

const styles = [
  ["cinematic", "Cinematic"],
  ["luxury", "Luxury"],
  ["cyberpunk", "Cyberpunk"],
  ["romantic", "Romantic"],
  ["gospel", "Gospel"],
  ["dark", "Dark"],
  ["performance", "Performance"],
  ["anime", "Anime"],
];

const videoModels = [
  ["seedance", "Seedance 2.0"],
  ["kling", "Kling 3.0"],
  ["veo", "Veo 3.1"],
  ["happyhorse", "Happy Horse / Wan Pro"],
];

function formatSeconds(seconds) {
  const total = Number(seconds || 0);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function creditEstimate(durationSeconds) {
  return Number(durationSeconds || 0) * 24;
}

function statusLabel(status) {
  const map = {
    pending: "Pendente",
    generating: "Gerando",
    done: "Pronto",
    failed: "Falhou",
  };

  return map[status] || status;
}

export default function NovaMusicVideoPage() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const [title, setTitle] = useState("NOVA Music Video");
  const [artistName, setArtistName] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [mood, setMood] = useState("");
  const [visualStyle, setVisualStyle] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [durationSeconds, setDurationSeconds] = useState(180);
  const [sceneSeconds, setSceneSeconds] = useState(10);
  const [modelKey, setModelKey] = useState("seedance");
  const [modeKey, setModeKey] = useState("text-to-video");
  const [resolution, setResolution] = useState("1080p");

  const [storyboard, setStoryboard] = useState(null);
  const [job, setJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [upgrade, setUpgrade] = useState(null);

  const totalScenes = useMemo(() => Math.ceil(Number(durationSeconds) / Number(sceneSeconds)), [durationSeconds, sceneSeconds]);
  const estimatedCredits = useMemo(() => creditEstimate(durationSeconds), [durationSeconds]);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    const res = await fetch("/api/music-video/jobs");
    const data = await res.json().catch(() => ({}));
    if (data?.success) setJobs(data.jobs || []);
  }

  function chooseAudio(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    setAudioPreview(URL.createObjectURL(file));
    setAudioUrl("");
    setError("");
  }

  async function uploadAudio() {
    if (!audioFile) return audioUrl;

    setBusy("Enviando música para R2...");
    setError("");

    const form = new FormData();
    form.append("file", audioFile);
    form.append("type", "audio");
    form.append("title", title || audioFile.name || "Music audio");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.url) {
      throw new Error(data?.error || "Falha ao enviar música.");
    }

    setAudioUrl(data.url);
    return data.url;
  }

  async function transcribeAudio() {
    try {
      const uploadedUrl = await uploadAudio();

      setBusy("Transcrevendo música...");
      setError("");

      const res = await fetch("/api/music-video/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: uploadedUrl }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Transcrição falhou.");
      }

      setLyrics(data.text || "");
    } catch (err) {
      setError(err?.message || "Transcrição falhou.");
    } finally {
      setBusy("");
    }
  }

  async function analyzeSong() {
    try {
      setBusy("Analisando música e criando storyboard...");
      setError("");

      const res = await fetch("/api/music-video/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songTitle: title,
          artistName,
          lyrics,
          mood,
          visualStyle,
          aspectRatio,
          durationSeconds,
          sceneSeconds,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Falha ao analisar música.");
      }

      setStoryboard(data.storyboard);
      setJob(null);
    } catch (err) {
      setError(err?.message || "Falha ao analisar música.");
    } finally {
      setBusy("");
    }
  }

  async function createJob() {
    try {
      const uploadedUrl = await uploadAudio();

      if (!storyboard?.scenes?.length) {
        throw new Error("Crie o storyboard antes de iniciar o job.");
      }

      setBusy("Criando job profissional...");
      setError("");

      const res = await fetch("/api/music-video/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artistName,
          lyrics,
          audioUrl: uploadedUrl,
          visualStyle,
          aspectRatio,
          durationSeconds,
          sceneSeconds,
          modelKey,
          modeKey,
          storyboard,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Falha ao criar job.");
      }

      setJob(data.job);
      setStoryboard(data.job);
      await loadJobs();
    } catch (err) {
      setError(err?.message || "Falha ao criar job.");
    } finally {
      setBusy("");
    }
  }

  async function saveScenePrompt(sceneIndex, prompt) {
    const current = job || storyboard;
    if (!current?.scenes) return;

    const nextScenes = current.scenes.map((scene, index) =>
      index === sceneIndex ? { ...scene, prompt } : scene
    );

    if (job?.id) {
      const res = await fetch(`/api/music-video/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes: nextScenes }),
      });

      const data = await res.json().catch(() => ({}));
      if (data?.success) setJob(data.job);
    } else {
      setStoryboard({ ...storyboard, scenes: nextScenes });
    }
  }

  async function refreshJob(jobId = job?.id) {
    if (!jobId) return null;

    const res = await fetch(`/api/music-video/jobs/${jobId}`);
    const data = await res.json().catch(() => ({}));

    if (data?.success) {
      setJob(data.job);
      return data.job;
    }

    return null;
  }

  async function generateScene(sceneIndex) {
    if (!job?.id) return null;

    setBusy(`Gerando cena ${sceneIndex + 1}...`);
    setError("");
    setUpgrade(null);

    const res = await fetch(`/api/music-video/jobs/${job.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_scene",
        sceneIndex,
        resolution,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 402 || data?.code === "INSUFFICIENT_CREDITS") {
      setUpgrade(data);
      setBusy("");
      return null;
    }

    if (!res.ok || !data?.success) {
      setError(data?.error || "Falha ao gerar cena.");
      if (data?.job) setJob(data.job);
      setBusy("");
      return null;
    }

    setJob(data.job);
    setBusy("");

    return data.job;
  }

  async function generateAllScenes() {
    if (!job?.id) return;

    let current = await refreshJob(job.id);
    if (!current) return;

    for (let i = 0; i < current.scenes.length; i++) {
      const scene = current.scenes[i];

      if (scene.status === "done" && scene.videoUrl) continue;

      const updated = await generateScene(i);
      if (!updated) return;

      current = updated;
    }

    setBusy("");
  }

  async function retryScene(sceneIndex) {
    if (!job?.id) return;

    setBusy(`Resetando cena ${sceneIndex + 1}...`);
    setError("");

    await fetch(`/api/music-video/jobs/${job.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_scene", sceneIndex }),
    });

    await refreshJob(job.id);
    setBusy("");

    await generateScene(sceneIndex);
  }

  async function renderFinalVideo() {
    if (!job?.id) return;

    setBusy("Renderizando clipe final com FFmpeg...");
    setError("");

    const res = await fetch("/api/music-video/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.success) {
      setError(data?.error || "Falha ao renderizar vídeo final.");
      if (data?.job) setJob(data.job);
      setBusy("");
      return;
    }

    setJob(data.job);
    setBusy("");
  }

  const active = job || storyboard;
  const scenes = active?.scenes || [];
  const doneScenes = scenes.filter((scene) => scene.status === "done" && scene.videoUrl).length;
  const canRender = job?.id && scenes.length > 0 && doneScenes === scenes.length && audioUrl;

  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-10">
        <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#070707] p-5 shadow-[0_0_110px_rgba(215,255,0,.08)] md:p-8">
          <div className="absolute -left-24 top-12 h-96 w-96 rounded-full bg-[#D7FF00]/13 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[0.8fr_1.2fr] xl:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">
                NOVA Music Video Generator
              </p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-[0.86] tracking-[-0.09em] md:text-7xl">
                Crie um clipe completo com IA.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55 md:text-base">
                Envie a música, cole ou transcreva a letra, gere um storyboard profissional, crie cada cena com fal.ai e renderize o clipe final em MP4.
              </p>

              <div className="mt-6 rounded-2xl border border-[#D7FF00]/25 bg-[#D7FF00]/10 p-4 text-sm leading-6 text-[#D7FF00]/90">
                Use apenas músicas próprias, licenciadas ou com autorização. O clipe final pode usar muitos créditos porque cada cena é um vídeo gerado separadamente.
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                <p className="text-3xl font-black text-[#D7FF00]">{formatSeconds(durationSeconds)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/35">Duração final</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                <p className="text-3xl font-black text-[#D7FF00]">{totalScenes}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/35">Cenas geradas</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                <p className="text-3xl font-black text-[#D7FF00]">{estimatedCredits}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/35">Créditos estimados</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[420px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <div className="grid gap-5">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  Música / áudio
                </span>
                <div className="grid min-h-[130px] cursor-pointer place-items-center rounded-3xl border border-dashed border-white/15 bg-white/[.025] p-4 text-center transition hover:border-[#D7FF00]/45">
                  <input className="hidden" type="file" accept="audio/*" onChange={chooseAudio} />
                  <div>
                    <p className="text-3xl text-[#D7FF00]">♫</p>
                    <p className="mt-2 text-sm text-white/50">
                      {audioFile ? audioFile.name : "Clique para enviar MP3/WAV"}
                    </p>
                  </div>
                </div>
              </label>

              {audioPreview && (
                <audio src={audioPreview} controls className="w-full" />
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Título</span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50" />
                </label>

                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Artista</span>
                  <input value={artistName} onChange={(e) => setArtistName(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50" />
                </label>
              </div>

              <label>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Mood / direção visual</span>
                <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Ex: triste, épico, espiritual, dark, romântico..." className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#D7FF00]/50" />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Estilo</span>
                  <select value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50">
                    {styles.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Formato</span>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50">
                    <option value="16:9">16:9 YouTube</option>
                    <option value="9:16">9:16 Reels/TikTok</option>
                    <option value="1:1">1:1 Social</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Duração</span>
                  <select value={durationSeconds} onChange={(e) => setDurationSeconds(Number(e.target.value))} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50">
                    <option value={30}>30s</option>
                    <option value={60}>60s</option>
                    <option value={90}>90s</option>
                    <option value={180}>3 minutos completo</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Tamanho da cena</span>
                  <select value={sceneSeconds} onChange={(e) => setSceneSeconds(Number(e.target.value))} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50">
                    <option value={5}>5s por cena</option>
                    <option value={10}>10s por cena</option>
                    <option value={15}>15s por cena</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Modelo fal.ai</span>
                  <select value={modelKey} onChange={(e) => setModelKey(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50">
                    {videoModels.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Qualidade</span>
                  <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none focus:border-[#D7FF00]/50">
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="4K">4K</option>
                  </select>
                </label>
              </div>

              <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="Cole a letra aqui ou use Transcrever música..." className="min-h-[180px] w-full resize-none rounded-2xl border border-white/10 bg-black/45 px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#D7FF00]/50" />

              <div className="grid gap-3">
                <button onClick={transcribeAudio} disabled={busy || !audioFile} className="rounded-2xl border border-white/10 bg-white/[.04] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:border-[#D7FF00]/45 hover:text-[#D7FF00] disabled:opacity-40">
                  Transcrever música
                </button>

                <button onClick={analyzeSong} disabled={busy} className="rounded-2xl bg-[#D7FF00] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:scale-[1.01] disabled:opacity-40">
                  Criar storyboard
                </button>

                <button onClick={createJob} disabled={busy || !storyboard?.scenes?.length} className="rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00] transition hover:bg-[#D7FF00] hover:text-black disabled:opacity-40">
                  Criar job final
                </button>
              </div>
            </div>
          </aside>

          <section className="rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Storyboard / produção</p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.06em] text-white md:text-5xl">
                  {active?.title || "Crie o storyboard primeiro."}
                </h2>
                <p className="mt-2 text-sm text-white/40">
                  {scenes.length ? `${doneScenes}/${scenes.length} cenas prontas` : "Depois de analisar, você poderá editar cada prompt antes de gerar."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={generateAllScenes} disabled={busy || !job?.id} className="rounded-2xl bg-[#D7FF00] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:scale-[1.01] disabled:opacity-40">
                  Gerar todas as cenas
                </button>

                <button onClick={renderFinalVideo} disabled={busy || !canRender} className="rounded-2xl border border-[#D7FF00]/35 bg-[#D7FF00]/10 px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00] transition hover:bg-[#D7FF00] hover:text-black disabled:opacity-40">
                  Renderizar MP4 final
                </button>
              </div>
            </div>

            {busy && (
              <div className="mb-5 rounded-2xl border border-[#D7FF00]/25 bg-[#D7FF00]/10 p-4 text-sm font-bold text-[#D7FF00]">
                {busy}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                {error}
              </div>
            )}

            {upgrade && (
              <div className="mb-5 rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Saldo insuficiente</p>
                <h3 className="mt-2 text-2xl font-black uppercase text-white">{upgrade.message}</h3>
                <a href="/pricing" className="mt-4 inline-flex rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black no-underline">
                  Ver planos →
                </a>
              </div>
            )}

            {job?.finalUrl && (
              <div className="mb-6 rounded-[1.5rem] border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Clipe final pronto</p>
                <video src={job.finalUrl} controls className="mt-4 w-full rounded-2xl" />
                <a href={job.finalUrl} download className="mt-4 inline-flex rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black no-underline">
                  Baixar MP4 final
                </a>
              </div>
            )}

            <div className="grid gap-4">
              {scenes.map((scene, index) => (
                <article key={scene.id} className="rounded-[1.35rem] border border-white/10 bg-black/35 p-4">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D7FF00]">
                        Cena {scene.number} • {scene.startLabel || formatSeconds(scene.start)}–{scene.endLabel || formatSeconds(scene.end)}
                      </p>
                      <h3 className="mt-2 text-xl font-black uppercase tracking-[-0.04em] text-white">
                        {scene.energy}
                      </h3>
                      {scene.lyric && <p className="mt-2 text-sm leading-6 text-white/45">“{scene.lyric}”</p>}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/50">
                        {statusLabel(scene.status)}
                      </span>
                      <button onClick={() => generateScene(index)} disabled={busy || !job?.id} className="rounded-xl bg-[#D7FF00] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-black disabled:opacity-40">
                        Gerar
                      </button>
                      {scene.status === "failed" && (
                        <button onClick={() => retryScene(index)} disabled={busy || !job?.id} className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-red-200 disabled:opacity-40">
                          Retry
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    value={scene.prompt}
                    onChange={(e) => saveScenePrompt(index, e.target.value)}
                    className="min-h-[130px] w-full resize-none rounded-2xl border border-white/10 bg-white/[.025] px-4 py-4 text-sm leading-6 text-white outline-none focus:border-[#D7FF00]/50"
                  />

                  {scene.error && (
                    <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs leading-5 text-red-200">
                      {scene.error}
                    </p>
                  )}

                  {scene.videoUrl && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-2">
                      <video src={scene.videoUrl} controls className="w-full rounded-xl" />
                      <a href={scene.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex rounded-xl border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/60 no-underline hover:text-white">
                        Abrir clipe
                      </a>
                    </div>
                  )}
                </article>
              ))}

              {!scenes.length && (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-8 text-center text-white/40">
                  O storyboard aparecerá aqui com todas as cenas do clipe.
                </div>
              )}
            </div>
          </section>
        </section>

        {jobs.length > 0 && (
          <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Jobs recentes</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {jobs.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setJob(item);
                    setStoryboard(item);
                    setTitle(item.title);
                    setArtistName(item.artistName);
                    setLyrics(item.lyrics);
                    setAudioUrl(item.audioUrl);
                    setVisualStyle(item.style);
                    setAspectRatio(item.aspectRatio);
                    setDurationSeconds(item.durationSeconds);
                    setSceneSeconds(item.sceneSeconds);
                    setModelKey(item.modelKey);
                    setModeKey(item.modeKey);
                  }}
                  className="rounded-2xl border border-white/10 bg-black/35 p-4 text-left transition hover:border-[#D7FF00]/40"
                >
                  <p className="text-sm font-black text-white">{item.title}</p>
                  <p className="mt-2 text-xs text-white/35">{item.status} • {item.scenes?.filter((s) => s.status === "done").length || 0}/{item.scenes?.length || 0} cenas</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
