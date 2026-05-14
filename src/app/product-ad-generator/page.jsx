"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const SEEDANCE_FAST_TEXT = "bytedance/seedance-2.0/fast/text-to-video";
const SEEDANCE_FAST_IMAGE = "bytedance/seedance-2.0/fast/image-to-video";

const platforms = [
  { key: "tiktok", label: "TikTok Ads", ratio: "9:16" },
  { key: "facebook", label: "Facebook Ads", ratio: "1:1" },
  { key: "youtube_shorts", label: "YouTube Shorts", ratio: "9:16" },
  { key: "youtube_ads", label: "YouTube Ads", ratio: "16:9" },
];

const durations = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const resolutions = ["480p", "720p"];

function collectUrls(payload) {
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
      "video",
      "url",
      "video_url",
      "videoUrl",
      "mediaUrl",
      "outputUrl",
      "image",
      "images",
      "data",
      "output",
      "result",
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

  const unique = [...new Set(urls)];

  return (
    unique.filter((url) => /\.(mp4|webm|mov)(\?|#|$)/i.test(url) || /video/i.test(url)) ||
    unique
  );
}

function buildProductAdPrompt({ analysis, platform, ratio, duration, resolution }) {
  const bullets = analysis?.copy?.bullets?.slice(0, 7)?.join("\n- ") || "";
  const colors = analysis?.colors?.length ? analysis.colors.join(", ") : "use brand colors from the product page";

  return `
Create a high-converting UGC/product ad video for ${platform}.

Product page analysis:
Store: ${analysis.storeName || "Unknown store"}
Brand: ${analysis.brand || analysis.storeName || "Unknown brand"}
Product: ${analysis.productName || "Product"}
Price: ${analysis.price ? `${analysis.currency || ""} ${analysis.price}` : "not shown"}
Description: ${analysis.description || "Use the product page copy."}
Brand colors: ${colors}
Important page copy:
- ${bullets || analysis.description || analysis.productName}

Video requirements:
Duration: ${duration} seconds
Aspect ratio: ${ratio}
Resolution: ${resolution}
Style: premium UGC ad, direct-response, modern e-commerce, scroll-stopping, realistic product demo.
Structure:
1. First 1 second: strong hook that makes the viewer stop scrolling.
2. Show the product clearly and make it feel desirable.
3. Highlight the main benefit using visual storytelling, not boring text.
4. Add subtle social-proof energy: "this looks premium", "I did not expect this", "worth checking out".
5. End with a clear CTA: "Shop now", "Try it today", or "Tap to learn more".
Keep the product accurate. Do not invent medical claims. Use clean cinematic lighting, fast pacing, realistic movement, and ad-ready framing.
`.trim();
}

function PillButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition",
        active
          ? "border-[#D7FF00] bg-[#D7FF00] text-black shadow-[0_0_30px_rgba(215,255,0,.18)]"
          : "border-white/10 bg-white/[0.03] text-white/60 hover:border-[#D7FF00]/50 hover:text-[#D7FF00]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function ProductAdGeneratorPage() {
  const [productUrl, setProductUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [platform, setPlatform] = useState("tiktok");
  const [duration, setDuration] = useState(8);
  const [resolution, setResolution] = useState("480p");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const selectedPlatform = useMemo(
    () => platforms.find((item) => item.key === platform) || platforms[0],
    [platform]
  );

  const ratio = selectedPlatform.ratio;
  const urls = useMemo(() => collectUrls(result || {}), [result]);
  const firstVideoUrl = urls[0] || "";

  async function analyzeProduct() {
    if (!productUrl.trim()) return;

    setLoadingAnalysis(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/product-ad/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productUrl.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not analyze this product page.");
      }

      setAnalysis(data);
    } catch (err) {
      setError(err?.message || "Could not analyze product page.");
    } finally {
      setLoadingAnalysis(false);
    }
  }

  async function generateVideo() {
    if (!analysis) return;

    setGenerating(true);
    setError("");
    setResult(null);

    try {
      const endpoint = analysis.mainImage ? SEEDANCE_FAST_IMAGE : SEEDANCE_FAST_TEXT;
      const mode = analysis.mainImage ? "image-to-video" : "text-to-video";

      const prompt = buildProductAdPrompt({
        analysis,
        platform: selectedPlatform.label,
        ratio,
        duration,
        resolution,
      });

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint,
          prompt,
          negative_prompt: "low quality, blurry, distorted product, unreadable text, broken hands, fake claims",
          model: "seedance",
          mode,
          type: "video",
          hasAsset: Boolean(analysis.mainImage),
          ...(analysis.mainImage ? { image_url: analysis.mainImage } : {}),
          aspect_ratio: ratio,
          resolution,
          duration: String(duration),
          seconds: duration,
          product_ad: true,
          source_url: analysis.url,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || data?.error || "Could not generate product ad video.");
      }

      setResult(data);
    } catch (err) {
      setError(err?.message || "Could not generate video.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-8">
      <section className="mx-auto max-w-[1500px]">
        <div className="rounded-[2rem] border border-[#D7FF00]/20 bg-[radial-gradient(circle_at_20%_20%,rgba(215,255,0,.16),transparent_34%),linear-gradient(135deg,#050505,#0c0c0c)] p-5 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#D7FF00]">
                NOVA Product Ad Generator
              </p>

              <h1 className="mt-4 max-w-5xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.08em] md:text-7xl">
                Turn any product page into an ad-ready video.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/55 md:text-lg">
                Paste a product URL. NOVA reads the product page, extracts the offer,
                colors, images and copy, then generates a UGC-style ad for TikTok,
                Facebook or YouTube.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {["Read product page", "Build UGC ad script", "Generate video"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm font-bold text-white/70">
                    <span className="text-[#D7FF00]">✓</span> {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-black/50 p-4 shadow-[0_30px_100px_rgba(0,0,0,.4)]">
              <div className="aspect-video rounded-2xl border border-[#D7FF00]/20 bg-black p-6">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                      Fixed UGC Model
                    </p>
                    <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.05em]">
                      Seedance 2.0 Fast
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/50">
                      Built for 4–15s product ads, vertical videos and fast creative testing.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-black uppercase tracking-[0.12em]">
                    <div className="rounded-xl bg-white/[0.04] p-3 text-white/60">{ratio}</div>
                    <div className="rounded-xl bg-white/[0.04] p-3 text-white/60">{duration}s</div>
                    <div className="rounded-xl bg-[#D7FF00] p-3 text-black">{resolution}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
          <section className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">
              Step 1
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em]">
              Paste product URL
            </h2>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={productUrl}
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="https://store.com/products/product-name"
                className="h-14 flex-1 rounded-2xl border border-white/10 bg-black/50 px-4 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-[#D7FF00]/50"
              />

              <button
                type="button"
                onClick={analyzeProduct}
                disabled={loadingAnalysis || !productUrl.trim()}
                className="h-14 rounded-2xl bg-[#D7FF00] px-6 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingAnalysis ? "Analyzing..." : "Analyze"}
              </button>
            </div>

            {analysis && (
              <div className="mt-6 rounded-2xl border border-[#D7FF00]/20 bg-black/40 p-4">
                <div className="flex gap-4">
                  {analysis.mainImage && (
                    <img
                      src={analysis.mainImage}
                      alt={analysis.productName}
                      className="h-24 w-24 rounded-xl border border-white/10 object-cover"
                    />
                  )}

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D7FF00]">
                      {analysis.storeName}
                    </p>
                    <h3 className="mt-1 text-xl font-black tracking-[-0.04em]">
                      {analysis.productName}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/50">
                      {analysis.description || "Product page analyzed."}
                    </p>
                  </div>
                </div>

                {analysis.colors?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {analysis.colors.map((color) => (
                      <span
                        key={color}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/60"
                      >
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                        {color}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-[1.7rem] border border-white/10 bg-[#080808] p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">
              Step 2
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em]">
              Choose ad format
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                  Platform
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {platforms.map((item) => (
                    <PillButton key={item.key} active={platform === item.key} onClick={() => setPlatform(item.key)}>
                      {item.label}
                    </PillButton>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                  Duration
                </p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {durations.map((item) => (
                    <PillButton key={item} active={duration === item} onClick={() => setDuration(item)}>
                      {item}s
                    </PillButton>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                  Resolution
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {resolutions.map((item) => (
                    <PillButton key={item} active={resolution === item} onClick={() => setResolution(item)}>
                      {item}
                    </PillButton>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={generateVideo}
                disabled={!analysis || generating}
                className="h-16 w-full rounded-2xl bg-[#D7FF00] text-sm font-black uppercase tracking-[0.18em] text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? "Generating product ad..." : `Generate ${duration}s ${selectedPlatform.label} Video`}
              </button>

              <p className="text-xs leading-6 text-white/35">
                Analysis does not spend credits. Credits are used only when you generate the video.
              </p>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[1.7rem] border border-white/10 bg-[#080808] p-5 md:p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">
            Generated result
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em]">
            Your product ad appears here.
          </h2>

          {!firstVideoUrl && (
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
              Paste a product page URL, analyze it, choose your ad format, then generate.
            </p>
          )}

          {firstVideoUrl && (
            <div className="mx-auto mt-6 max-w-[920px] overflow-hidden rounded-3xl border border-white/10 bg-black p-3">
              <video
                src={firstVideoUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-video max-h-[70vh] w-full rounded-2xl bg-black object-contain"
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <a
                  href={firstVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-2xl border border-white/10 px-4 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-white/60 no-underline hover:text-white"
                >
                  Open video
                </a>

                <a
                  href={`/api/download?url=${encodeURIComponent(firstVideoUrl)}&filename=${encodeURIComponent("nova-product-ad.mp4")}`}
                  className="flex-1 rounded-2xl bg-[#D7FF00] px-4 py-4 text-center text-xs font-black uppercase tracking-[0.14em] text-black no-underline"
                >
                  Download
                </a>
              </div>
            </div>
          )}
        </section>

        <div className="mt-8 text-center">
          <Link href="/dashboard/generate" className="text-xs font-black uppercase tracking-[0.16em] text-white/35 no-underline hover:text-[#D7FF00]">
            Or use the advanced generator →
          </Link>
        </div>
      </section>
    </main>
  );
}
