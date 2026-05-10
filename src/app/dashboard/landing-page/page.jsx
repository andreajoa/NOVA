"use client";

import { useState } from "react";

const platforms = [
  { value: "html", label: "HTML universal" },
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "hydrogen", label: "Hydrogen / Oxygen" },
  { value: "shopify-theme", label: "Shopify Theme ZIP" },
];

const defaultForm = {
  product: "Luxury watch",
  brandName: "NOVA Brand",
  platform: "shopify-theme",
  audience: "Premium buyers who want quality and status",
  style: "black and neon green luxury ecommerce",
  language: "en",
  cta: "Shop Now",
};

export default function LandingPageStudio() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);
    setShowPaywall(false);

    try {
      const res = await fetch("/api/landing-page/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const code = data?.code || data?.error || "";
        if (
          res.status === 401 ||
          res.status === 402 ||
          String(code).includes("NOVA_API_KEY") ||
          String(code).includes("CREDITS")
        ) {
          setShowPaywall(true);
        }
        setError(data?.message || data?.error || "Could not generate landing page.");
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err?.message || "Could not generate landing page.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-lime-300/20 bg-white/[0.035] p-6 shadow-2xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-300">
            NOVA Landing Page Studio
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.07em] md:text-7xl">
            Generate a complete landing page with AI images.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/60 md:text-lg">
            Creates layout, copy, 4 AI-generated images and a downloadable ZIP for Shopify Theme,
            Hydrogen/Oxygen, Next.js, React or HTML. Inside NOVA, this uses internal NOVA credits.
          </p>

          <div className="mt-6 grid gap-4 rounded-3xl border border-lime-300/20 bg-lime-300/10 p-5 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Cost</p>
              <p className="mt-1 text-3xl font-black text-lime-300">24 credits</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Included</p>
              <p className="mt-1 font-bold">Layout + copy + 4 AI images + ZIP</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Model</p>
              <p className="mt-1 font-bold">FLUX.1 schnell</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Product / Store">
                <input value={form.product} onChange={(e) => update("product", e.target.value)} className="input" />
              </Field>

              <Field label="Brand name">
                <input value={form.brandName} onChange={(e) => update("brandName", e.target.value)} className="input" />
              </Field>

              <Field label="Platform">
                <select value={form.platform} onChange={(e) => update("platform", e.target.value)} className="input">
                  {platforms.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>

              <Field label="Language">
                <select value={form.language} onChange={(e) => update("language", e.target.value)} className="input">
                  <option value="en">English</option>
                  <option value="pt-BR">Português Brasileiro</option>
                </select>
              </Field>

              <Field label="CTA">
                <input value={form.cta} onChange={(e) => update("cta", e.target.value)} className="input" />
              </Field>
              <div className="rounded-2xl border border-lime-300/20 bg-lime-300/10 p-4 text-sm leading-7 text-white/70">
                <b className="text-lime-300">Dentro da NOVA:</b> você não precisa colar API Key.
                Esta página usa seus créditos internos da NOVA.
              </div>

<div className="md:col-span-2">
                <Field label="Audience">
                  <textarea value={form.audience} onChange={(e) => update("audience", e.target.value)} className="input min-h-[90px]" />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="Visual style">
                  <textarea value={form.style} onChange={(e) => update("style", e.target.value)} className="input min-h-[90px]" />
                </Field>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-lime-300 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-black disabled:opacity-60"
            >
              {loading ? "Generating landing page..." : "Generate complete landing page — 24 credits"}
            </button>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-2xl font-black tracking-[-0.04em]">Result</h2>
            {!result && <p className="mt-3 text-sm leading-7 text-white/55">Your download ZIP and generated image list will appear here.</p>}

            {result && (
              <div className="mt-4 space-y-4">
                <a
                  href={result.downloadUrl}
                  target="_blank"
                  className="block rounded-2xl bg-lime-300 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-black"
                >
                  Download ZIP
                </a>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/65">
                  <p><b className="text-white">Platform:</b> {result.platform}</p>
                  <p><b className="text-white">Credits charged:</b> {result.billing?.creditsCharged}</p>
                  <p><b className="text-white">Install:</b> {result.installNotes}</p>
                </div>
                <div className="grid gap-3">
                  {(result.generatedImages || []).map((img) => (
                    <a key={img.role} href={img.url} target="_blank" className="rounded-2xl border border-white/10 p-3 text-sm text-white/70 hover:border-lime-300/40">
                      {img.role} image
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {showPaywall && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
          <div className="max-w-md rounded-[2rem] border border-lime-300/25 bg-[#070707] p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-300">Credits required</p>
            <h3 className="mt-3 text-3xl font-black tracking-[-0.05em]">Buy API credits to generate.</h3>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Complete landing page generation inside NOVA requires 24 internal NOVA credits. Buy credits or upgrade your plan to continue.
            </p>
            <div className="mt-5 grid gap-3">
              <a href="/pricing" className="rounded-2xl bg-lime-300 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-black">
                Buy credits / Upgrade
              </a>
              <a href="/dashboard/settings/billing" className="rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-bold text-white">
                Billing settings
              </a>
              <button onClick={() => setShowPaywall(false)} className="rounded-2xl px-5 py-3 text-sm text-white/60">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(0,0,0,.45);
          padding: .9rem 1rem;
          color: white;
          outline: none;
        }
        .input:focus {
          border-color: rgba(217,255,0,.55);
        }
        option {
          color: black;
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}
