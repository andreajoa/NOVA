"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { falModels } from "@/lib/falModels";

const logoSrc = "/nova/logo-nova.jpeg";

const IMAGE_RESOLUTIONS = ["1K", "2K", "4K"];
const VIDEO_RESOLUTIONS = ["720p", "1080p", "4K"];
const IMAGE_RATIOS = ["1:1", "9:16", "16:9", "4:5"];
const VIDEO_RATIOS = ["9:16", "16:9", "1:1"];
const IMAGE_COUNTS = [1, 2, 4];
const VIDEO_SECONDS = [5, 10, 15];

function firstModeKey(model) {
  return Object.keys(model?.modes || {})[0] || "";
}

function getModelType(modelKey) {
  if (falModels.image?.[modelKey]) return "image";
  if (falModels.video?.[modelKey]) return "video";
  return null;
}

function getModel(modelKey) {
  return falModels.image?.[modelKey] || falModels.video?.[modelKey] || null;
}

function getEntries(forceType) {
  if (forceType === "image") return Object.entries(falModels.image || {});
  if (forceType === "video") return Object.entries(falModels.video || {});
  return [...Object.entries(falModels.image || {}), ...Object.entries(falModels.video || {})];
}

function resolveInitialModel(initialModelKey, forceType) {
  const entries = getEntries(forceType);
  const fallback = entries[0]?.[0] || "";
  if (!initialModelKey) return fallback;

  const type = getModelType(initialModelKey);
  if (!type) return fallback;
  if (forceType && type !== forceType) return fallback;

  return initialModelKey;
}

function imageSizeFrom(aspectRatio, resolution) {
  if (aspectRatio === "16:9") return "landscape_16_9";
  if (aspectRatio === "9:16") return "portrait_16_9";
  if (aspectRatio === "4:5") return "portrait_4_3";
  return resolution === "1K" ? "square" : "square_hd";
}

function collectUrls(data) {
  const raw = data?.data?.raw || {};
  const urls = [];

  if (data?.data?.url) urls.push(data.data.url);

  if (Array.isArray(data?.data?.urls)) {
    data.data.urls.forEach((url) => url && urls.push(url));
  }

  if (Array.isArray(raw.images)) {
    raw.images.forEach((item) => {
      const url = typeof item === "string" ? item : item?.url;
      if (url) urls.push(url);
    });
  }

  if (Array.isArray(raw.videos)) {
    raw.videos.forEach((item) => {
      const url = typeof item === "string" ? item : item?.url;
      if (url) urls.push(url);
    });
  }

  if (raw.image?.url) urls.push(raw.image.url);
  if (raw.video?.url) urls.push(raw.video.url);
  if (raw.output?.url) urls.push(raw.output.url);

  return [...new Set(urls)].filter(Boolean);
}

function OptionButton({ active, children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition " +
        (active
          ? "border-[#D7FF00] bg-[#D7FF00] text-black shadow-[0_0_35px_rgba(215,255,0,.18)] "
          : "border-white/10 bg-white/[.035] text-white/55 hover:border-[#D7FF00]/45 hover:text-[#D7FF00] ") +
        className
      }
    >
      {children}
    </button>
  );
}

function SelectBox({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm font-bold text-white outline-none transition focus:border-[#D7FF00]/50"
      >
        {options.map(([key, item]) => (
          <option key={key} value={key}>
            {item.label || key}
          </option>
        ))}
      </select>
    </label>
  );
}

function PromoBanner() {
  return (
    <Link
      href="/pricing"
      className="group relative block overflow-hidden rounded-[1.35rem] border border-[#D7FF00]/35 bg-[#D7FF00]/10 p-[1px] no-underline shadow-[0_0_60px_rgba(215,255,0,.10)]"
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#D7FF00]/30 via-fuchsia-500/25 to-cyan-400/25 opacity-80" />
      <div className="relative flex flex-col gap-4 rounded-[1.28rem] bg-black/72 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D7FF00] text-2xl text-black">♕</div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D7FF00]">
              Go Unlimited
            </p>
            <p className="mt-1 text-sm leading-6 text-white/60">
              Desbloqueie mais qualidade, mais créditos, modelos premium e gerações mais rápidas.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center justify-center rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition group-hover:scale-[1.02]">
          Ver planos →
        </div>
      </div>
    </Link>
  );
}

