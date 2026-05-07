import Image from "next/image";
import Link from "next/link";
import { falModels } from "@/lib/falModels";

const asset = "/nova/models-v2/";

const visuals = [
  "card-car.png",
  "card-portrait.png",
  "card-astronaut.png",
  "card-serum.png",
  "card-gpt-image-2.png",
  "card-city-car.png",
  "card-mountain.png",
  "card-ugc.png",
  "card-headphones.png",
  "card-motorbike.png",
  "card-kolors.png",
];

const bannerImages = [
  asset + "card-city-car.png",
  asset + "card-mountain.png",
  asset + "card-serum.png",
  asset + "card-portrait.png",
];

function visualFor(index) {
  return asset + visuals[index % visuals.length];
}

function chipFor(index) {
  return ["text-[#D7FF00]", "text-fuchsia-300", "text-cyan-300", "text-amber-300", "text-violet-300"][index % 5];
}

function borderFor(index) {
  return ["border-[#D7FF00]/35", "border-fuchsia-300/30", "border-cyan-300/30", "border-amber-300/30", "border-violet-300/30"][index % 5];
}

function ModelCard({ item, index }) {
  const [key, model] = item;
  const modeCount = Object.keys(model?.modes || {}).length;
  const chip = chipFor(index);

  return (
    <Link
      href={`/dashboard/models/${key}`}
      className={`group relative overflow-hidden rounded-[1.45rem] border ${borderFor(index)} bg-[#080808] no-underline shadow-[0_24px_80px_rgba(0,0,0,.38)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_0_80px_rgba(215,255,0,.12)]`}
    >
      <div className="relative h-full min-h-[330px] overflow-hidden rounded-[1.35rem]">
        <Image
          src={visualFor(index)}
          alt={model.label}
          width={1086}
          height={1448}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(215,255,0,.20),transparent_24%),radial-gradient(circle_at_85%_15%,rgba(56,189,248,.14),transparent_22%)] opacity-70" />

        <div className="relative flex min-h-[330px] flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-[65%] text-[10px] font-black uppercase tracking-[0.2em] text-white/62">
              Image Model
            </p>
            <span className={`rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur ${chip}`}>
              {modeCount} modo{modeCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${chip}`}>
              Modelo de imagem
            </p>
            <h3 className="mt-2 text-2xl font-black leading-[0.95] tracking-[-0.055em] text-white md:text-3xl">
              {model.label}
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/63">
              {model.description || "Crie imagens com IA usando este modelo."}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.12em]">
              <span className="text-white/45">{key}</span>
              <span className="text-[#D7FF00]">Abrir modelo →</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardModelsPage() {
  const imageModels = Object.entries(falModels.image || {});

  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-5 md:px-6 md:py-8">
        <section className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#070707] p-2 shadow-[0_0_90px_rgba(215,255,0,.07)] md:rounded-[2.2rem]">
          <div className="grid h-[210px] grid-cols-2 overflow-hidden rounded-[1.35rem] sm:h-[280px] lg:h-[320px] lg:grid-cols-4">
            {bannerImages.map((image, index) => (
              <div key={image} className="relative overflow-hidden">
                <Image
                  src={image}
                  alt=""
                  width={1086}
                  height={1448}
                  priority={index < 2}
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[1.8rem] border border-white/10 bg-[#070707] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.07)] md:rounded-[2.2rem] md:p-7">
          <div className="max-w-5xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
              Geração • Modelos de imagem
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-6xl">
              Escolha o modelo ideal para cada imagem.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/50 md:text-base">
              Cada card usa a chave real do modelo. Clique, escolha o modo e gere com resolução, proporção e quantidade.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[1.8rem] border border-white/10 bg-[#070707] p-5 md:rounded-[2.2rem] md:p-7">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Model library</p>
            <h2 className="mt-2 text-3xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-5xl">
              {imageModels.length} modelos conectados.
            </h2>
          </div>

          {imageModels.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {imageModels.map((item, index) => (
                <ModelCard key={item[0]} item={item} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-black/30 p-8 text-white/45">
              Nenhum modelo de imagem encontrado em falModels.image.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
