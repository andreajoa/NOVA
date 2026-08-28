"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { publicGenerationModels as novaModels } from "@/lib/publicGenerationCatalog";
import { extractGeneratedMediaUrl, isVideoUrl } from "@/lib/generatedMediaUrl";
import {
  getVideoResolutionOptions,
  normalizeVideoResolutionForModel,
} from "@/lib/videoResolutionOptions";

const IMAGE_RATIOS = ["1:1", "9:16", "16:9", "4:5"];
const VIDEO_RATIOS = ["9:16", "16:9", "1:1"];
const PREMIUM_IMAGE_RESOLUTIONS = ["1K", "2K", "4K"];
const PREMIUM_IMAGE_COUNTS = [1, 2, 4];

const VIDEO_DURATION_RULES = {
  seedance: [5, 10],
  kling: [5, 10],
  veo: [5, 8],
  wan: [5],
  pixverse: [5, 8],
  happyhorse: [5, 10],
  lyra: [5],
  lucy: [5],
  "kling-avatar": [5, 10],
};

function getModelType(modelKey) {
  if (novaModels.image?.[modelKey]) return "image";
  if (novaModels.video?.[modelKey]) return "video";
  return null;
}

function getModel(modelKey) {
  return novaModels.image?.[modelKey] || novaModels.video?.[modelKey] || null;
}

function getEntries(forceType) {
  if (forceType === "image") return Object.entries(novaModels.image || {});
  if (forceType === "video") return Object.entries(novaModels.video || {});
  return [...Object.entries(novaModels.image || {}), ...Object.entries(novaModels.video || {})];
}

function bestModeKey(model) {
  return Object.keys(model?.modes || {})[0] || "";
}

function resolveInitialModel(initialModelKey, forceType) {
  const entries = getEntries(forceType);
  const fallback = entries[0]?.[0] || "";
  if (!initialModelKey) return fallback;
  const type = getModelType(initialModelKey);
  if (!type || (forceType && type !== forceType)) return fallback;
  return initialModelKey;
}

function premiumDurationOptions(modelKey, model) {
  const key = String(modelKey || "").toLowerCase();
  const label = String(model?.label || "").toLowerCase();
  for (const [needle, durations] of Object.entries(VIDEO_DURATION_RULES)) {
    if (key.includes(needle) || label.includes(needle)) return durations;
  }
  return [5, 10];
}

function imageSizeFrom(aspectRatio, resolution) {
  if (aspectRatio === "16:9") return "landscape_16_9";
  if (aspectRatio === "9:16") return "portrait_16_9";
  if (aspectRatio === "4:5") return "portrait_4_3";
  return resolution === "1K" ? "square" : "square_hd";
}

