"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { falModels } from "@/lib/falModels";

export default function ModelsPage() {
  const router = useRouter();
  const models = falModels.video;

  const images = {
    seedance:      "/nova/nova-seedance-pro.png",
    kling:         "/nova/nova-kling-3.png",
    pixverse:      "/nova/nova-seedance-fast.png",
    veo:           "/nova/nova-veo-3-1.png",
    happyhorse:    "/nova/nova-seedance-fast.png",
    ltx:           "/nova/nova-seedance-pro.png",
    wan:           "/nova/nova-wan-2-6.png",
    lyra:          "/nova/nova-kling-3.png",
    lucy:          "/nova/nova-veo-3-1.png",
    "kling-avatar":"/nova/nova-kling-3.png",
  };

  return (
    <div className="p-8 text-white">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-2">Library</p>
      <h1 className="text-4xl font-black uppercase tracking-[-0.05em] mb-8">Models</h1>

      <div className="grid grid-cols-5 gap-4">
        {Object.entries(models).map(([key, model]) => (
          <div
            key={key}
            onClick={() => router.push("/dashboard/models/" + key)}
            className="group relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#0D0D0D] cursor-pointer transition hover:border-[#D7FF00]/60 hover:shadow-[0_0_40px_rgba(215,255,0,0.12)]"
          >
            <Image
              src={images[key] || "/nova/nova-seedance-pro.png"}
              alt={model.label}
              width={400}
              height={560}
              className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D7FF00]">Video</p>
              <p className="text-sm font-black uppercase leading-tight">{model.label}</p>
              <p className="text-[10px] text-white/40 mt-1">{model.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
