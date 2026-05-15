"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TEMPLATE_CATEGORIES, VIRAL_TEMPLATES, getTemplateById } from "@/lib/viralTemplates";

const IMAGE_TEXT_ENDPOINT = "openai/gpt-image-2";
const IMAGE_EDIT_ENDPOINT = "openai/gpt-image-2/edit";
const VIDEO_TEXT_ENDPOINT = "bytedance/seedance-2.0/text-to-video";
const VIDEO_IMAGE_ENDPOINT = "bytedance/seedance-2.0/image-to-video";

const durations = [5, 8, 10, 12, 15];
const ratios = ["9:16", "1:1", "16:9"];
const resolutions = ["480p", "720p"];

function extractUrls(payload) {
  const urls = [];
  const seen = new Set();

  function add(value) {
    if (!value || typeof value !== "string") return;
    const matches = value.match(/https?:\/\/[^\s"'<>\\]+/g) || [];

    for (const raw of matches.length ? matches : [value]) {
      const clean = String(raw)
        .replace(/\\u0026/g, "&")
        .replace(/&amp;/g, "&")
        .replace(/[),.;\]]+$/g, "");

      if (/^https?:\/\//i.test(clean)) urls.push(clean);
    }
  }

  function walk(value) {
    if (value == null) return;

    if (typeof value === "string") {
      add(value);
      return;
    }

    if (typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    const priority = [
      "generatedMediaUrls",
      "mediaUrl",
      "outputUrl",
      "videoUrl",
      "imageUrl",
      "url",
      "video",
      "videos",
      "image",
      "images",
      "data",
      "output",
      "result",
      "raw",
      "rawOutput",
    ];

    for (const key of priority) {
      if (key in value) walk(value[key]);
    }

    for (const key of Object.keys(value)) {
      if (!priority.includes(key)) walk(value[key]);
    }
  }

  walk(payload);
  return [...new Set(urls)];
}

function pickMediaUrl(payload, type = "auto") {
  const urls = extractUrls(payload);

  if (type === "video") {
    return urls.find((url) => /\.(mp4|webm|mov)(\?|#|$)/i.test(url) || /video/i.test(url)) || urls[0] || "";
  }

  if (type === "image") {
    return urls.find((url) => /\.(png|jpg|jpeg|webp)(\?|#|$)/i.test(url) || /image/i.test(url)) || urls[0] || "";
  }

  return urls[0] || "";
}

function isVideoUrl(url) {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(String(url || "")) || /video/i.test(String(url || ""));
}

function downloadHref(url, filename) {
  return `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
}

function buildFinalPrompt(template, hookText, extraPrompt) {
  const userPart = [hookText, extraPrompt].filter(Boolean).join("\n\nUser request:\n");

  return [
    template.prompt,
    userPart ? `User request:\n${userPart}` : "",
    "Quality rules: professional result, clean composition, no watermark, no broken anatomy, no distorted product, no random text unless the user requested text.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function templatePreviewSrc(template, extension = "png") {
  return `/nova/template-previews/${template.id}.${extension}`;
}

function handleTemplatePreviewError(event, template) {
  if (event.currentTarget.dataset.fallback === "true") return;
  event.currentTarget.dataset.fallback = "true";
  event.currentTarget.src = templatePreviewSrc(template, "svg");
}

function TemplateCard({ template, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full min-w-0 rounded-[1.5rem] border p-4 text-left transition",
        active
          ? "border-[#D7FF00] bg-[#D7FF00]/10 shadow-[0_0_45px_rgba(215,255,0,.14)]"
          : "border-white/10 bg-white/[0.025] hover:border-[#D7FF00]/40 hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <img
          src={templatePreviewSrc(template)}
          onError={(event) => handleTemplatePreviewError(event, template)}
          alt={`${template.name} template preview`}
          className="aspect-video w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          loading="lazy"
        />

        <div className="absolute left-3 top-3 rounded-full border border-black/20 bg-[#D7FF00] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-black">
          Example
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D7FF00]">
            {template.category}
          </p>
          <h3 className="mt-2 text-lg font-black uppercase leading-tight tracking-[-0.04em] text-white">
            {template.name}
          </h3>
        </div>

        <span className="rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45">
          {template.badge}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/45">
        {template.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
          {template.output}
        </span>
        <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
          {template.requiresImage ? "image upload" : "prompt"}
        </span>
        {template.recommended && (
          <span className="rounded-full bg-[#D7FF00] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-black">
            recommended
          </span>
        )}
      </div>
    </button>
  );
}

function Pill({ active, children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "shrink-0 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition",
        active
          ? "border-[#D7FF00] bg-[#D7FF00] text-black"
          : "border-white/10 bg-white/[0.035] text-white/55 hover:border-[#D7FF00]/40 hover:text-[#D7FF00]",
        disabled ? "cursor-not-allowed opacity-40" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function ViralTemplateStudioPage() {
  const [category, setCategory] = useState("All");
  const [templateId, setTemplateId] = useState(VIRAL_TEMPLATES[0].id);
  const [asset, setAsset] = useState(null);
  const [assetPreview, setAssetPreview] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [hookText, setHookText] = useState("");
  const [extraPrompt, setExtraPrompt] = useState("");
  const [duration, setDuration] = useState(VIRAL_TEMPLATES[0].defaultDuration || 5);
  const [ratio, setRatio] = useState(VIRAL_TEMPLATES[0].defaultRatio || "9:16");
  const [resolution, setResolution] = useState(VIRAL_TEMPLATES[0].defaultResolution || "480p");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [upgradeOffer, setUpgradeOffer] = useState(null);
  const [intermediateImage, setIntermediateImage] = useState("");

  const selectedTemplate = useMemo(() => getTemplateById(templateId), [templateId]);

  const filteredTemplates = useMemo(() => {
    if (category === "All") return VIRAL_TEMPLATES;
    return VIRAL_TEMPLATES.filter((template) => template.category === category);
  }, [category]);

  const resultUrl = useMemo(() => {
    if (!result) return "";
    return pickMediaUrl(result, selectedTemplate.output);
  }, [result, selectedTemplate.output]);

  function selectTemplate(id) {
    const next = getTemplateById(id);
    setTemplateId(id);
    setDuration(next.defaultDuration || 5);
    setRatio(next.defaultRatio || "9:16");
    setResolution(next.defaultResolution || "480p");
    setError("");
    setResult(null);
    setUpgradeOffer(null);
    setIntermediateImage("");
  }

  function handleAssetChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAsset(file);
    setAssetPreview(URL.createObjectURL(file));
    setUploadedUrl("");
    setResult(null);
    setIntermediateImage("");
    setError("");
  }

  async function uploadAssetIfNeeded() {
    if (uploadedUrl) return uploadedUrl;

    if (!asset) {
      if (selectedTemplate.requiresImage) {
        throw new Error("Upload an image first for this template.");
      }

      return "";
    }

    setStatusText("Uploading reference image...");

    const formData = new FormData();
    formData.append("file", asset);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.error || "Could not upload image.");
    }

    const url = pickMediaUrl(data, "image") || extractUrls(data)[0];

    if (!url) {
      throw new Error("Upload worked, but NOVA did not return a public image URL.");
    }

    setUploadedUrl(url);
    return url;
  }

  async function callGenerate(body) {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (
      response.status === 402 ||
      data?.code === "INSUFFICIENT_CREDITS" ||
      data?.code === "IMAGE_TRIAL_LIMIT_REACHED"
    ) {
      const upgrade = {
        ...data,
        code: data?.code || "INSUFFICIENT_CREDITS",
        title: data?.title || "More credits needed",
        message:
          data?.message ||
          "You need more credits to generate this creative. Recharge your balance or choose a plan to continue.",
        cta: data?.cta || "Recharge credits",
        href: data?.href || data?.checkoutUrl || "/pricing",
      };
      setUpgradeOffer(upgrade);
      throw new Error("__NOVA_UPGRADE_REQUIRED__");
    }

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || data?.error || "Generation failed.");
    }

    window.dispatchEvent(new Event("nova:credits-refresh"));

    return data;
  }

  async function generateImage(referenceUrl, customPrompt) {
    const useEdit = Boolean(referenceUrl);

    return callGenerate({
      endpoint: useEdit ? IMAGE_EDIT_ENDPOINT : IMAGE_TEXT_ENDPOINT,
      model: "gpt-image",
      mode: useEdit ? "image-editing" : "text-to-image",
      type: "image",
      prompt: customPrompt,
      ...(referenceUrl ? { image_url: referenceUrl } : {}),
      image_size: "auto",
      num_images: 1,
      aspect_ratio: ratio,
    });
  }

  async function generateVideo(referenceUrl, customPrompt) {
    const useImage = Boolean(referenceUrl);

    return callGenerate({
      endpoint: useImage ? VIDEO_IMAGE_ENDPOINT : VIDEO_TEXT_ENDPOINT,
      model: "seedance",
      mode: useImage ? "image-to-video" : "text-to-video",
      type: "video",
      prompt: customPrompt,
      ...(referenceUrl ? { image_url: referenceUrl } : {}),
      aspect_ratio: ratio,
      resolution,
      duration: String(duration),
      seconds: duration,
      negative_prompt:
        "low quality, blurry, distorted face, distorted product, random text, watermark, bad anatomy",
    });
  }

  async function handleGenerate() {
    setLoading(true);
    setStatusText("Preparing template...");
    setError("");
    setResult(null);
    setIntermediateImage("");

    try {
      const referenceUrl = await uploadAssetIfNeeded();
      const finalPrompt = buildFinalPrompt(selectedTemplate, hookText, extraPrompt);

      if (selectedTemplate.workflow === "image-edit" || selectedTemplate.workflow === "image") {
        setStatusText("Generating edited image...");
        const imageResult = await generateImage(referenceUrl, finalPrompt);
        setResult(imageResult);
        return;
      }

      if (selectedTemplate.workflow === "image-to-video" || selectedTemplate.workflow === "video") {
        setStatusText("Generating video...");
        const videoResult = await generateVideo(referenceUrl, finalPrompt);
        setResult(videoResult);
        return;
      }

      if (selectedTemplate.workflow === "image-then-video") {
        setStatusText("Creating template image...");
        const imagePrompt = [
          selectedTemplate.imagePrompt || selectedTemplate.prompt,
          hookText ? `User hook or direction:\n${hookText}` : "",
          extraPrompt ? `Extra instruction:\n${extraPrompt}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");

        const imageResult = await generateImage(referenceUrl, imagePrompt);
        const generatedImageUrl = pickMediaUrl(imageResult, "image");

        if (!generatedImageUrl) {
          throw new Error("The image step finished, but no image URL was returned.");
        }

        setIntermediateImage(generatedImageUrl);
        setStatusText("Animating generated image...");

        const videoPrompt = buildFinalPrompt(selectedTemplate, hookText, extraPrompt);
        const videoResult = await generateVideo(generatedImageUrl, videoPrompt);
        setResult(videoResult);
        return;
      }

      throw new Error("Unsupported template workflow.");
    } catch (err) {
      if (err?.message !== "__NOVA_UPGRADE_REQUIRED__") setError(err?.message || "Could not generate this template.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  }

  async function animateCurrentResult() {
    if (!resultUrl || isVideoUrl(resultUrl)) return;

    setLoading(true);
    setError("");
    setStatusText("Animating current image...");

    try {
      const prompt = [
        "Animate this generated image into a short cinematic social media clip.",
        "Preserve the same subject, face, outfit, product, composition, background and style.",
        hookText || extraPrompt || "Add subtle cinematic motion and smooth camera movement.",
      ].join("\n\n");

      const videoResult = await generateVideo(resultUrl, prompt);
      setResult(videoResult);
    } catch (err) {
      if (err?.message !== "__NOVA_UPGRADE_REQUIRED__") setError(err?.message || "Could not animate image.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  }

  const outputLabel = selectedTemplate.output === "video" ? "Video" : "Image";
  const filename = selectedTemplate.output === "video"
    ? `nova-${selectedTemplate.id}.mp4`
    : `nova-${selectedTemplate.id}.png`;

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-black px-4 py-8 text-white md:px-8">
      <section className="mx-auto w-full max-w-[1600px]">
        <div className="rounded-[2rem] border border-[#D7FF00]/20 bg-[radial-gradient(circle_at_18%_18%,rgba(215,255,0,.16),transparent_32%),linear-gradient(135deg,#050505,#0d0d0d)] p-5 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-[#D7FF00]">
            NOVA Viral Template Studio
          </p>

          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.08em] md:text-7xl">
                Viral templates without prompt confusion.
              </h1>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
                Choose a NOVA template, upload your image or product, customize the hook,
                generate an image or video, then download the final creative.
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-white/10 bg-black/45 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Built-in workflows
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[10px] font-black uppercase tracking-[0.12em]">
                {["Dance", "Pet", "Anime", "Product", "UGC", "Editor"].map((item) => (
                  <span key={item} className="rounded-xl bg-white/[0.04] px-3 py-2 text-white/55">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-6 rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-4 text-sm font-bold text-[#D7FF00]">
              {statusText || "Generating..."}
            </div>
          )}

          {upgradeOffer && (
            <div className="mt-6 rounded-3xl border border-[#D7FF00]/40 bg-black/90 p-5 shadow-[0_0_70px_rgba(215,255,0,.16)]">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                Credits required
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">
                {upgradeOffer.title || "More credits needed"}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                {upgradeOffer.message || "You need more credits to generate this creative. Recharge your balance or choose a plan to continue."}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => { window.location.href = upgradeOffer.href || "/pricing"; }}
                  className="rounded-2xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-black"
                >
                  {upgradeOffer.cta || "Recharge credits"}
                </button>
                <button
                  type="button"
                  onClick={() => setUpgradeOffer(null)}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/45"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                  Step 1
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em]">
                  Pick a template
                </h2>
              </div>

              <Link
                href="/dashboard/characters"
                className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/45 no-underline hover:border-[#D7FF00]/40 hover:text-[#D7FF00]"
              >
                Character Studio →
              </Link>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TEMPLATE_CATEGORIES.map((item) => (
                <Pill key={item} active={category === item} onClick={() => setCategory(item)}>
                  {item}
                </Pill>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  active={template.id === selectedTemplate.id}
                  onClick={() => selectTemplate(template.id)}
                />
              ))}
            </div>
          </section>

          <aside className="min-w-0 space-y-6">
            <section className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5 md:p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                Step 2
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em]">
                Customize
              </h2>

              <div className="mt-5 rounded-2xl border border-[#D7FF00]/20 bg-[#D7FF00]/10 p-4">
                <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <img
                    src={templatePreviewSrc(selectedTemplate)}
                    onError={(event) => handleTemplatePreviewError(event, selectedTemplate)}
                    alt={`${selectedTemplate.name} template preview`}
                    className="aspect-video w-full object-cover"
                  />
                </div>

                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D7FF00]">
                  Selected template
                </p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-[-0.04em]">
                  {selectedTemplate.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  {selectedTemplate.title}
                </p>
              </div>

              <div className="mt-5 space-y-5">
                {selectedTemplate.requiresImage && (
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                      {selectedTemplate.inputLabel || "Upload image"}
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAssetChange}
                      className="block w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-xs text-white/60 file:mr-4 file:rounded-xl file:border-0 file:bg-[#D7FF00] file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:text-black"
                    />

                    {assetPreview && (
                      <img
                        src={assetPreview}
                        alt="Uploaded preview"
                        className="mt-3 max-h-64 w-full rounded-2xl border border-white/10 bg-black object-contain"
                      />
                    )}
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                    Hook / instruction
                  </span>
                  <textarea
                    value={hookText}
                    onChange={(event) => setHookText(event.target.value)}
                    placeholder={selectedTemplate.hookPlaceholder || "Write the hook or direction..."}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#D7FF00]/55"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                    Extra prompt
                  </span>
                  <textarea
                    value={extraPrompt}
                    onChange={(event) => setExtraPrompt(event.target.value)}
                    placeholder="Optional: add style, mood, camera, background, outfit, product details..."
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#D7FF00]/55"
                  />
                </label>

                <div>
                  <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                    Format
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {ratios.map((item) => (
                      <Pill key={item} active={ratio === item} onClick={() => setRatio(item)}>
                        {item}
                      </Pill>
                    ))}
                  </div>
                </div>

                {selectedTemplate.output === "video" && (
                  <>
                    <div>
                      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                        Duration
                      </p>
                      <div className="grid grid-cols-5 gap-2">
                        {durations.map((item) => (
                          <Pill key={item} active={duration === item} onClick={() => setDuration(item)}>
                            {item}s
                          </Pill>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/40">
                        Resolution
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {resolutions.map((item) => (
                          <Pill key={item} active={resolution === item} onClick={() => setResolution(item)}>
                            {item}
                          </Pill>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-[#D7FF00] text-xs font-black uppercase tracking-[0.16em] text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Generating..." : `Generate ${outputLabel}`}
                </button>

                <p className="text-xs leading-6 text-white/35">
                  Templates use NOVA generation credits. Uploading/choosing a template does not spend credits; generation does.
                </p>
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5 md:p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                Step 3
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em]">
                Result
              </h2>

              {!resultUrl && (
                <p className="mt-4 text-sm leading-7 text-white/45">
                  Your generated image or video appears here.
                </p>
              )}

              {intermediateImage && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black p-3">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                    Intermediate image
                  </p>
                  <img
                    src={intermediateImage}
                    alt="Intermediate generated image"
                    className="max-h-[420px] w-full rounded-xl bg-black object-contain"
                  />
                </div>
              )}

              {resultUrl && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black p-3">
                  {isVideoUrl(resultUrl) ? (
                    <video
                      src={resultUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="aspect-video max-h-[520px] w-full rounded-xl bg-black object-contain"
                    />
                  ) : (
                    <img
                      src={resultUrl}
                      alt="Generated result"
                      className="max-h-[520px] w-full rounded-xl bg-black object-contain"
                    />
                  )}

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <a
                      href={resultUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-xl border border-white/10 px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/50 no-underline hover:text-white"
                    >
                      Open
                    </a>

                    <a
                      href={downloadHref(resultUrl, filename)}
                      className="flex-1 rounded-xl bg-[#D7FF00] px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.14em] text-black no-underline"
                    >
                      Download
                    </a>
                  </div>

                  {!isVideoUrl(resultUrl) && (
                    <button
                      type="button"
                      onClick={animateCurrentResult}
                      disabled={loading}
                      className="mt-3 w-full rounded-xl border border-[#D7FF00]/40 px-3 py-3 text-center text-[10px] font-black uppercase tracking-[0.14em] text-[#D7FF00] transition hover:bg-[#D7FF00] hover:text-black disabled:opacity-40"
                    >
                      Animate this image
                    </button>
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
