"use client";

import { useState } from "react";

export default function LongVideoPage() {
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState(1);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  async function createPlan() {
    setError("");
    setPlan(null);

    const res = await fetch("/api/long-video/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, minutes, sceneSeconds: 5 }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      setError(data.message || data.error || "Could not create plan.");
      return;
    }

    setPlan(data);
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <section className="mx-auto max-w-6xl">
        <a href="/dashboard" className="text-xs font-black uppercase tracking-[0.18em] text-white/35 no-underline hover:text-white">
          ← Dashboard
        </a>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#070707] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00]">NOVA Production System</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl">
            Long Video Generator
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">
            Plan longer videos by splitting them into short AI-generated scenes with narration. Rendering long videos must run as an async job with R2 + FFmpeg to protect reliability and cost control.
          </p>

          <div className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-5">
            <label className="text-xs font-black uppercase tracking-[0.16em] text-white/40">Video idea</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={4}
              placeholder="Create a documentary about luxury watches..."
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none focus:border-[#D7FF00]"
            />

            <label className="mt-5 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Minutes</label>
            <select
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-sm text-white outline-none focus:border-[#D7FF00]"
            >
              {[1, 2, 3, 5, 10, 15].map((m) => (
                <option key={m} value={m}>{m} minute{m > 1 ? "s" : ""}</option>
              ))}
            </select>

            <button
              onClick={createPlan}
              className="mt-6 rounded-2xl bg-[#D7FF00] px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-black"
            >
              Create Production Plan
            </button>

            {error && <p className="mt-4 text-sm font-bold text-red-300">{error}</p>}
          </div>

          {plan && (
            <div className="mt-8 rounded-3xl border border-[#D7FF00]/20 bg-[#D7FF00]/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Plan ready</p>
              <h2 className="mt-2 text-2xl font-black text-white">{plan.sceneCount} scenes · Estimated {plan.estimatedCredits} credits</h2>
              <div className="mt-5 grid gap-3">
                {plan.scenes.slice(0, 12).map((scene) => (
                  <div key={scene.scene} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <p className="text-xs font-black text-[#D7FF00]">Scene {scene.scene} · {scene.durationSeconds}s</p>
                    <p className="mt-2 text-sm text-white/60">{scene.prompt}</p>
                  </div>
                ))}
              </div>
              {plan.scenes.length > 12 && (
                <p className="mt-4 text-sm text-white/45">Showing first 12 scenes of {plan.scenes.length}.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