function FloatingLogo() {
  return (
    <div className="relative grid place-items-center py-4 md:py-7">
      <div className="absolute h-48 w-48 rounded-full bg-[#D7FF00]/12 blur-3xl md:h-64 md:w-64" />
      <div className="absolute h-36 w-72 rounded-full border border-[#D7FF00]/20 shadow-[0_0_60px_rgba(215,255,0,.12)] md:h-44 md:w-96" />
      <img
        src={logoSrc}
        alt="NOVA"
        className="relative h-28 w-auto rounded-3xl object-contain shadow-[0_0_70px_rgba(215,255,0,.18)] md:h-40"
        style={{ animation: "novaFloat 4.8s ease-in-out infinite" }}
      />
      <style jsx global>{`
        @keyframes novaFloat {
          0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 0 16px rgba(215,255,0,.28)); }
          50% { transform: translateY(-10px) scale(1.02); filter: drop-shadow(0 0 32px rgba(215,255,0,.42)); }
        }
      `}</style>
    </div>
  );
}

export default function NovaGenerationStudio({
  initialModelKey = "",
  initialModeKey = "",
  forceType = "",
  syncRoute = false,
}) {
  const router = useRouter();

  const resolvedInitialModel = resolveInitialModel(initialModelKey, forceType);
  const initialModel = getModel(resolvedInitialModel);
  const resolvedInitialMode =
    initialModeKey && initialModel?.modes?.[initialModeKey]
      ? initialModeKey
      : firstModeKey(initialModel);

  const [modelKey, setModelKey] = useState(resolvedInitialModel);
  const [modeKey, setModeKey] = useState(resolvedInitialMode);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [showNegative, setShowNegative] = useState(false);

  const activeType = getModelType(modelKey) || forceType || "image";
  const isImage = activeType === "image";
  const model = getModel(modelKey);
  const modeData = model?.modes?.[modeKey];
  const modeEntries = Object.entries(model?.modes || {});
  const modelEntries = getEntries(forceType);

  const [imageResolution, setImageResolution] = useState("2K");
  const [videoResolution, setVideoResolution] = useState("1080p");
  const [imageRatio, setImageRatio] = useState("1:1");
  const [videoRatio, setVideoRatio] = useState("16:9");
  const [imageCount, setImageCount] = useState(2);
  const [seconds, setSeconds] = useState(5);
  const [creativity, setCreativity] = useState("balanced");

  const [asset, setAsset] = useState(null);
  const [assetPreview, setAssetPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState(null);
  const [upgradeOffer, setUpgradeOffer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryPrompt = params.get("prompt");
    if (queryPrompt) setPrompt(queryPrompt);
  }, []);

  function selectModel(nextModelKey) {
    const nextModel = getModel(nextModelKey);
    const nextModeKey = firstModeKey(nextModel);
    setModelKey(nextModelKey);
    setModeKey(nextModeKey);
    setResult(null);
    setUpgradeOffer(null);
    setError("");

    if (syncRoute && nextModeKey) {
      router.push(`/dashboard/models/${nextModelKey}/${nextModeKey}`);
    }
  }

  function selectMode(nextModeKey) {
    setModeKey(nextModeKey);
    setResult(null);
    setUpgradeOffer(null);
    setError("");

    if (syncRoute) {
      router.push(`/dashboard/models/${modelKey}/${nextModeKey}`);
    }
  }

  function handleAssetChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAsset(file);
    setAssetPreview(URL.createObjectURL(file));
  }

  function improvePrompt() {
    const addon = isImage
      ? " cinematic lighting, premium commercial composition, ultra detailed, clean background, high-end brand aesthetic"
      : " cinematic camera movement, premium lighting, smooth motion, realistic details, high-impact product ad style";
    setPrompt((current) => {
      const base = current.trim();
      return base ? base + "," + addon : addon.replace(/^,\s*/, "");
    });
  }

  async function uploadReference(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || data?.error || "Upload failed");
    }

    const url = data?.url || data?.publicUrl || data?.fileUrl || data?.location;

    if (!url) {
      throw new Error("Upload completed, but no public URL was returned.");
    }

    return url;
  }

  async function handleGenerate() {
    if (!prompt.trim() || !modeData?.endpoint) return;

    setLoading(true);
    setStatusText(asset ? "Uploading reference..." : "Preparing generation...");
    setError("");
    setResult(null);
    setUpgradeOffer(null);

    try {
      let imageUrl = "";

      if (asset) {
        imageUrl = await uploadReference(asset);
      }

      setStatusText(isImage ? "Generating images..." : "Generating video...");

      const payload = {
        endpoint: modeData.endpoint,
        prompt,
        negative_prompt: negativePrompt,
        model: modelKey,
        mode: modeKey,
        type: isImage ? "image" : "video",
        hasAsset: Boolean(asset),
        ...(imageUrl && { image_url: imageUrl }),
        ...(isImage
          ? {
              aspect_ratio: imageRatio,
              image_size: imageSizeFrom(imageRatio, imageResolution),
              num_images: imageCount,
            }
          : {
              aspect_ratio: videoRatio,
              resolution: videoResolution,
              duration: seconds,
              seconds,
            }),
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (
        res.status === 402 ||
        data?.code === "INSUFFICIENT_CREDITS" ||
        data?.code === "IMAGE_TRIAL_LIMIT_REACHED"
      ) {
        setUpgradeOffer(data);
        return;
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || data?.error || "Generation failed");
      }

      const urls = collectUrls(data);

      setResult({
        ...data,
        urls,
      });

      window.dispatchEvent(new Event("nova:credits-refresh"));
    } catch (err) {
      setError(err?.message || "Generation failed");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  }

  if (!model || !modeData) {
    return (
      <main className="min-h-screen bg-[#020303] p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-8">
          Model or mode not found.
        </div>
      </main>
    );
  }

  const resultUrls = result?.urls || [];
  const needsImage = Boolean(modeData?.needsImage);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020303] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 md:px-6 md:py-8">
        <div className="mb-5 text-sm text-white/28">
          <button
            type="button"
            onClick={() => router.push("/dashboard/models")}
            className="border-0 bg-transparent p-0 text-white/35 transition hover:text-white"
          >
            Modelos
          </button>
          <span className="mx-2">›</span>
          <span className="text-white/55">{model.label}</span>
          <span className="mx-2">›</span>
          <span className="text-[#D7FF00]">{modeData.label}</span>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#060606] p-5 shadow-[0_0_100px_rgba(215,255,0,.06)] md:p-8">
          <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#D7FF00]/12 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">
                {isImage ? "Geração de imagens" : "Geração de vídeo"}
              </p>

              <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-6xl">
                {isImage ? "Crie imagens com IA sem fricção." : "Transforme texto em vídeo com IA."}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/52 md:text-base">
                {isImage
                  ? "Escolha modelo, resolução, formato e quantidade. Cada imagem gerada cria uma variação única a partir do mesmo prompt."
                  : "Escolha modelo, duração, formato, qualidade e movimento. Gere vídeos prontos para anúncios, redes sociais e campanhas."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-xl font-black text-[#D7FF00]">{model.label}</p>
                  <p className="mt-1 text-xs leading-5 text-white/42">Modelo selecionado</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-xl font-black text-[#D7FF00]">{modeData.label}</p>
                  <p className="mt-1 text-xs leading-5 text-white/42">Modo ativo</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-xl font-black text-[#D7FF00]">
                    {isImage ? `${imageCount} saída${imageCount > 1 ? "s" : ""}` : `${seconds}s`}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-white/42">
                    {isImage ? "Variações únicas" : "Duração do vídeo"}
                  </p>
                </div>
              </div>
            </div>

            <FloatingLogo />
          </div>
        </section>

        <div className="mt-5">
          <PromoBanner />
        </div>

        <section className="mt-5 rounded-[2rem] border border-[#D7FF00]/25 bg-[#0A0A0A] p-4 shadow-[0_0_90px_rgba(215,255,0,.06)] md:p-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                    Prompt
                  </p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.05em] text-white md:text-3xl">
                    Descreva o que você quer criar
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={improvePrompt}
                  className="inline-flex items-center justify-center rounded-xl border border-[#D7FF00]/25 bg-[#D7FF00]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00] transition hover:bg-[#D7FF00] hover:text-black"
                >
                  ✨ Aprimorar prompt
                </button>
              </div>

              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={isImage ? "Ex: perfume de luxo em cenário escuro com luz verde neon..." : "Ex: câmera orbitando um produto premium com luz cinematográfica..."}
                className="min-h-[170px] w-full resize-none rounded-3xl border border-white/12 bg-white/[.025] px-5 py-5 text-sm leading-7 text-white outline-none transition placeholder:text-white/22 focus:border-[#D7FF00]/45 md:min-h-[210px]"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowNegative(!showNegative)}
                  className="rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/55 transition hover:border-[#D7FF00]/35 hover:text-[#D7FF00]"
                >
                  Prompt negativo
                </button>

                <label className="cursor-pointer rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/55 transition hover:border-[#D7FF00]/35 hover:text-[#D7FF00]">
                  Referência
                  <input className="hidden" type="file" accept="image/*,video/*" onChange={handleAssetChange} />
                </label>

                <Link
                  href="/explore"
                  className="rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/55 no-underline transition hover:border-[#D7FF00]/35 hover:text-[#D7FF00]"
                >
                  Explorar prompts
                </Link>
              </div>

              {showNegative && (
                <textarea
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  placeholder="Ex: baixa qualidade, distorcido, borrado, texto errado..."
                  className="mt-3 min-h-[90px] w-full resize-none rounded-2xl border border-white/10 bg-white/[.025] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/22 focus:border-[#D7FF00]/40"
                />
              )}

              {assetPreview && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#D7FF00]">Referência adicionada</p>
                    <button
                      type="button"
                      onClick={() => {
                        setAsset(null);
                        setAssetPreview("");
                      }}
                      className="rounded-lg border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-white/60 hover:text-white"
                    >
                      remover
                    </button>
                  </div>
                  {asset?.type?.startsWith("video/") ? (
                    <video src={assetPreview} controls className="max-h-[260px] w-full rounded-xl object-contain" />
                  ) : (
                    <img src={assetPreview} alt="Reference" className="max-h-[260px] w-full rounded-xl object-contain" />
                  )}
                </div>
              )}
            </div>

            <aside className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
              <div className="grid gap-4">
                <SelectBox
                  label="Modelo"
                  value={modelKey}
                  onChange={selectModel}
                  options={modelEntries}
                />

                <SelectBox
                  label="Modo"
                  value={modeKey}
                  onChange={selectMode}
                  options={modeEntries}
                />

                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                    {isImage ? "Resolução" : "Qualidade"}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(isImage ? IMAGE_RESOLUTIONS : VIDEO_RESOLUTIONS).map((item) => (
                      <OptionButton
                        key={item}
                        active={isImage ? imageResolution === item : videoResolution === item}
                        onClick={() => (isImage ? setImageResolution(item) : setVideoResolution(item))}
                      >
                        {item}
                      </OptionButton>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                    Proporção
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {(isImage ? IMAGE_RATIOS : VIDEO_RATIOS).map((item) => (
                      <OptionButton
                        key={item}
                        active={isImage ? imageRatio === item : videoRatio === item}
                        onClick={() => (isImage ? setImageRatio(item) : setVideoRatio(item))}
                      >
                        {item}
                      </OptionButton>
                    ))}
                  </div>
                </div>

                {isImage ? (
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                      Quantidade
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {IMAGE_COUNTS.map((item) => (
                        <OptionButton
                          key={item}
                          active={imageCount === item}
                          onClick={() => setImageCount(item)}
                        >
                          {item}
                        </OptionButton>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                      Duração
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {VIDEO_SECONDS.map((item) => (
                        <OptionButton
                          key={item}
                          active={seconds === item}
                          onClick={() => setSeconds(item)}
                        >
                          {item}s
                        </OptionButton>
                      ))}
                    </div>
                  </div>
                )}

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                    Estilo / criatividade
                  </span>
                  <select
                    value={creativity}
                    onChange={(event) => setCreativity(event.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm font-bold text-white outline-none transition focus:border-[#D7FF00]/50"
                  >
                    <option value="balanced">Equilibrado</option>
                    <option value="realistic">Mais realista</option>
                    <option value="creative">Mais criativo</option>
                    <option value="cinematic">Cinemático</option>
                  </select>
                </label>

                <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                  <p className="text-xs leading-6 text-white/45">
                    {isImage
                      ? "Cada imagem gerada será uma variação única. Mesmo prompt, resultados diferentes."
                      : `Vídeo de ${seconds}s usa aproximadamente ${seconds * 24} créditos.`}
                  </p>
                  {needsImage && (
                    <p className="mt-2 text-xs leading-6 text-[#D7FF00]/70">
                      Este modo funciona melhor com imagem ou vídeo de referência.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className="min-h-16 rounded-2xl bg-[#D7FF00] px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:scale-[1.01] hover:bg-[#e5ff2f] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loading
                    ? statusText || "Gerando..."
                    : isImage
                      ? `Gerar imagens ✨ ${imageCount}`
                      : `Gerar vídeo ✨ ${seconds}s`}
                </button>
              </div>
            </aside>
          </div>
        </section>

        {upgradeOffer && (
          <section className="mt-5 rounded-[2rem] border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-5 md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Upgrade necessário</p>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">
                  {upgradeOffer?.message || "Você precisa de mais créditos para continuar."}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  Escolha um plano para liberar mais gerações, mais qualidade e modelos premium.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                <Link
                  href={upgradeOffer?.plans?.annual?.href || "/checkout/plan?plan=basic&billing=annual"}
                  className="rounded-2xl bg-[#D7FF00] px-5 py-4 text-black no-underline"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.16em]">Melhor valor</p>
                  <p className="mt-1 text-2xl font-black">{upgradeOffer?.plans?.annual?.price || "$5/mo"}</p>
                </Link>
                <Link
                  href={upgradeOffer?.plans?.monthly?.href || "/checkout/plan?plan=basic&billing=monthly"}
                  className="rounded-2xl border border-white/10 bg-white/[.04] px-5 py-4 text-white no-underline"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">Flexível</p>
                  <p className="mt-1 text-2xl font-black">{upgradeOffer?.plans?.monthly?.price || "$7/mo"}</p>
                </Link>
              </div>
            </div>
          </section>
        )}

        {error && !upgradeOffer && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
            {error}
          </div>
        )}

        {result && (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                  Resultado gerado
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.06em] text-white">
                  {isImage ? "Suas variações estão prontas." : "Seu vídeo está pronto."}
                </h2>
                <p className="mt-2 text-sm text-white/45">
                  {result?.billing?.imageUnlimited
                    ? "Imagem ilimitada — créditos de vídeo não utilizados."
                    : result?.billing?.creditsCharged
                      ? `${result.billing.creditsCharged} créditos usados.`
                      : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00] transition hover:bg-[#D7FF00] hover:text-black disabled:opacity-45"
              >
                Gerar novamente →
              </button>
            </div>

            {resultUrls.length > 0 ? (
              <div className={isImage ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-4" : "grid gap-4"}>
                {resultUrls.map((url, index) => (
                  <div key={url + index} className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2">
                    {isImage ? (
                      <img src={url} alt={`Generated ${index + 1}`} className="w-full rounded-xl object-cover" />
                    ) : (
                      <video src={url} controls className="w-full rounded-xl" />
                    )}

                    <div className="mt-2 flex gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.12em] text-white/60 no-underline hover:text-white"
                      >
                        Abrir
                      </a>
                      <a
                        href={url}
                        download
                        className="flex-1 rounded-xl bg-[#D7FF00] px-3 py-2 text-center text-[11px] font-black uppercase tracking-[0.12em] text-black no-underline"
                      >
                        Baixar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="overflow-auto rounded-2xl border border-white/10 bg-black/50 p-4 text-xs text-white/45">
                {JSON.stringify(result?.data?.raw || result, null, 2)}
              </pre>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
