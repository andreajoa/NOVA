"use client";
import { useState } from "react";
import Link from "next/link";

const assets = [
  { id:1, name:"Logo Primary",  type:"SVG", size:"12 KB",  tag:"Logo"       },
  { id:2, name:"Logo White",    type:"PNG", size:"48 KB",  tag:"Logo"       },
  { id:3, name:"Brand Colors",  type:"JSON", size:"2 KB",  tag:"Colors"     },
  { id:4, name:"Product Shot A",type:"PNG", size:"2.1 MB", tag:"Product"    },
  { id:5, name:"Product Shot B",type:"PNG", size:"1.8 MB", tag:"Product"    },
  { id:6, name:"Brand Font",    type:"TTF", size:"180 KB", tag:"Typography" },
];

const colors = [
  { name:"Primary Yellow", hex:"#D7FF00" },
  { name:"Background",     hex:"#050505" },
  { name:"Surface",        hex:"#0D0D0D" },
  { name:"White",          hex:"#FFFFFF" },
];

const tags = ["All","Logo","Product","Colors","Typography"];

export default function BrandKitPage() {
  const [activeTag, setActiveTag] = useState("All");
  const filtered = activeTag === "All" ? assets : assets.filter(a => a.tag === activeTag);

  return (
    <div className="p-8 text-white">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-1">Workspace</p>
          <h1 className="text-4xl font-black uppercase tracking-[-0.05em]">Brand Kit</h1>
          <p className="text-white/40 text-sm mt-1">Your brand assets, colors, and fonts in one place.</p>
        </div>
        <Link href="/dashboard/brandkit/upload"
          className="bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#c8f000] transition no-underline">
          + Upload Asset
        </Link>
      </div>

      {/* Brand Colors */}
      <section className="mb-10">
        <p className="text-xs font-black uppercase tracking-wider text-white/30 mb-4">Brand Colors</p>
        <div className="grid grid-cols-4 gap-3">
          {colors.map(c => (
            <div key={c.hex} className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-4">
              <div className="w-full h-14 rounded-xl mb-3 border border-white/10" style={{background:c.hex}} />
              <p className="text-white text-xs font-black">{c.name}</p>
              <p className="text-white/30 text-xs font-mono mt-0.5">{c.hex}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Assets */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black uppercase tracking-wider text-white/30">Assets</p>
          <div className="flex gap-2">
            {tags.map(t => (
              <button key={t} onClick={() => setActiveTag(t)}
                className={"text-xs font-bold px-3 py-1.5 rounded-lg transition border-none cursor-pointer " +
                  (activeTag === t ? "bg-[#D7FF00] text-black" : "text-white/40 hover:text-white bg-white/5")}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {filtered.map(asset => (
            <div key={asset.id}
              className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-5 flex items-center justify-between group hover:border-white/20 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 text-xs font-black flex-shrink-0">
                  {asset.type}
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{asset.name}</p>
                  <p className="text-white/30 text-xs">{asset.size}</p>
                </div>
              </div>
              <button className="text-white/20 hover:text-[#D7FF00] transition text-sm font-bold opacity-0 group-hover:opacity-100 bg-transparent border-none cursor-pointer">↓</button>
            </div>
          ))}
          <Link href="/dashboard/brandkit/upload"
            className="bg-[#0D0D0D] border border-dashed border-white/15 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-[#D7FF00]/40 transition no-underline">
            <span className="text-2xl text-white/20">+</span>
            <span className="text-white/30 text-xs font-bold">Upload asset</span>
          </Link>
        </div>
      </section>

      {/* Sub-pages nav */}
      <section className="mb-10">
        <p className="text-xs font-black uppercase tracking-wider text-white/30 mb-4">Quick Access</p>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/brandkit/upload"
            className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-5 hover:border-[#D7FF00]/40 transition no-underline group">
            <p className="text-[#D7FF00] text-lg font-black mb-1 group-hover:scale-105 transition-transform inline-block">↑</p>
            <p className="text-white font-black text-sm">Upload Assets</p>
            <p className="text-white/30 text-xs mt-1">Add logos, fonts, product photos</p>
          </Link>
          <Link href="/dashboard/brandkit/assets"
            className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-5 hover:border-[#D7FF00]/40 transition no-underline group">
            <p className="text-[#D7FF00] text-lg font-black mb-1 group-hover:scale-105 transition-transform inline-block">◫</p>
            <p className="text-white font-black text-sm">All Assets</p>
            <p className="text-white/30 text-xs mt-1">Browse and manage your library</p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 pt-8 border-t border-white/8 flex items-center justify-between">
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