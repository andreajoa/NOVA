"use client";
import Footer from "@/components/Footer";
import { useState } from "react";
import Link from "next/link";

const AD_TYPES = [
  { label: "Hyper Motion",       color: "#D7FF00" },
  { label: "UGC",                color: "#a78bfa" },
  { label: "UGC Virtual Try On", color: "#f472b6" },
  { label: "Unboxing",           color: "#60a5fa" },
  { label: "TV Spot",            color: "#fb923c" },
  { label: "Tutorial",           color: "#34d399" },
  { label: "Pro Virtual Try On", color: "#e879f9" },
];

// Usando Unsplash source que funciona sem config extra
const GRID_ITEMS = [
  { type: "Hyper Motion",       seed: 101 },
  { type: "Unboxing",           seed: 102 },
  { type: "Hyper Motion",       seed: 103 },
  { type: "UGC",                seed: 201 },
  { type: "UGC",                seed: 202 },
  { type: "UGC Virtual Try On", seed: 301 },
  { type: "UGC",                seed: 203 },
  { type: "UGC",                seed: 204 },
  { type: "TV Spot",            seed: 401 },
  { type: "Unboxing",           seed: 104 },
  { type: "UGC Virtual Try On", seed: 302 },
  { type: "Tutorial",           seed: 501 },
  { type: "UGC",                seed: 205 },
  { type: "Unboxing",           seed: 105 },
  { type: "UGC Virtual Try On", seed: 303 },
  { type: "Tutorial",           seed: 502 },
  { type: "UGC",                seed: 206 },
  { type: "Hyper Motion",       seed: 106 },
  { type: "UGC",                seed: 207 },
  { type: "Pro Virtual Try On", seed: 601 },
  { type: "UGC Virtual Try On", seed: 304 },
  { type: "Unboxing",           seed: 107 },
  { type: "Hyper Motion",       seed: 108 },
  { type: "UGC Virtual Try On", seed: 305 },
];

const TYPE_COLORS = {
  "Hyper Motion":       "#D7FF00",
  "UGC":                "#a78bfa",
  "UGC Virtual Try On": "#f472b6",
  "Unboxing":           "#60a5fa",
  "TV Spot":            "#fb923c",
  "Tutorial":           "#34d399",
  "Pro Virtual Try On": "#e879f9",
};

function scrapeFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.","");
    const parts = u.pathname.split("/").filter(Boolean);
    const name = parts[parts.length - 1]
      ?.replace(/[-_]/g," ")
      .replace(/\w/g, c => c.toUpperCase()) || host;
    return { name, domain: host };
  } catch {
    return { name: "Your Product", domain: "" };
  }
}

