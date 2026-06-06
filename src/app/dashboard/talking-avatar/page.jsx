"use client";

import { useState } from "react";

export default function TalkingAvatarPage() {
  const [form, setForm] = useState({
    imageUrl: "",
    audioUrl: "",
    script: "",
    prompt: "Natural talking head video, realistic facial expressions, professional studio lighting.",
    modelId: "wan-2-2-speech",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/talking-avatar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Talking avatar generation failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Talking avatar generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <section className="mx-auto max-w-6xl">
        <a href="/dashboard" className="text-xs font-black uppercase tracking-[0.18em] text-white/35 no-underline hover:text-white">
          ← Dashboard
        </a>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#070707] p-6 shadow-[0_0_120px_rgba(215,255,0,.08)] md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00]">NOVA Advanced Media</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl">
            Talking Avatar
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">
            Create a talking video from a portrait and either a script or an uploaded audio URL. For honest results, this uses a real speech-to-video/lip-sync pipeline instead of pretending normal text-to-video can preserve identity and generate speech.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_.9fr]">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Portrait image URL</label>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none focus:border-[#D7FF00]"
              />

              <label className="mt-5 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Script</label>
              <textarea
                value={form.script}
                onChange={(e) => setForm({ ...form, script: e.target.value })}
                placeholder="Write what the avatar should say..."
                rows={5}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none focus:border-[#D7FF00]"
              />

              <label className="mt-5 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Or audio URL</label>
              <input
                value={form.audioUrl}
                onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                placeholder="https://.../voice.mp3"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none focus:border-[#D7FF00]"
              />

              <label className="mt-5 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Motion prompt</label>
              <textarea
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none focus:border-[#D7FF00]"
              />

              <button
                onClick={submit}
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-[#D7FF00] px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-black disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Talking Avatar"}
              </button>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                  {error}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Result</p>

              {!result && (
                <div className="mt-4 flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/35">
                  Your talking avatar video will appear here after generation.
                </div>
              )}

              {result?.videoUrl && (
                <div className="mt-4">
                  <video src={result.videoUrl} controls playsInline className="w-full rounded-3xl border border-white/10 bg-black" />
                  <a
                    href={result.videoUrl}
                    download
                    className="mt-4 block rounded-2xl border border-[#D7FF00]/30 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-[#D7FF00] no-underline"
                  >
                    Download Video
                  </a>
                  <p className="mt-3 text-xs text-white/35">Credits charged/required: {result.creditsRequired}</p>
                </div>
              )}

              {result?.audioUrl && (
                <audio src={result.audioUrl} controls className="mt-4 w-full" />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
