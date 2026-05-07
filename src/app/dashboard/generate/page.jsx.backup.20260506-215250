"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { falModels } from "@/lib/falModels";

const VIDEO_META = {
  seedance:       { badge:"Fast",     img:"/nova/nova-seedance-fast.png"    },
  kling:          { badge:"Pro",      img:"/nova/nova-kling-3.png"          },
  pixverse:       { badge:"",         img:"/nova/nova-cinematic-videos.png" },
  veo:            { badge:"New",      img:"/nova/nova-veo-3-1.png"          },
  happyhorse:     { badge:"Creative", img:"/nova/nova-ugc-creatives.png"    },
  ltx:            { badge:"",         img:"/nova/nova-seedance-pro.png"     },
  wan:            { badge:"",         img:"/nova/nova-wan-2-6.png"          },
  lyra:           { badge:"Beta",     img:"/nova/nova-product-ads.png"      },
  lucy:           { badge:"Beta",     img:"/nova/nova-creative-agent.png"   },
  "kling-avatar": { badge:"Avatar",   img:"/nova/nova-kling-3.png"          },
};

export default function GerarVideoPage() {
  const router = useRouter();
  const videoModels = Object.entries(falModels.video);

  return (
    <div className="p-8 text-white min-h-screen">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-2">Geração</p>
      <h1 className="text-4xl font-black uppercase tracking-[-0.05em] mb-2">Gerar Vídeo</h1>
      <p className="text-white/40 text-sm mb-8">{videoModels.length} modelos disponíveis · Escolha o modelo e comece a gerar</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {videoModels.map(([key, model]) => {
          const m = VIDEO_META[key] || { badge:"", img:"/nova/nova-seedance-pro.png" };
          const modeCount = Object.keys(model.modes || {}).length;
          return (
            <div
              key={key}
              onClick={() => router.push("/dashboard/models/" + key)}
              className="group relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#0D0D0D] cursor-pointer transition hover:border-[#D7FF00]/60 hover:shadow-[0_0_40px_rgba(215,255,0,0.12)]"
            >
              <Image src={m.img} alt={model.label} width={400} height={560} className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              {m.badge ? (
                <div className="absolute top-3 right-3">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-[#D7FF00] text-black px-2 py-0.5 rounded-full">{m.badge}</span>
                </div>
              ) : null}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#D7FF00] mb-0.5">Modelo de Vídeo</p>
                <p className="text-sm font-black uppercase leading-tight">{model.label}</p>
                <p className="text-[10px] text-white/40 mt-1 leading-snug">{model.description}</p>
                <p className="text-[9px] text-white/20 mt-2">{modeCount} modo{modeCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-16 pt-8 border-t border-white/8 flex items-center justify-between">
        <p className="text-white/20 text-xs">© 2026 Nova AI · All rights reserved</p>
        <div className="flex gap-6">
          <a href="/pricing" className="text-white/20 text-xs hover:text-white transition">Pricing</a>
          <a href="/terms" className="text-white/20 text-xs hover:text-white transition">Terms</a>
          <a href="/privacy" className="text-white/20 text-xs hover:text-white transition">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
