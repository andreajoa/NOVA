"use client";
import { useState } from "react";
import Link from "next/link";
const UPGRADE_CODES = ["INSUFFICIENT_CREDITS"];
function UpgradeBanner({ data, onDismiss }) {
  return (
    <div className="mt-5 rounded-[2rem] border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-5">
      <p className="text-xs font-black uppercase text-[#D7FF00]">Upgrade required</p>
      <h3 className="mt-2 text-xl font-black uppercase text-white">{data?.message || "Insufficient credits."}</h3>
      <div className="mt-4 flex gap-3">
        <Link href="/pricing" className="rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase text-black no-underline">See plans</Link>
        <button onClick={onDismiss} className="rounded-xl border border-white/15 px-5 py-3 text-xs font-black uppercase text-white/50">Close</button>
      </div>
    </div>
  );
}
function SceneCard({ scene, index, isRendering }) {
  const isDone = Boolean(scene.videoUrl);
  const dlHref = isDone ? ("/api/download?url=" + encodeURIComponent(scene.videoUrl) + "&filename=cena-" + (index + 1)) : "#";
  return (
    <div className={"rounded-2xl border p-4 " + (isDone ? "border-[#D7FF00]/30 bg-[#D7FF00]/5" : isRendering ? "border-white/20 bg-white/[.04]" : "border-white/10 bg-black/30")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase text-white/35">{"Scene " + (index + 1) + " - " + scene.durationSeconds + "s"}</p>
          <p className="mt-1 text-sm text-white/70">{scene.prompt}</p>
        </div>
        <div className={"rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase " + (isDone ? "border-[#D7FF00]/40 text-[#D7FF00]" : isRendering ? "border-white/20 text-white/50" : "border-white/10 text-white/25")}>
          {isDone ? "Done" : isRendering ? "..." : "Wait"}
        </div>
      </div>
      {isDone && scene.videoUrl && (
        <div className="mt-3">
          <video src={scene.videoUrl} controls playsInline className="w-full rounded-xl border border-white/10 bg-black" style={{ maxHeight: 180 }} />
          <a href={dlHref} className="mt-2 block rounded-xl border border-white/10 px-3 py-2 text-center text-[10px] font-black uppercase text-white/50 no-underline hover:text-white">
            {"Download scene " + (index + 1)}
          </a>
        </div>
      )}
    </div>
  );
}
export default function LongVideoPage() {
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState(1);
  const [sceneSeconds, setSceneSeconds] = useState(5);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [planLoading, setPlanLoading] = useState(false);
  const [renderLoading, setRenderLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useState(-1);
  const [upgradeOffer, setUpgradeOffer] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [merging, setMerging] = useState(false);
  const [finalUrl, setFinalUrl] = useState(null);
  async function handleMerge() {
    const clips = scenes.map((s) => s.videoUrl).filter(Boolean);
    if (clips.length < 2) { setError("Need at least 2 rendered scenes to merge."); return; }
    setMerging(true); setError("");
    try {
      const res = await fetch("/api/long-video/merge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clips, title: topic || "NOVA Long Video", ratio: aspectRatio }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || "Merge failed.");
      setFinalUrl(data.finalUrl);
    } catch (err) { setError(err?.message || "Merge failed."); }
    finally { setMerging(false); }
  }
  async function handlePlan() {
    if (!topic.trim()) { setError("Adicione um topico."); return; }
    setPlanLoading(true); setError(""); setPlan(null); setScenes([]); setCurrentScene(-1); setDone(false); setUpgradeOffer(null);
    try {
      const res = await fetch("/api/long-video/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topic.trim(), minutes, sceneSeconds }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || "Failed.");
      setPlan(data); setScenes(data.scenes.map((s) => ({ ...s, videoUrl: null })));
    } catch (err) { setError(err?.message || "Failed."); }
    finally { setPlanLoading(false); }
  }
  async function handleRender() {
    if (!scenes.length) return;
    setRenderLoading(true); setError(""); setUpgradeOffer(null); setDone(false);
    for (let i = 0; i < scenes.length; i++) {
      setCurrentScene(i);
      try {
        const res = await fetch("/api/long-video/render", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenes, sceneIndex: i, aspectRatio }) });
        const data = await res.json().catch(() => ({}));
        if (res.status === 402 || UPGRADE_CODES.includes(data?.code)) { setUpgradeOffer(data); setRenderLoading(false); return; }
        if (!res.ok || !data?.success) throw new Error(data?.message || ("Falha cena " + (i + 1)));
        setScenes((prev) => { const next = [...prev]; next[i] = { ...next[i], videoUrl: data.videoUrl }; return next; });
        window.dispatchEvent(new Event("nova:credits-refresh"));
      } catch (err) { setError("Scene " + (i + 1) + ": " + (err?.message || "Failed.")); setRenderLoading(false); return; }
    }
    setRenderLoading(false); setCurrentScene(-1); setDone(true);
  }
  const est = Math.ceil((minutes * 60) / sceneSeconds);
  return (
    <main className="min-h-screen bg-[#020303] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-xs font-black uppercase text-white/35 no-underline hover:text-white">Dashboard</Link>
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#070707] p-6 md:p-10">
          <p className="text-xs font-black uppercase text-[#D7FF00]">NOVA Advanced Media</p>
          <h1 className="mt-4 text-5xl font-black uppercase md:text-7xl">Long Video</h1>
          <p className="mt-4 max-w-2xl text-base text-white/55">Gere videos longos cena por cena com IA.</p>
        </div>
        {!plan && (
          <div className="mt-5 rounded-[2rem] border border-white/10 bg-[#070707] p-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase text-white/35">Topico do video</p>
                <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Como construir uma marca pessoal..." rows={4} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-white/35">Duracao total</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5].map((m) => <button key={m} onClick={() => setMinutes(m)} className={"flex-1 rounded-xl border px-3 py-3 text-xs font-black uppercase " + (minutes === m ? "border-[#D7FF00] bg-[#D7FF00] text-black" : "border-white/10 text-white/55")}>{m}min</button>)}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-white/35">Por cena</p>
                  <div className="flex gap-2">
                    {[5, 10].map((s) => <button key={s} onClick={() => setSceneSeconds(s)} className={"flex-1 rounded-xl border px-3 py-3 text-xs font-black uppercase " + (sceneSeconds === s ? "border-[#D7FF00] bg-[#D7FF00] text-black" : "border-white/10 text-white/55")}>{s}s</button>)}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase text-white/35">Proporcao</p>
                  <div className="flex gap-2">
                    {["16:9", "9:16", "1:1"].map((r) => <button key={r} onClick={() => setAspectRatio(r)} className={"flex-1 rounded-xl border px-3 py-3 text-xs font-black uppercase " + (aspectRatio === r ? "border-[#D7FF00] bg-[#D7FF00] text-black" : "border-white/10 text-white/55")}>{r}</button>)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.025] p-3 text-xs text-white/40">
                  {minutes}min / {sceneSeconds}s = approx {est} scenes / approx {est * 35} credits
                </div>
              </div>
            </div>
            {error && <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">{error}</div>}
            <button onClick={handlePlan} disabled={planLoading} className="mt-5 min-h-14 w-full rounded-2xl bg-[#D7FF00] px-6 py-4 text-sm font-black uppercase text-black disabled:opacity-45">
              {planLoading ? "Generating plan..." : "Generate scene plan"}
            </button>
          </div>
        )}
        {plan && (
          <div className="mt-5 rounded-[2rem] border border-white/10 bg-[#070707] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-[#D7FF00]">Plan generated</p>
                <h2 className="mt-1 text-2xl font-black uppercase text-white">{plan.sceneCount} scenes - {plan.minutes}min - approx {plan.estimatedCredits} credits</h2>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setPlan(null); setScenes([]); setDone(false); setError(""); }} className="rounded-xl border border-white/15 px-4 py-3 text-xs font-black uppercase text-white/50 hover:text-white">New plan</button>
                {!renderLoading && !done && <button onClick={handleRender} className="rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase text-black">Render all</button>}
                {renderLoading && <div className="rounded-xl border border-white/15 px-4 py-3 text-xs font-black uppercase text-white/50">{"Scene " + (currentScene + 1) + "/" + scenes.length}</div>}
              </div>
            </div>
            {renderLoading && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#D7FF00] transition-all duration-500" style={{ width: (scenes.length ? ((currentScene + 1) / scenes.length) * 100 : 0) + "%" }} />
              </div>
            )}
            {error && !upgradeOffer && (
              <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                {error}
                {!renderLoading && <button onClick={handleRender} className="ml-4 rounded-xl bg-white/10 px-4 py-1.5 text-xs font-black uppercase">Try again</button>}
              </div>
            )}
            {upgradeOffer && <UpgradeBanner data={upgradeOffer} onDismiss={() => setUpgradeOffer(null)} />}
            {done && !finalUrl && (
              <div className="mt-4 rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-sm font-black uppercase text-[#D7FF00]">{"All " + scenes.length + " scenes rendered"}</p>
                  <button onClick={handleMerge} disabled={merging} className="rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase text-black disabled:opacity-45">
                    {merging ? "Merging..." : "Merge into final video"}
                  </button>
                </div>
              </div>
            )}
            {finalUrl && (
              <div className="mt-4 rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/5 p-5">
                <p className="text-xs font-black uppercase text-[#D7FF00] mb-3">Final video ready</p>
                <video src={finalUrl} controls playsInline className="w-full rounded-xl border border-white/10 bg-black" style={{ maxHeight: 400 }} />
                <a href={"/api/download?url=" + encodeURIComponent(finalUrl) + "&filename=nova-long-video"} className="mt-3 block rounded-xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 px-4 py-3 text-center text-xs font-black uppercase text-[#D7FF00] no-underline hover:bg-[#D7FF00]/20 transition">
                  Download final video
                </a>
              </div>
            )}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {scenes.map((scene, i) => <SceneCard key={i} scene={scene} index={i} isRendering={renderLoading && i === currentScene} />)}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
