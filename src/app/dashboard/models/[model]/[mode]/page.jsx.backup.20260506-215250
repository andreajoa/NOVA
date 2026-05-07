"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { falModels } from "@/lib/falModels";

function UpgradeOffer({ data }) {
  const annualHref = data?.plans?.annual?.href || "/checkout/plan?plan=basic&billing=annual";
  const monthlyHref = data?.plans?.monthly?.href || "/checkout/plan?plan=basic&billing=monthly";
  const isImageLimit = data?.code === "IMAGE_TRIAL_LIMIT_REACHED";
  const title = isImageLimit ? "You used all your free image generations." : "Your video is ready — unlock generation.";
  const subtitle = isImageLimit
    ? `You used all ${data?.imageMonthlyLimit ?? 10} free image generations. Upgrade to get unlimited images.`
    : `You have ${data?.currentCredits ?? 0} credits but this render needs ${data?.creditsRequired ?? 120} credits.`;
  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-[#D7FF00]/35 bg-[#D7FF00]/[.07] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex rounded-full bg-[#D7FF00] px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-black">Upgrade to continue</div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-white md:text-3xl">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/50">{subtitle}</p>
          {isImageLimit && <p className="mt-2 text-xs text-[#D7FF00]/70">Unlimited images on Basic, Plus, Ultra and Business plans</p>}
        </div>
        <div className="grid min-w-full gap-3 sm:grid-cols-2 lg:min-w-[360px]">
          <a href={annualHref} className="rounded-2xl bg-[#D7FF00] px-5 py-4 text-black no-underline transition hover:bg-[#c8f000]">
            <p className="text-[10px] font-black uppercase tracking-[.16em]">Best value</p>
            <p className="mt-1 text-2xl font-black">$5/mo</p>
            <p className="mt-1 text-[11px] font-bold text-black/60">Billed annually</p>
          </a>
          <a href={monthlyHref} className="rounded-2xl border border-white/10 bg-white/[.04] px-5 py-4 text-white no-underline transition hover:bg-white/[.08]">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-white/40">Flexible</p>
            <p className="mt-1 text-2xl font-black">$7/mo</p>
            <p className="mt-1 text-[11px] font-bold text-white/40">Cancel anytime</p>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ModelModePage() {
  const router = useRouter();
  const { model: modelKey, mode: modeKey } = useParams();

  const isImageModel = !falModels.video[modelKey] && Boolean(falModels.image?.[modelKey]);
  const model = falModels.video[modelKey] || falModels.image?.[modelKey];
  const modeData = model?.modes[modeKey];

  const [prompt, setPrompt] = useState("");
  const [asset, setAsset] = useState(null);
  const [assetPreview, setAssetPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [upgradeOffer, setUpgradeOffer] = useState(null);
  const [error, setError] = useState("");

  if (!model || !modeData) return <div className="p-8 text-white">Mode not found.</div>;

  function handleAssetChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAsset(file);
    setAssetPreview(URL.createObjectURL(file));
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setResult(null);
    setUpgradeOffer(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: modeData.endpoint,
          prompt,
          model: modelKey,
          mode: modeKey,
          type: isImageModel ? "image" : "video",
          seconds: isImageModel ? null : 5,
          hasAsset: Boolean(asset),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402 || data?.code === "INSUFFICIENT_CREDITS" || data?.code === "IMAGE_TRIAL_LIMIT_REACHED") {
        setUpgradeOffer(data);
        return;
      }
      if (!res.ok || !data?.success) throw new Error(data?.message || data?.error || "Generation failed");
      setResult(data);
      window.dispatchEvent(new Event("nova:credits-refresh"));
    } catch (err) {
      setError(err?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:px-8">
      <div className="mb-8 text-sm text-white/25">
        <span className="cursor-pointer hover:text-white" onClick={() => router.push("/dashboard/models")}>Models</span>
        <span className="mx-2">›</span>
        <span className="cursor-pointer hover:text-white" onClick={() => router.push("/dashboard/models/" + modelKey)}>{model.label}</span>
        <span className="mx-2">›</span>
        <span className="text-white/60">{modeData.label}</span>
      </div>

      <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00]">
        {model.label}
        {isImageModel && <span className="ml-3 rounded-full bg-[#D7FF00]/15 px-2 py-0.5 text-[9px] text-[#D7FF00]">UNLIMITED</span>}
      </p>
      <h1 className="mb-9 text-4xl font-black uppercase tracking-tight text-white md:text-5xl">{modeData.label}</h1>

      {modeData.needsImage && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-white/35">Asset</p>
          <label className="grid min-h-[220px] cursor-pointer place-items-center overflow-hidden rounded-3xl border border-dashed border-white/15 bg-white/[.025] transition hover:border-[#D7FF00]/50">
            {assetPreview ? (
              asset?.type?.startsWith("video/") ? (
                <video src={assetPreview} controls className="h-full max-h-[320px] w-full object-contain" />
              ) : (
                <img src={assetPreview} alt="Uploaded asset" className="h-full max-h-[320px] w-full object-contain" />
              )
            ) : (
              <div className="text-center">
                <p className="mb-2 text-3xl text-white/25">↑</p>
                <p className="text-sm text-white/35">Click to upload image or video</p>
              </div>
            )}
            <input className="hidden" type="file" accept="image/*,video/*" onChange={handleAssetChange} />
          </label>
        </div>
      )}

      <div className="mb-6">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-white/35">Prompt</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to generate..."
          className="min-h-[180px] w-full resize-none rounded-3xl border border-white/12 bg-white/[.025] px-6 py-5 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-[#D7FF00]/45"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="h-14 rounded-2xl bg-[#D7FF00] px-9 text-sm font-black uppercase tracking-[.16em] text-black transition hover:bg-[#c8f000] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {loading ? "Generating..." : "Generate →"}
      </button>

      {upgradeOffer && <UpgradeOffer data={upgradeOffer} />}

      {error && !upgradeOffer && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">{error}</div>
      )}

      {result?.data?.url && (
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[.025] p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#D7FF00]">Generated</p>
              <p className="mt-1 text-sm text-white/40">
                {result.billing?.imageUnlimited ? "Unlimited — no credits used" : result.billing?.creditsCharged ? `${result.billing.creditsCharged} credits used` : ""}
              </p>
            </div>
            <a href={result.data.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.12em] text-white/60 no-underline transition hover:text-white">
              Open
            </a>
          </div>
          {result.data.type === "video" ? (
            <video src={result.data.url} controls className="w-full rounded-2xl" />
          ) : (
            <img src={result.data.url} alt="Generated result" className="w-full rounded-2xl" />
          )}
        </div>
      )}
    </div>
  );
}
