"use client";
import { useState } from "react";
import Link from "next/link";
const UPGRADE_CODES = ["INSUFFICIENT_CREDITS"];
function UpgradeBanner({ data, onDismiss }) {
  return (
    <div className="mt-5 rounded-[2rem] border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-5">
      <p className="text-xs font-black uppercase text-[#D7FF00]">Upgrade required</p>
      <h3 className="mt-2 text-2xl font-black uppercase text-white">{data?.message || "Insufficient credits."}</h3>
      <div className="mt-5 flex gap-3">
        <Link href="/pricing" className="rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase text-black no-underline">See plans</Link>
        <button onClick={onDismiss} className="rounded-xl border border-white/15 px-5 py-3 text-xs font-black uppercase text-white/50">Close</button>
      </div>
    </div>
  );
}
export default function VideoToolsPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [seconds, setSeconds] = useState(5);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [upgradeOffer, setUpgradeOffer] = useState(null);
  async function handleExtend() {
    if (!videoUrl.trim()) { setError("Cole a URL do video."); return; }
    if (!prompt.trim()) { setError("Adicione um prompt."); return; }
    setLoading(true); setError(""); setResult(null); setUpgradeOffer(null); setStatus("Processando...");
    try {
      const res = await fetch("/api/video/extend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoUrl: videoUrl.trim(), prompt: prompt.trim(), seconds, aspectRatio }) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402 || UPGRADE_CODES.includes(data?.code)) { setUpgradeOffer(data); return; }
      if (!res.ok || !data?.success) throw new Error(data?.message || "Falha.");
      setResult(data); window.dispatchEvent(new Event("nova:credits-refresh"));
    } catch (err) { setError(err?.message || "Falha."); }
    finally { setLoading(false); setStatus(""); }
  }
  return (
    <main className="min-h-screen bg-[#020303] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-xs font-black uppercase text-white/35 no-underline hover:text-white">Dashboard</Link>
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#070707] p-6 md:p-10">
          <p className="text-xs font-black uppercase text-[#D7FF00]">NOVA Video Tools</p>
          <h1 className="mt-4 text-5xl font-black uppercase md:text-7xl">Extend Video</h1>
          <p className="mt-4 max-w-2xl text-base text-white/55">Continue qualquer video gerado a partir do ultimo frame.</p>
        </div>
        <div className="mt-5 rounded-[2rem] border border-white/10 bg-[#070707] p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-black uppercase text-white/35">URL do video original</p>
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none" />
              {videoUrl && <video src={videoUrl} controls playsInline className="mt-3 w-full rounded-2xl border border-white/10 bg-black" style={{ maxHeight: 220 }} />}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-black uppercase text-white/35">Prompt da continuacao</p>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Descreva a continuacao..." rows={4} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <p className="mb-2 text-[10px] font-black uppercase text-white/35">Duracao</p>
                <div className="flex gap-2">
                  {[5, 10].map((s) => <button key={s} onClick={() => setSeconds(s)} className={"flex-1 rounded-xl border px-4 py-3 text-xs font-black uppercase " + (seconds === s ? "border-[#D7FF00] bg-[#D7FF00] text-black" : "border-white/10 text-white/55")}>{s}s</button>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-black uppercase text-white/35">Proporcao</p>
                <div className="flex gap-2">
                  {["16:9", "9:16", "1:1"].map((r) => <button key={r} onClick={() => setAspectRatio(r)} className={"flex-1 rounded-xl border px-4 py-3 text-xs font-black uppercase " + (aspectRatio === r ? "border-[#D7FF00] bg-[#D7FF00] text-black" : "border-white/10 text-white/55")}>{r}</button>)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-xs text-white/40">Cost: {seconds * 24} credits</div>
              <button onClick={handleExtend} disabled={loading} className="min-h-14 rounded-2xl bg-[#D7FF00] px-6 py-4 text-sm font-black uppercase text-black disabled:opacity-45">
                {loading ? (status || "Generating...") : ("Estender " + seconds + "s")}
              </button>
            </div>
          </div>
          {error && !upgradeOffer && <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">{error}</div>}
        </div>
        {upgradeOffer && <UpgradeBanner data={upgradeOffer} onDismiss={() => setUpgradeOffer(null)} />}
        {result && (
          <div className="mt-5 rounded-[2rem] border border-white/10 bg-[#070707] p-6">
            <p className="text-xs font-black uppercase text-[#D7FF00]">Continuation generated</p>
            <video src={result.videoUrl} controls playsInline className="mt-4 w-full rounded-2xl border border-white/10 bg-black" />
            <div className="mt-3 flex gap-3">
              <a href={result.videoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-center text-xs font-black uppercase text-white/60 no-underline hover:text-white">Open</a>
              <a href={"/api/download?url=" + encodeURIComponent(result.videoUrl) + "&filename=nova-extend"} className="flex-1 rounded-xl bg-[#D7FF00] px-4 py-3 text-center text-xs font-black uppercase text-black no-underline">Download</a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
