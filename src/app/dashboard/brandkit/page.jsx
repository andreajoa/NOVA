"use client";
import { useState } from "react";
import Link from "next/link";

const assets = [
  { id: 1, name: "Product Hero — White BG", type: "image", size: "2.4 MB", used: 14, tag: "product" },
  { id: 2, name: "Logo Horizontal Dark",    type: "image", size: "480 KB", used: 32, tag: "logo" },
  { id: 3, name: "Brand Video Loop",        type: "video", size: "18 MB",  used: 5,  tag: "video" },
  { id: 4, name: "Summer Campaign Shot",    type: "image", size: "3.1 MB", used: 7,  tag: "product" },
  { id: 5, name: "Logo White Variant",      type: "image", size: "390 KB", used: 21, tag: "logo" },
  { id: 6, name: "Lifestyle — Outdoor",     type: "image", size: "4.2 MB", used: 3,  tag: "product" },
];
const colors = ["#1A1A1A","#D7FF00","#FFFFFF","#FF4D4D","#4D79FF"];
const fonts = [{ name:"Geist Sans", use:"Headlines & UI" },{ name:"Geist Mono", use:"Code & Labels" }];

export default function BrandkitPage() {
  const [tab, setTab] = useState("assets");
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? assets : assets.filter(a => a.tag === filter);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Brand Kit</h1>
            <p className="text-white/40 text-sm mt-1">Seus assets de marca em um so lugar</p>
          </div>
          <Link href="/dashboard/brandkit/upload" className="bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#c8f000] transition no-underline">+ Upload Asset</Link>
        </div>

        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 w-fit">
          {[["assets","Assets"],["colors","Colors"],["fonts","Fonts"],["guidelines","Guidelines"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} className={"px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition " + (tab === id ? "bg-[#D7FF00] text-black" : "text-white/40 hover:text-white")}>{label}</button>
          ))}
        </div>

        {tab === "assets" && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[["6","Assets uploaded"],["44.6 MB","Total storage"],["82","Total uses"]].map(([v,l]) => (
                <div key={l} className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-5">
                  <p className="text-[#D7FF00] text-3xl font-black">{v}</p>
                  <p className="text-white/40 text-xs mt-1">{l}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-6">
              {["all","logo","product","video"].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={"px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition " + (filter === f ? "bg-white text-black border-white" : "border-white/15 text-white/40 hover:text-white")}>{f}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {filtered.map(asset => (
                <div key={asset.id} className="group bg-[#0D0D0D] border border-white/8 rounded-2xl overflow-hidden hover:border-[#D7FF00]/40 transition">
                  <div className="aspect-video bg-[#151515] flex items-center justify-center relative">
                    <span className="text-4xl">{asset.type === "video" ? "🎬" : "🖼️"}</span>
                    <div className="absolute top-3 right-3"><span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-white/10 text-white/50">{asset.tag}</span></div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-bold text-white truncate">{asset.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-white/30">{asset.size}</p>
                      <p className="text-xs text-[#D7FF00] font-bold">{asset.used}x used</p>
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/dashboard/brandkit/upload" className="bg-[#0D0D0D] border border-dashed border-white/15 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#D7FF00]/50 hover:bg-[#D7FF00]/5 transition no-underline group" style={{minHeight:"180px"}}>
                <span className="text-3xl text-white/30">+</span>
                <p className="text-white/30 text-xs font-bold uppercase tracking-wider group-hover:text-[#D7FF00] transition">Upload</p>
              </Link>
            </div>
          </div>
        )}

        {tab === "colors" && (
          <div>
            <div className="grid grid-cols-5 gap-4 mb-8">
              {colors.map(c => (
                <div key={c} className="rounded-2xl overflow-hidden border border-white/8">
                  <div className="h-24 w-full" style={{backgroundColor: c}} />
                  <div className="bg-[#0D0D0D] p-3">
                    <p className="text-xs font-black text-white">{c}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">Brand color</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="text-xs font-black uppercase tracking-wider border border-white/15 px-5 py-2.5 rounded-xl text-white/50 hover:text-white hover:border-white/40 transition">+ Add Color</button>
          </div>
        )}

        {tab === "fonts" && (
          <div className="space-y-4">
            {fonts.map(f => (
              <div key={f.name} className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-white">{f.name}</p>
                  <p className="text-white/40 text-xs mt-1">{f.use}</p>
                </div>
                <div className="text-[#D7FF00] text-xs font-black uppercase tracking-wider">Active</div>
              </div>
            ))}
          </div>
        )}

        {tab === "guidelines" && (
          <div className="space-y-4">
            {[
              { title: "Logo Usage", desc: "Use a logo sempre em fundo escuro (#050505) ou branco. Nunca distorca ou recolora." },
              { title: "Color Palette", desc: "Amarelo #D7FF00 e a cor de destaque. Use com moderacao — somente em CTAs e destaques." },
              { title: "Typography", desc: "Geist Sans para titulos e UI. Geist Mono para dados e labels tecnicos. Maximo 2 fontes." },
              { title: "Video Style", desc: "Videos com fundo neutro (preto ou branco). Prefira cortes limpos e movimentos suaves." },
            ].map(g => (
              <div key={g.title} className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#D7FF00] mb-2">{g.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}