"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
        <div className="grid grid-cols-5 gap-4">
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
