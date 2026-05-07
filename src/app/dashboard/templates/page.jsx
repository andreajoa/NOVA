"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { falModels } from "@/lib/falModels";

const VIDEO_CREDITS_PER_SECOND = 24;

const MODEL_PREFERENCES = [
  {
    key: "kling",
    badge: "Recomendado",
    title: "Kling 3.0",
    description: "Melhor para animação de produto com movimento realista.",
  },
  {
    key: "seedance",
    badge: "Com áudio",
    title: "Seedance 2.0",
    description: "Áudio nativo sincronizado, perfeito para anúncios com som.",
  },
  {
    key: "happyhorse",
    badge: "Criativo",
    title: "Happy Horse",
    description: "Estilo criativo e expressivo para conteúdo de marca.",
  },
  {
    key: "wan",
    badge: "Open source",
    title: "Wan",
    description: "Open-source robusto, ótimo para volume de produção.",
  },
  {
    key: "lyra",
    badge: "Beta",
    title: "Lyra",
    description: "Alta fidelidade de movimento para produtos premium.",
  },
  {
    key: "kling-avatar",
    badge: "Avatar",
    title: "Kling Avatar",
    description: "Gera avatar com lipsync — ideal para UGC com apresentador.",
  },
];

const DURATION_RULES = {
  seedance: [5, 10],
  kling: [5, 10],
  wan: [5],
  happyhorse: [5, 10],
  lyra: [5],
  "kling-avatar": [5, 10],
};

function durationOptionsFor(key) {
  return DURATION_RULES[key] || [5, 10];
}

function bestModeKey(model) {
  const entries = Object.entries(model?.modes || {});
  if (!entries.length) return "";
  const imageMode = entries.find(([, mode]) => mode?.needsImage);
  return imageMode?.[0] || entries[0][0];
}

