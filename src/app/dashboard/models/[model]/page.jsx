"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { publicGenerationModels as novaModels } from "@/lib/publicGenerationCatalog";

function getModelType(modelKey) {
  if (novaModels.image?.[modelKey]) return "image";
  if (novaModels.video?.[modelKey]) return "video";
  return null;
}

export default function ModelPage() {
  const router = useRouter();
  const { model: modelKey } = useParams();

  const type = getModelType(modelKey);
  const model = novaModels.image?.[modelKey] || novaModels.video?.[modelKey];
  const modes = Object.entries(model?.modes || {});

  if (!model) {
    return (
      <main className="min-h-screen bg-[#020303] p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-8">Modelo não encontrado.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1300px] px-4 py-6 md:px-6 md:py-10">
        <button
          type="button"
          onClick={() => router.push(type === "video" ? "/dashboard/generate" : "/dashboard/models")}
          className="mb-5 border-0 bg-transparent p-0 text-sm text-white/35 transition hover:text-white"
        >
          ← Voltar
        </button>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707] p-6 shadow-[0_0_100px_rgba(215,255,0,.06)] md:p-8">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#D7FF00]/12 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">
                {type === "image" ? "Modelo de imagem" : "Modelo de vídeo"}
              </p>
              {model.tier === "free" && <span className="rounded-full bg-[#D7FF00] px-3 py-1 text-[9px] font-black uppercase text-black">FREE</span>}
            </div>
            <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl">{model.label}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/50">{model.description}</p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modes.map(([modeKey, modeData]) => (
                <Link
                  key={modeKey}
                  href={`/dashboard/models/${modelKey}/${modeKey}`}
                  className="group rounded-[1.5rem] border border-white/10 bg-black/35 p-5 no-underline transition hover:-translate-y-1 hover:border-[#D7FF00]/45 hover:shadow-[0_0_70px_rgba(215,255,0,.10)]"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D7FF00]/10 text-2xl text-[#D7FF00]">{modeData.needsImage ? "▧" : "✦"}</div>
                  <h2 className="mt-5 text-2xl font-black uppercase tracking-[-0.05em] text-white">{modeData.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    {modeData.needsImage
                      ? "Use uma imagem de referência para guiar a geração."
                      : "Comece com um prompt e ajuste as opções antes de gerar."}
                  </p>
                  <div className="mt-5 text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00]">Abrir gerador →</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
