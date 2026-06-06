"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function FalBalanceAlert() {
  const [balance, setBalance] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);

  function loadBalance() {
    fetch("/api/admin/fal-balance")
      .then(r => r.ok ? r.json() : null)
      .then(b => {
        if (b && b.balance !== null) {
          setBalance(b.balance);
          setInputVal(String(b.balance));
        }
      });
  }

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.ok ? r.json() : { isAdmin: false })
      .then(d => {
        if (!d.isAdmin) { setLoading(false); return; }
        setIsAdmin(true);
        fetch("/api/admin/fal-balance")
          .then(r => r.ok ? r.json() : null)
          .then(b => {
            if (b && b.balance !== null) {
              setBalance(b.balance);
              setInputVal(String(b.balance));
            }
          })
          .finally(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, []);

  async function saveBalance() {
    setSaving(true);
    const val = parseFloat(inputVal);
    if (!isNaN(val)) {
      await fetch("/api/admin/fal-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: val }),
      });
      setBalance(val);
    }
    setSaving(false);
    setEditing(false);
  }

  if (loading || !isAdmin) return null;

  const bal = typeof balance === "number" ? balance : 0;
  const low = bal < 10;
  const critical = bal < 3;

  // Always show to admin — even if balance is fine, show a subtle bar
  const borderClass = critical
    ? "border-red-500/40 bg-red-500/10"
    : low
    ? "border-yellow-400/40 bg-yellow-400/10"
    : "border-white/10 bg-white/[.03]";
  const labelClass = critical ? "text-red-400" : low ? "text-yellow-300" : "text-white/40";
  const valueClass = critical ? "text-red-300" : low ? "text-yellow-300" : "text-[#D7FF00]";
  const label = critical ? "fal.ai balance CRITICAL" : low ? "fal.ai balance low" : "fal.ai balance";
  const msg = critical ? " — Recharge now!" : low ? " — Consider recharging soon." : "";

  return (
    <div className={"mx-8 mt-4 rounded-2xl border p-4 flex items-center justify-between gap-4 " + borderClass}>
      <div className="flex-1 min-w-0">
        <p className={"text-xs font-black uppercase tracking-wider mb-1 " + labelClass}>{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-sm">$</span>
            <input
              autoFocus
              type="number"
              step="0.01"
              min="0"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveBalance(); if (e.key === "Escape") setEditing(false); }}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm w-28 outline-none focus:border-[#D7FF00]/50"
            />
            <button
              onClick={saveBalance}
              disabled={saving}
              className="bg-[#D7FF00] text-black text-xs font-black uppercase px-3 py-1 rounded-lg hover:bg-[#c8f000] transition disabled:opacity-50">
              {saving ? "..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-white/40 text-xs font-black uppercase px-2 py-1 hover:text-white transition">
              Cancel
            </button>
          </div>
        ) : (
          <p className="text-sm text-white/60">
            Current balance: <span className={"font-black " + valueClass}>${bal.toFixed(2)}</span>{msg}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-black uppercase tracking-wider text-white/50 hover:text-white hover:border-white/20 transition">
            Update balance
          </button>
        )}
        <a
          href="https://fal.ai/dashboard/billing"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-[#D7FF00] px-3 py-2 text-xs font-black uppercase tracking-wider text-black no-underline hover:bg-[#c8f000] transition">
          fal.ai →
        </a>
      </div>
    </div>
  );
}

const modelCards = [
  { name: "SEEDANCE", version: "2.0 FAST", slug: "seedance",    image: "/nova/nova-seedance-fast.png",
    icons: ["Text to Video","Image to Video","Native Video","Fast Generation"] },
  { name: "SEEDANCE", version: "2.0 PRO",  slug: "seedance",    image: "/nova/nova-seedance-pro.png",
    icons: ["Multi-Shot","Camera Control","Realistic Physics","Premium Quality"] },
  { name: "KLING",    version: "3.0",       slug: "kling",       image: "/nova/nova-kling-3.png",
    icons: ["Image to Video","Motion Control","Native Audio","Cinematic Motion"] },
  { name: "VEO",      version: "3.1",       slug: "veo",         image: "/nova/nova-veo-3-1.png",
    icons: ["Text to Video","Image to Video","Reference","4K Output"] },
  { name: "WAN",      version: "2.6",       slug: "wan",         image: "/nova/nova-wan-2-6.png",
    icons: ["Image to Video","Open Source","Fast","High Quality"] },
];

