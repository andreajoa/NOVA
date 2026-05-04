"use client";
import { useRouter, useParams } from "next/navigation";
import { falModels } from "@/lib/falModels";

export default function ModelPage() {
  const router = useRouter();
  const { model: modelKey } = useParams();
  const model = falModels.video[modelKey];
  if (!model) return <div className="p-8 text-white">Model not found.</div>;

  return (
    <div className="p-8 text-white">
      <button onClick={() => router.push("/dashboard/models")}
        className="text-white/30 text-sm mb-6 flex items-center gap-2 hover:text-white transition bg-transparent border-none cursor-pointer">
        ← Models
      </button>
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-2">Model</p>
      <h1 className="text-4xl font-black uppercase tracking-[-0.05em] mb-2">{model.label}</h1>
      <p className="text-white/40 text-sm mb-10">{model.description}</p>

      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-4">Choose Mode</p>
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        {Object.entries(model.modes).map(([modeKey, modeData]) => (
          <div
            key={modeKey}
            onClick={() => router.push("/dashboard/models/" + modelKey + "/" + modeKey)}
            className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 cursor-pointer transition hover:border-[#D7FF00]/60 hover:shadow-[0_0_30px_rgba(215,255,0,0.10)] group"
          >
            <p className="text-2xl mb-3 text-[#D7FF00]">◈</p>
            <p className="font-black uppercase text-sm tracking-tight">{modeData.label}</p>
            <p className="text-white/30 text-xs mt-2">{modeData.needsImage ? "Requires image" : "Prompt only"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