function collectUrls(payload) {
  const urls = [];
  const seen = new Set();

  function add(value) {
    if (!value || typeof value !== "string") return;
    if (/^data:(image|video)\//i.test(value)) {
      urls.push(value);
      return;
    }
    const matches = value.match(/https?:\/\/[^\s"'<>\\]+/g) || [];
    for (const raw of matches) {
      const clean = raw
        .replace(/\\u0026/g, "&")
        .replace(/&amp;/g, "&")
        .replace(/[),.;\]]+$/g, "");
      if (/^https?:\/\//i.test(clean)) urls.push(clean);
    }
  }

  function walk(value) {
    if (value == null) return;
    if (typeof value === "string") return add(value);
    if (typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) return value.forEach(walk);
    Object.values(value).forEach(walk);
  }

  walk(payload);
  return [...new Set(urls)].filter((url) =>
    /^data:(image|video)\//i.test(url) ||
    /\.(mp4|webm|mov|png|jpg|jpeg|webp)(\?|#|$)/i.test(url) ||
    /video/i.test(url)
  );
}

function OptionButton({ active, children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        "rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-30 " +
        (active
          ? "border-[#D7FF00] bg-[#D7FF00] text-black shadow-[0_0_35px_rgba(215,255,0,.18)]"
          : "border-white/10 bg-white/[.035] text-white/55 hover:border-[#D7FF00]/45 hover:text-[#D7FF00]")
      }
    >
      {children}
    </button>
  );
}

function SelectBox({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-white/10 bg-black/45 px-4 text-sm font-bold text-white outline-none transition focus:border-[#D7FF00]/50"
      >
        {options.map(([key, item]) => (
          <option key={key} value={key}>{item.label || key}</option>
        ))}
      </select>
    </label>
  );
}

async function uploadReference(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || "Upload failed");
  const url = data?.url || data?.publicUrl || data?.fileUrl || data?.location;
  if (!url) throw new Error("Upload completed, but no public URL was returned.");
  return url;
}

function shouldOpenUpgrade(res, data) {
  return (
    res.status === 402 ||
    data?.code === "INSUFFICIENT_CREDITS" ||
    data?.code === "IMAGE_TRIAL_LIMIT_REACHED" ||
    data?.code === "FREE_MODEL_DAILY_LIMIT_REACHED"
  );
}

function modelGeneratesAudio(modelKey) {
  if (modelKey === "nova-video-free") return false;
  return !["kling", "pixverse", "happyhorse", "wan"].some((needle) =>
    String(modelKey || "").toLowerCase().includes(needle)
  );
}

function formatReset(resetAt) {
  if (!resetAt) return "renovação diária";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(resetAt));
  } catch {
    return "renovação diária";
  }
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
  const resolvedInitialMode = initialModeKey && initialModel?.modes?.[initialModeKey]
    ? initialModeKey
    : bestModeKey(initialModel);

  const [modelKey, setModelKey] = useState(resolvedInitialModel);
  const [modeKey, setModeKey] = useState(resolvedInitialMode);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [showNegative, setShowNegative] = useState(false);
  const [imageResolution, setImageResolution] = useState("2K");
  const [videoResolution, setVideoResolution] = useState("720p");
  const [imageRatio, setImageRatio] = useState("1:1");
  const [videoRatio, setVideoRatio] = useState("16:9");
  const [imageCount, setImageCount] = useState(2);
  const [seconds, setSeconds] = useState(5);
  const [asset, setAsset] = useState(null);
  const [assetPreview, setAssetPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState(null);
  const [upgradeOffer, setUpgradeOffer] = useState(null);
  const [error, setError] = useState("");
  const [freeUsage, setFreeUsage] = useState(null);

  const activeType = getModelType(modelKey) || forceType || "image";
  const isImage = activeType === "image";
  const model = getModel(modelKey);
  const modeData = model?.modes?.[modeKey];
  const modelEntries = getEntries(forceType);
  const modeEntries = Object.entries(model?.modes || {});
  const isBrandedFree = model?.tier === "free";
  const freeBucket = isImage ? freeUsage?.image : freeUsage?.video;
  const premiumDurations = useMemo(() => premiumDurationOptions(modelKey, model), [modelKey, model]);
  const durationOptions = isBrandedFree && !isImage
    ? (freeUsage?.video?.durations || [5])
    : premiumDurations;
  const videoResolutionOptions = useMemo(
    () => getVideoResolutionOptions(modelKey, modeKey),
    [modelKey, modeKey]
  );
  const needsImage = Boolean(modeData?.needsImage);
  const resultUrls = result ? collectUrls(result) : [];

  async function refreshFreeUsage() {
    try {
      const res = await fetch("/api/free-usage", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) setFreeUsage(data);
    } catch {
      // Quota enforcement remains server-side even if the counter cannot render.
    }
  }

  useEffect(() => {
    refreshFreeUsage();
    const params = new URLSearchParams(window.location.search);
    const queryPrompt = params.get("prompt");
    if (queryPrompt) setPrompt(queryPrompt);
  }, []);

  useEffect(() => {
    if (isBrandedFree && isImage) {
      setImageResolution("1K");
      setImageCount(1);
    }
    if (isBrandedFree && !isImage) {
      setVideoResolution("480p");
    }
  }, [isBrandedFree, isImage, modelKey]);

  useEffect(() => {
    if (!durationOptions.includes(seconds)) setSeconds(durationOptions[0] || 5);
  }, [durationOptions, seconds]);

  useEffect(() => {
    if (isImage || !videoResolutionOptions.length) return;
    const normalized = normalizeVideoResolutionForModel(modelKey, modeKey, videoResolution);
    if (normalized && normalized !== videoResolution) setVideoResolution(normalized);
  }, [isImage, modelKey, modeKey, videoResolution, videoResolutionOptions]);

  function selectModel(nextModelKey) {
    const nextModel = getModel(nextModelKey);
    const nextMode = bestModeKey(nextModel);
    setModelKey(nextModelKey);
    setModeKey(nextMode);
    setResult(null);
    setUpgradeOffer(null);
    setError("");
    if (syncRoute && nextMode) router.push(`/dashboard/models/${nextModelKey}/${nextMode}`);
  }

  function selectMode(nextMode) {
    setModeKey(nextMode);
    setResult(null);
    setUpgradeOffer(null);
    setError("");
    if (syncRoute) router.push(`/dashboard/models/${modelKey}/${nextMode}`);
  }

  function handleAssetChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAsset(file);
    setAssetPreview(URL.createObjectURL(file));
    if (modelKey === "gpt-image" && modeKey === "text-to-image") setModeKey("image-editing");
    setResult(null);
    setError("");
  }

  async function handleGenerate() {
    if (!prompt.trim() || !modeData) return;
    if (needsImage && !asset) {
      setError("Adicione uma imagem de referência para usar este modo.");
      return;
    }

    setLoading(true);
    setStatusText(asset ? "Enviando referência..." : "Preparando geração...");
    setError("");
    setResult(null);
    setUpgradeOffer(null);

    try {
      let imageUrl = "";
      if (asset) imageUrl = await uploadReference(asset);
      setStatusText(isImage ? "Gerando imagem..." : "Gerando vídeo...");

      const payload = {
        prompt,
        negative_prompt: negativePrompt,
        model: modelKey,
        mode: modeKey,
        ...(imageUrl && { image_url: imageUrl }),
        ...(isImage
          ? {
              aspect_ratio: imageRatio,
              image_size: imageSizeFrom(imageRatio, imageResolution),
              num_images: isBrandedFree ? 1 : imageCount,
            }
          : {
              aspect_ratio: videoRatio,
              resolution: isBrandedFree
                ? "480p"
                : normalizeVideoResolutionForModel(modelKey, modeKey, videoResolution),
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

      if (shouldOpenUpgrade(res, data)) {
        setUpgradeOffer(data);
        await refreshFreeUsage();
        return;
      }
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || data?.error || "Não foi possível gerar agora. Tente novamente.");
      }

      setResult(data);
      await refreshFreeUsage();
      window.dispatchEvent(new Event("nova:credits-refresh"));
    } catch (err) {
      setError(err?.message || "Generation failed");
      await refreshFreeUsage();
    } finally {
      setLoading(false);
      setStatusText("");
    }
  }

  if (!model || !modeData) {
    return (
      <main className="min-h-screen bg-[#020303] p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-8">Modelo ou modo não encontrado.</div>
      </main>
    );
  }

  const quotaExhausted = isBrandedFree && freeBucket && freeBucket.remaining <= 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#020303] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 md:px-6 md:py-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#060606] p-5 shadow-[0_0_100px_rgba(215,255,0,.06)] md:p-8">
          <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#D7FF00]/12 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">{isImage ? "Geração de imagem" : "Geração de vídeo"}</p>
                {isBrandedFree && <span className="rounded-full bg-[#D7FF00] px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-black">0 créditos</span>}
              </div>
              <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-6xl">{model.label}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/52 md:text-base">{model.description}</p>
            </div>
            {isBrandedFree && freeBucket && (
              <div className="min-w-[250px] rounded-2xl border border-[#D7FF00]/25 bg-[#D7FF00]/8 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D7FF00]">Disponível hoje</p>
                <p className="mt-2 text-3xl font-black">{freeBucket.remaining} <span className="text-base text-white/35">/ {freeBucket.limit}</span></p>
                <p className="mt-1 text-xs text-white/40">Renova diariamente · próximo reset {formatReset(freeUsage?.resetAt)}</p>
              </div>
            )}
          </div>
        </section>

        {!isBrandedFree && (
          <Link href="/dashboard/free" className="mt-5 flex items-center justify-between rounded-2xl border border-[#D7FF00]/25 bg-[#D7FF00]/8 px-5 py-4 no-underline">
            <span className="text-sm font-black uppercase tracking-[0.12em] text-[#D7FF00]">Quer gerar sem gastar créditos?</span>
            <span className="text-xs font-black uppercase text-white">Gerar grátis agora →</span>
          </Link>
        )}

        <section className="mt-5 rounded-[2rem] border border-[#D7FF00]/25 bg-[#0A0A0A] p-4 md:p-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Prompt</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.05em] md:text-3xl">Descreva o que você quer criar</h2>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={isImage ? "Ex: produto premium em cenário cinematográfico..." : "Ex: câmera se aproximando do produto enquanto a luz muda suavemente..."}
                className="mt-4 min-h-[190px] w-full resize-none rounded-3xl border border-white/12 bg-white/[.025] px-5 py-5 text-sm leading-7 text-white outline-none placeholder:text-white/22 focus:border-[#D7FF00]/45"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowNegative((v) => !v)} className="rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/55">Prompt negativo</button>
                {(needsImage || !isImage) && (
                  <label className="cursor-pointer rounded-xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/55">
                    Adicionar referência
                    <input className="hidden" type="file" accept="image/*" onChange={handleAssetChange} />
                  </label>
                )}
              </div>

              {showNegative && (
                <textarea
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  placeholder="Ex: borrado, baixa qualidade, distorcido..."
                  className="mt-3 min-h-[90px] w-full resize-none rounded-2xl border border-white/10 bg-white/[.025] px-4 py-4 text-sm text-white outline-none"
                />
              )}

              {assetPreview && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-black uppercase text-[#D7FF00]">Referência adicionada</p>
                    <button type="button" onClick={() => { setAsset(null); setAssetPreview(""); }} className="text-xs text-white/45">remover</button>
                  </div>
                  <img src={assetPreview} alt="Reference" className="max-h-[300px] w-full rounded-xl object-contain" />
                </div>
              )}
            </div>

            <aside className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
              <div className="grid gap-4">
                <SelectBox label="Modelo" value={modelKey} onChange={selectModel} options={modelEntries} />
                <SelectBox label="Modo" value={modeKey} onChange={selectMode} options={modeEntries} />

                {isBrandedFree && (
                  <div className="rounded-2xl border border-[#D7FF00]/25 bg-[#D7FF00]/8 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#D7FF00]">Incluído · 0 créditos</p>
                    <p className="mt-2 text-xs leading-5 text-white/45">
                      {isImage
                        ? `${freeBucket?.limit ?? 10} imagens por dia · 1K · 1 imagem por geração.`
                        : `${freeBucket?.limit ?? 3} vídeos por dia · 480p · ${durationOptions.join(" ou ")} segundos.`}
                    </p>
                  </div>
                )}

                {!isImage && !modelGeneratesAudio(modelKey) && (
                  <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Vídeo sem áudio</p>
                    <p className="mt-2 text-xs text-white/35">Adicione música ou voz depois da geração.</p>
                  </div>
                )}

                {isImage ? (
                  <>
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Resolução</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(isBrandedFree ? ["1K"] : PREMIUM_IMAGE_RESOLUTIONS).map((item) => (
                          <OptionButton key={item} active={imageResolution === item} onClick={() => setImageResolution(item)}>{item}</OptionButton>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Quantidade</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(isBrandedFree ? [1] : PREMIUM_IMAGE_COUNTS).map((item) => (
                          <OptionButton key={item} active={imageCount === item} onClick={() => setImageCount(item)}>{item}</OptionButton>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {videoResolutionOptions.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Resolução</p>
                        <div className="grid grid-cols-3 gap-2">
                          {videoResolutionOptions.map(([key, item]) => (
                            <OptionButton key={key} active={videoResolution === key} onClick={() => setVideoResolution(key)}>{item.label || key}</OptionButton>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Duração</p>
                      <div className="grid grid-cols-3 gap-2">
                        {durationOptions.map((item) => (
                          <OptionButton key={item} active={seconds === item} onClick={() => setSeconds(item)}>{item}s</OptionButton>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Proporção</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(isImage ? IMAGE_RATIOS : VIDEO_RATIOS).map((item) => (
                      <OptionButton key={item} active={isImage ? imageRatio === item : videoRatio === item} onClick={() => isImage ? setImageRatio(item) : setVideoRatio(item)}>{item}</OptionButton>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-xs leading-6 text-white/45">
                  {isBrandedFree
                    ? `Esta geração usa 0 créditos. Restam ${freeBucket?.remaining ?? "—"} de ${freeBucket?.limit ?? "—"} hoje.`
                    : isImage
                      ? "Cada imagem será uma variação única do mesmo prompt."
                      : `Vídeo de ${seconds}s usa aproximadamente ${seconds * 24} créditos.`}
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim() || quotaExhausted}
                  className="min-h-16 rounded-2xl bg-[#D7FF00] px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-[#e5ff2f] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loading
                    ? statusText || "Gerando..."
                    : quotaExhausted
                      ? "Limite diário utilizado"
                      : isBrandedFree
                        ? isImage ? "GERAR IMAGEM GRÁTIS" : `GERAR VÍDEO GRÁTIS · ${seconds}s`
                        : isImage ? `Gerar imagens · ${imageCount}` : `Gerar vídeo · ${seconds}s`}
                </button>
              </div>
            </aside>
          </div>
        </section>

        {upgradeOffer && (
          <section className="mt-5 rounded-[2rem] border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Limite utilizado</p>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em]">{upgradeOffer?.message || "Upgrade para continuar."}</h3>
            <Link href="/pricing" className="mt-5 inline-flex rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black no-underline">Ver planos →</Link>
          </section>
        )}

        {error && !upgradeOffer && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>
        )}

        {result && (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Resultado gerado</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.06em]">{isImage ? "Sua imagem está pronta." : "Seu vídeo está pronto."}</h2>

            <div className={isImage ? "mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" : "mt-5 grid gap-4"}>
              {resultUrls.map((url, index) => {
                const dataUrl = /^data:/i.test(url);
                const fileName = isImage ? `nova-image-${index + 1}.jpg` : `nova-video-${index + 1}.mp4`;
                const downloadHref = dataUrl
                  ? url
                  : `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(fileName)}`;

                return (
                  <div key={index} className="mx-auto w-full max-w-[920px] overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-3">
                    {isImage ? (
                      <img src={url} alt={`Generated ${index + 1}`} className="max-h-[70vh] w-full rounded-xl object-contain" />
                    ) : (
                      <video src={url} controls playsInline preload="metadata" className="aspect-video max-h-[70vh] w-full rounded-xl bg-black object-contain" />
                    )}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      {!dataUrl && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-xl border border-white/10 px-3 py-3 text-center text-[11px] font-black uppercase text-white/60 no-underline">Abrir</a>
                      )}
                      <a href={downloadHref} download={dataUrl ? fileName : undefined} className="flex-1 rounded-xl bg-[#D7FF00] px-3 py-3 text-center text-[11px] font-black uppercase text-black no-underline">Download</a>
                      {!isImage && /^https?:\/\//i.test(url) && (
                        <Link href={`/dashboard/video-tools?source=${encodeURIComponent(url)}`} className="flex-1 rounded-xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 px-3 py-3 text-center text-[11px] font-black uppercase text-[#D7FF00] no-underline">+ Continuar vídeo</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!resultUrls.length && (
              <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm text-yellow-100">A geração terminou, mas não recebemos uma mídia válida. Tente novamente.</div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