export default function DashboardPage() {
  const router = useRouter();
  return (
    <div className="min-h-full bg-[#050505] text-white">
      {/* Header */}
      <div className="px-8 pt-10 pb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-2">New Generation</p>
          <h1 className="text-5xl font-black uppercase tracking-[-0.06em] leading-none">CREATE AI VIDEO</h1>
        </div>
        <button className="bg-[#D7FF00] text-black text-xs font-black uppercase tracking-[0.12em] px-6 py-3 rounded-lg hover:bg-[#c8f000] transition">
          UPGRADE PLAN
        </button>
      </div>

      <FalBalanceAlert />

      {/* Prompt bar */}
      <div className="px-8 mt-6">
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5">
          <textarea
            placeholder="Create a cinematic product ad..."
            className="w-full bg-transparent text-white text-base resize-none outline-none placeholder:text-white/25 h-28"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              {["Text to Video","Image to Video","Reference"].map(m => (
                <span key={m} className="text-[10px] font-bold uppercase tracking-wider text-white/30 bg-white/5 px-3 py-1 rounded-full">{m}</span>
              ))}
            </div>
            <button
              onClick={() => router.push("/dashboard/models")}
              className="bg-[#D7FF00] text-black text-sm font-black uppercase tracking-[0.08em] px-8 py-3 rounded-xl hover:bg-[#c8f000] transition"
            >
              Generate Video
            </button>
          </div>
        </div>
      </div>

      {/* Model cards */}
      <div className="px-8 mt-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {modelCards.map((m, i) => (
            <div
              key={i}
              onClick={() => router.push("/dashboard/models/" + m.slug)}
              className="group relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#0D0D0D] cursor-pointer transition hover:border-[#D7FF00]/60 hover:shadow-[0_0_40px_rgba(215,255,0,0.12)]"
            >
              <Image
                src={m.image}
                alt={m.name}
                width={400}
                height={560}
                className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D7FF00]">{m.name}</p>
                <p className="text-base font-black uppercase leading-tight tracking-[-0.03em] text-white">{m.version}</p>
                <div className="mt-3 grid grid-cols-4 gap-1">
                  {m.icons.map((ic, j) => (
                    <div key={j} className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                        <span className="text-white/60" style={{fontSize:9}}>◈</span>
                      </div>
                      <span className="text-[7px] text-white/40 text-center leading-tight">{ic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      
      <section className="mt-8 rounded-[1.8rem] border border-[#D7FF00]/20 bg-[#D7FF00]/[0.04] p-5 md:rounded-[2.2rem] md:p-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Advanced Media Suite</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-white">New creation tools</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Talking avatars, long-video planning and video extension workflows for professional AI video production.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <a href="/dashboard/talking-avatar" className="rounded-3xl border border-white/10 bg-black/50 p-5 no-underline transition hover:border-[#D7FF00]/50">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Photo + Voice</p>
            <h3 className="mt-3 text-xl font-black text-white">Talking Avatar</h3>
            <p className="mt-2 text-sm leading-6 text-white/45">Generate a talking video from a portrait and script/audio.</p>
          </a>

          <a href="/dashboard/long-video" className="rounded-3xl border border-white/10 bg-black/50 p-5 no-underline transition hover:border-[#D7FF00]/50">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Scene Planner</p>
            <h3 className="mt-3 text-xl font-black text-white">Long Video</h3>
            <p className="mt-2 text-sm leading-6 text-white/45">Plan long videos as scenes with estimated credit cost.</p>
          </a>

          <a href="/dashboard/video-tools" className="rounded-3xl border border-white/10 bg-black/50 p-5 no-underline transition hover:border-[#D7FF00]/50">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D7FF00]">Continue Scene</p>
            <h3 className="mt-3 text-xl font-black text-white">Video Extension</h3>
            <p className="mt-2 text-sm leading-6 text-white/45">Prepare video continuation with async FFmpeg/R2 workflow.</p>
          </a>
        </div>
      </section>


<footer className="mt-16 pt-8 border-t border-white/8 flex items-center justify-between">
        <p className="text-white/20 text-xs">© 2026 Nova AI · All rights reserved</p>
        <div className="flex gap-6">
          <a href="/pricing" className="text-white/20 text-xs hover:text-white transition">Pricing</a>
          <a href="/terms" className="text-white/20 text-xs hover:text-white transition">Terms</a>
          <a href="/privacy" className="text-white/20 text-xs hover:text-white transition">Privacy</a>
          <a href="/contact" className="text-white/20 text-xs hover:text-white transition">Contact</a>
        </div>
      </footer>
    </div>
  );
}