export default function ProductAdGenerator() {
  const [urlInput, setUrlInput] = useState("");
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [activeType, setActiveType] = useState(null);
  const [prompt, setPrompt]     = useState("");
  const [hovered, setHovered]   = useState(null);

  function handleGenerate() {
    if (!urlInput.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setProduct(scrapeFromUrl(urlInput));
      setLoading(false);
    }, 1200);
  }

  const filtered = activeType
    ? GRID_ITEMS.filter(i => i.type === activeType)
    : GRID_ITEMS;

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-[72px]">

      {/* HERO */}
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(215,255,0,0.07),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-10 text-center">

          {product ? (
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#D7FF00]/10 border border-[#D7FF00]/20 flex items-center justify-center text-xs font-black text-[#D7FF00]">
                {product.name[0]}
              </div>
              <span className="text-white/50 text-sm">{product.domain}</span>
              <span className="text-[#D7FF00] text-xs bg-[#D7FF00]/10 px-2 py-0.5 rounded-full font-black">✓ Connected</span>
            </div>
          ) : (
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#D7FF00] mb-4">Product · Avatar · UGC</p>
          )}

          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-[-0.06em] leading-none mb-10">
            {product ? `Ads for ${product.name}` : "Turn any product into a video ad"}
          </h1>

          {/* URL input */}
          <div className="max-w-2xl mx-auto bg-[#0D0D0D] border border-white/10 rounded-2xl p-2 flex gap-2 mb-4">
            <input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              placeholder="Paste product URL — we extract everything automatically"
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-white/25 outline-none"
            />
            <button onClick={handleGenerate} disabled={loading}
              className="bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-[#c8f000] transition disabled:opacity-50 flex-shrink-0 border-none cursor-pointer">
              {loading ? "Scanning…" : "GENERATE →"}
            </button>
          </div>

          {/* Prompt row */}
          <div className="max-w-2xl mx-auto flex items-center gap-2 flex-wrap justify-center">
            <div className="flex items-center gap-2 bg-[#0D0D0D] border border-white/8 rounded-xl px-4 py-2 flex-1 min-w-[180px]">
              <span className="text-white/20 text-xs">+</span>
              <input value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="Describe what happens in the ad..."
                className="bg-transparent text-sm text-white placeholder-white/20 outline-none flex-1 min-w-0" />
            </div>
            {["UGC","9:16","8s","720p"].map(f => (
              <span key={f} className="text-xs text-white/40 bg-white/5 border border-white/8 px-3 py-2 rounded-lg font-bold cursor-pointer hover:border-[#D7FF00]/40 hover:text-white transition select-none">
                {f}
              </span>
            ))}
            <Link href="/dashboard/generate"
              className="bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-5 py-2 rounded-xl hover:bg-[#c8f000] transition no-underline flex-shrink-0">
              GENERATE →
            </Link>
          </div>
        </div>
      </div>

      {/* TYPE FILTERS */}
      <div className="max-w-6xl mx-auto px-6 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-[#D7FF00] mr-2">✦ Generate across formats</span>
          <button onClick={() => setActiveType(null)}
            className={"text-xs font-bold px-3 py-1.5 rounded-full border transition cursor-pointer " +
              (!activeType ? "bg-[#D7FF00] text-black border-[#D7FF00]" : "text-white/40 border-white/10 hover:text-white bg-transparent")}>
            All
          </button>
          {AD_TYPES.map(t => (
            <button key={t.label} onClick={() => setActiveType(activeType === t.label ? null : t.label)}
              className={"text-xs font-bold px-3 py-1.5 rounded-full border transition cursor-pointer " +
                (activeType === t.label ? "border-transparent text-black" : "text-white/40 border-white/10 hover:text-white bg-transparent")}
              style={activeType === t.label ? { backgroundColor: t.color } : {}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIDEO GRID — CSS grid simples sem columns */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
        }}>
          {filtered.map((item, i) => {
            const tagColor = TYPE_COLORS[item.type] || "#fff";
            // Alterna alturas para dar efeito masonry visual
            const tall = i % 5 === 0 || i % 7 === 0;
            return (
              <div key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  background: "#111",
                  aspectRatio: tall ? "9/16" : "3/4",
                  gridRow: tall ? "span 1" : "span 1",
                }}>
                {/* Imagem via via.placeholder que sempre funciona */}
                <img
                  src={`https://picsum.photos/seed/${item.seed}/400/${tall ? 700 : 540}`}
                  alt={item.type}
                  style={{
                    width:"100%", height:"100%",
                    objectFit:"cover",
                    display:"block",
                    transition:"transform 0.5s ease",
                    transform: hovered === i ? "scale(1.05)" : "scale(1)",
                  }}
                  onError={e => {
                    // fallback: colored div se imagem falhar
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement.style.background = "#1a1a1a";
                  }}
                />
                {/* Gradient overlay */}
                <div style={{
                  position:"absolute", inset:0,
                  background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)",
                  pointerEvents:"none",
                }} />
                {/* Type tag */}
                <div style={{position:"absolute", top:"10px", left:"10px"}}>
                  <span style={{
                    fontSize:"10px", fontWeight:900, textTransform:"uppercase",
                    letterSpacing:"0.05em", background:"rgba(0,0,0,0.7)",
                    color: tagColor, padding:"4px 8px", borderRadius:"8px",
                    backdropFilter:"blur(4px)",
                  }}>{item.type}</span>
                </div>
                {/* Hover actions */}
                {hovered === i && (
                  <div style={{
                    position:"absolute", bottom:"10px", left:"10px", right:"10px",
                    display:"flex", gap:"6px",
                  }}>
                    <Link href="/dashboard/generate"
                      className="no-underline"
                      style={{
                        flex:1, textAlign:"center",
                        background:"#D7FF00", color:"#000",
                        fontSize:"10px", fontWeight:900,
                        textTransform:"uppercase", letterSpacing:"0.05em",
                        padding:"8px", borderRadius:"10px",
                      }}>
                      Recreate
                    </Link>
                    <button style={{
                      background:"rgba(255,255,255,0.15)",
                      backdropFilter:"blur(4px)",
                      color:"#fff", fontSize:"12px",
                      padding:"8px 12px", borderRadius:"10px",
                      border:"none", cursor:"pointer", fontWeight:"bold",
                    }}>♥</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </main>
  );
}