function availableModels() {
  return MODEL_PREFERENCES
    .map((item) => {
      const model = falModels.video?.[item.key];
      if (!model) return null;
      const modeKey = bestModeKey(model);
      const modeData = model.modes?.[modeKey];
      if (!modeKey || !modeData?.endpoint) return null;
      return {
        ...item,
        model,
        modeKey,
        modeData,
        label: model.label || item.title,
      };
    })
    .filter(Boolean);
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

function collectUrl(data) {
  const raw = data?.data?.raw || {};
  return (
    data?.data?.url ||
    raw?.video?.url ||
    raw?.videos?.[0]?.url ||
    raw?.output?.url ||
    null
  );
}


function shouldOpenUpgrade(res, data) {
  const msg = String(data?.error || data?.message || "").toLowerCase();
  return (
    res.status === 402 ||
    res.status === 403 ||
    data?.code === "INSUFFICIENT_CREDITS" ||
    data?.code === "IMAGE_TRIAL_LIMIT_REACHED" ||
    msg.includes("forbidden") ||
    msg.includes("insufficient") ||
    msg.includes("saldo insuficiente")
  );
}

function normalizeUpgrade(data) {
  return {
    ...data,
    code: data?.code || "INSUFFICIENT_CREDITS",
    error: data?.error || "INSUFFICIENT_CREDITS",
    message:
      data?.message && !String(data.message).toLowerCase().includes("forbidden")
        ? data.message
        : "Saldo insuficiente para gerar. Faça upgrade para continuar.",
    plans: data?.plans || {
      annual: { label: "Annual", price: "$5/mo", href: "/checkout/plan?plan=basic&billing=annual" },
      monthly: { label: "Monthly", price: "$7/mo", href: "/checkout/plan?plan=basic&billing=monthly" },
    },
  };
}

export default function UGCProdutoPage() {
  const models = useMemo(() => availableModels(), []);
  const firstKey = models[0]?.key || "";

  const [selectedKey, setSelectedKey] = useState(firstKey);
  const selected = models.find((item) => item.key === selectedKey) || models[0];

  const [productFile, setProductFile] = useState(null);
  const [productPreview, setProductPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const durationOptions = durationOptionsFor(selected?.key);
  const [seconds, setSeconds] = useState(durationOptions[0] || 5);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [prompt, setPrompt] = useState(
    "Crie um vídeo UGC de produto com energia premium, movimento de câmera suave, destaque no produto, estética moderna, iluminação cinematográfica e chamada visual forte para redes sociais."
  );

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [error, setError] = useState("");
  const [upgradeOffer, setUpgradeOffer] = useState(null);

  function onProductChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setProductFile(file);
    setProductPreview(URL.createObjectURL(file));
  }

  function onLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function chooseModel(key) {
    setSelectedKey(key);
    const allowed = durationOptionsFor(key);
    setSeconds(allowed[0] || 5);
    setResultUrl("");
    setError("");
    setUpgradeOffer(null);
  }

  async function handleGenerate() {
    if (!selected?.modeData?.endpoint) {
      setError("Modelo de vídeo não encontrado.");
      return;
    }

    if (!productFile) {
      setError("Envie uma imagem ou vídeo do produto antes de gerar.");
      return;
    }

    setLoading(true);
    setStatusText("Uploading product...");
    setError("");
    setResultUrl("");
    setUpgradeOffer(null);

    try {
      const productUrl = await uploadReference(productFile);

      let finalPrompt = prompt.trim();
      if (logoFile) {
        setStatusText("Uploading logo...");
        const logoUrl = await uploadReference(logoFile);
        finalPrompt += ` Use a marca/logo como referência visual quando possível: ${logoUrl}`;
      }

      setStatusText("Generating UGC video...");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: selected.modeData.endpoint,
          prompt: finalPrompt,
          image_url: productUrl,
          model: selected.key,
          mode: selected.modeKey,
          type: "video",
          aspect_ratio: aspectRatio,
          duration: seconds,
          seconds,
          hasAsset: true,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (shouldOpenUpgrade(res, data)) {
        setUpgradeOffer(normalizeUpgrade(data));
        return;
      }

      if (!res.ok || !data?.success) {
        throw new Error(
        String(data?.message || data?.error || "").toLowerCase().includes("forbidden")
          ? "Saldo insuficiente para gerar. Faça upgrade para continuar."
          : data?.message || data?.error || "Falha ao gerar vídeo UGC."
      );
      }

      const url = collectUrl(data);
      if (!url) throw new Error("A geração terminou, mas não retornou URL de vídeo.");

      setResultUrl(url);
      window.dispatchEvent(new Event("nova:credits-refresh"));
    } catch (err) {
      setError(err?.message || "Falha ao gerar vídeo UGC.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  }

  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707] p-5 shadow-[0_0_90px_rgba(215,255,0,.07)] md:p-8">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#D7FF00]/12 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00]">Criação</p>
            <h1 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-6xl">
              UGC Produto
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50 md:text-base">
              Envie seu produto, adicione logo opcional, escolha modelo, duração compatível e gere um vídeo UGC pronto para anúncio.
            </p>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-white/35">Produto / Cena</p>
            <label className="grid min-h-[240px] cursor-pointer place-items-center overflow-hidden rounded-[1.6rem] border border-dashed border-white/15 bg-white/[.025] transition hover:border-[#D7FF00]/50">
              {productPreview ? (
                productFile?.type?.startsWith("video/") ? (
                  <video src={productPreview} controls className="h-full max-h-[320px] w-full object-contain" />
                ) : (
                  <img src={productPreview} alt="Produto" className="h-full max-h-[320px] w-full object-contain" />
                )
              ) : (
                <div className="text-center">
                  <p className="mb-2 text-4xl text-white/25">+</p>
                  <p className="text-sm text-white/35">Imagem ou vídeo do produto</p>
                </div>
              )}
              <input className="hidden" type="file" accept="image/*,video/*" onChange={onProductChange} />
            </label>
          </div>

          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-white/35">Logo opcional</p>
            <label className="grid min-h-[240px] cursor-pointer place-items-center overflow-hidden rounded-[1.6rem] border border-dashed border-white/15 bg-white/[.025] transition hover:border-[#D7FF00]/50">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-full max-h-[260px] w-full object-contain" />
              ) : (
                <div className="text-center">
                  <p className="mb-2 text-4xl text-white/25">+</p>
                  <p className="text-sm text-white/35">Logo da marca</p>
                </div>
              )}
              <input className="hidden" type="file" accept="image/*" onChange={onLogoChange} />
            </label>
          </div>
        </section>

        <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D7FF00]">Escolha o modelo</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.06em]">Modelo, duração e formato</h2>
            </div>

            <Link href="/pricing" className="rounded-xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00] no-underline transition hover:bg-[#D7FF00] hover:text-black">
              Upgrade →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {models.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => chooseModel(item.key)}
                className={
                  "rounded-[1.35rem] border p-5 text-left transition hover:-translate-y-1 " +
                  (selected?.key === item.key
                    ? "border-[#D7FF00] bg-[#D7FF00]/12 shadow-[0_0_70px_rgba(215,255,0,.10)]"
                    : "border-white/10 bg-black/35 hover:border-[#D7FF00]/40")
                }
              >
                <span className="rounded-full bg-[#D7FF00] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-black">
                  {item.badge}
                </span>
                <h3 className="mt-4 text-xl font-black uppercase text-white">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-white/45">{item.description}</p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00]">
                  Suporta {durationOptionsFor(item.key).map((s) => `${s}s`).join(", ")}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-white/35">Prompt do vídeo</p>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                className="min-h-[150px] w-full resize-none rounded-3xl border border-white/12 bg-white/[.025] px-5 py-5 text-sm leading-7 text-white outline-none transition placeholder:text-white/22 focus:border-[#D7FF00]/45"
              />
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Duração suportada</p>
              <div className="grid grid-cols-3 gap-2">
                {durationOptionsFor(selected?.key).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSeconds(item)}
                    className={
                      "rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition " +
                      (seconds === item
                        ? "border-[#D7FF00] bg-[#D7FF00] text-black"
                        : "border-white/10 bg-white/[.035] text-white/55 hover:border-[#D7FF00]/40 hover:text-[#D7FF00]")
                    }
                  >
                    {item}s
                  </button>
                ))}
              </div>

              <p className="mb-2 mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Formato</p>
              <div className="grid grid-cols-3 gap-2">
                {["9:16", "16:9", "1:1"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAspectRatio(item)}
                    className={
                      "rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition " +
                      (aspectRatio === item
                        ? "border-[#D7FF00] bg-[#D7FF00] text-black"
                        : "border-white/10 bg-white/[.035] text-white/55 hover:border-[#D7FF00]/40 hover:text-[#D7FF00]")
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <p className="text-xs leading-6 text-white/45">
                  Vídeo de {seconds}s usa aproximadamente <span className="font-black text-[#D7FF00]">{seconds * VIDEO_CREDITS_PER_SECOND} créditos</span>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !productFile}
                className="mt-5 min-h-16 w-full rounded-2xl bg-[#D7FF00] px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:scale-[1.01] hover:bg-[#e5ff2f] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? statusText || "Gerando..." : `Gerar vídeo UGC → ${seconds}s`}
              </button>
            </div>
          </div>
        </section>

        {upgradeOffer && (
          <section className="mt-5 rounded-[2rem] border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Upgrade necessário</p>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">
              {upgradeOffer?.message || "Você precisa de mais créditos para continuar."}
            </h3>
            <Link href="/pricing" className="mt-5 inline-flex rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black no-underline">
              Ver planos →
            </Link>
          </section>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
            {error}
          </div>
        )}

        {resultUrl && (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#070707] p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Resultado gerado</p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.06em] text-white">Seu vídeo UGC está pronto.</h2>
              </div>
              <a href={resultUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/60 no-underline hover:text-white">
                Abrir vídeo
              </a>
            </div>

            <video src={resultUrl} controls className="w-full rounded-2xl" />
          </section>
        )}
      </div>
    </main>
  );
}
