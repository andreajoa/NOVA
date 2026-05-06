import Image from "next/image";
import Link from "next/link";

const asset = "/nova/models-v2/";

const filters = [
  "Todos",
  "Ultra realista",
  "Cinemático",
  "Design",
  "Ilustração",
  "Criativo",
  "Produto",
  "Texto",
  "Vídeo",
];

const stats = [
  {
    icon: "◈",
    title: "13 modelos de imagem",
    copy: "Cada modelo foi escolhido para entregar um tipo de resultado.",
  },
  {
    icon: "⚡",
    title: "Escolha mais rápida",
    copy: "Visual, estilo e finalidade ficam claros antes de abrir.",
  },
  {
    icon: "✦",
    title: "Para todo tipo de criação",
    copy: "Produto, retrato, campanha, conceito, UGC e branding.",
  },
];

const models = [
  {
    slug: "seedance-fast",
    eyebrow: "Seedance",
    badge: "Fast",
    title: "Seedance 2.0 Fast",
    category: "Ultra realistic",
    description: "Ultra realista, perfeito para visuais automotivos e de impacto.",
    modes: "2 modos",
    image: asset + "card-car.png",
    accent: "border-[#D7FF00]/35",
    chip: "text-[#D7FF00]",
  },
  {
    slug: "flux-dev",
    eyebrow: "UGC Creatives",
    badge: "UGC",
    title: "Flux Dev",
    category: "Creator style",
    description: "Estilo criativo e autêntico para conteúdo e campanhas.",
    modes: "2 modos",
    image: asset + "card-portrait.png",
    accent: "border-fuchsia-300/30",
    chip: "text-fuchsia-300",
  },
  {
    slug: "flux-pro-1-1",
    eyebrow: "Veo 3",
    badge: "Pro",
    title: "Flux Pro 1.1",
    category: "Cinematic",
    description: "Cinemático e dramático para narrativas visuais de alto nível.",
    modes: "2 modos",
    image: asset + "card-astronaut.png",
    accent: "border-amber-300/30",
    chip: "text-amber-300",
  },
  {
    slug: "flux-ultra",
    eyebrow: "Cinematic Video",
    badge: "4MP",
    title: "Flux Ultra",
    category: "Studio quality",
    description: "Detalhes extremos e iluminação avançada para resultados premium.",
    modes: "1 modo",
    image: asset + "card-serum.png",
    accent: "border-cyan-300/30",
    chip: "text-cyan-300",
  },
  {
    slug: "gpt-image-2",
    eyebrow: "AI Native",
    badge: "OpenAI",
    title: "GPT Image 2",
    category: "AI native",
    description: "Nativo de IA para ideias rápidas com qualidade impressionante.",
    modes: "1 modo",
    image: asset + "card-gpt-image-2.png",
    accent: "border-cyan-300/30",
    chip: "text-cyan-300",
  },
  {
    slug: "recraft-v3",
    eyebrow: "Product Ads",
    badge: "Design",
    title: "Recraft V3",
    category: "Made to convert",
    description: "Perfeito para anúncios, produtos e composições comerciais.",
    modes: "2 modos",
    image: asset + "card-city-car.png",
    accent: "border-[#D7FF00]/35",
    chip: "text-[#D7FF00]",
  },
  {
    slug: "ideogram-v3",
    eyebrow: "Kling 1.6",
    badge: "Text",
    title: "Ideogram V3",
    category: "Dynamic concept",
    description: "Tipografia integrada e layouts com precisão e estilo.",
    modes: "2 modos",
    image: asset + "card-mountain.png",
    accent: "border-amber-300/30",
    chip: "text-amber-300",
  },
  {
    slug: "stable-diffusion-3-5",
    eyebrow: "Wan 2.6",
    badge: "Open source",
    title: "Stable Diffusion 3.5",
    category: "Portrait",
    description: "Modelo open source para liberdade total de criação.",
    modes: "2 modos",
    image: asset + "card-ugc.png",
    accent: "border-violet-300/30",
    chip: "text-violet-300",
  },
  {
    slug: "auraflow",
    eyebrow: "Seedance 2.0 Pro",
    badge: "Pro",
    title: "AuraFlow",
    category: "Sci-fi",
    description: "Ultra realista com foco em luz, reflexos e textura.",
    modes: "1 modo",
    image: asset + "card-car.png",
    accent: "border-[#D7FF00]/35",
    chip: "text-[#D7FF00]",
  },
  {
    slug: "nano-banana-2",
    eyebrow: "UGC Creatives",
    badge: "Fast",
    title: "Nano Banana 2",
    category: "Social",
    description: "Criativo, leve e rápido para conteúdos únicos.",
    modes: "1 modo",
    image: asset + "card-ugc.png",
    accent: "border-fuchsia-300/30",
    chip: "text-fuchsia-300",
  },
  {
    slug: "hidream-i1",
    eyebrow: "Veo 3.1",
    badge: "HD",
    title: "HiDream I1",
    category: "Product spotlight",
    description: "Foco em produtos e objetos com acabamento profissional.",
    modes: "2 modos",
    image: asset + "card-headphones.png",
    accent: "border-[#D7FF00]/35",
    chip: "text-[#D7FF00]",
  },
  {
    slug: "sana",
    eyebrow: "Cinematic Videos",
    badge: "NVIDIA",
    title: "SANA",
    category: "Experimental",
    description: "Uma opção forte para renders de alto estilo e moods visuais.",
    modes: "1 modo",
    image: asset + "card-motorbike.png",
    accent: "border-cyan-300/30",
    chip: "text-cyan-300",
  },
  {
    slug: "kolors",
    eyebrow: "Branding",
    badge: "Colors",
    title: "KOLORS",
    category: "Branding",
    description: "Cores vibrantes e paletas únicas para identidades visuais.",
    modes: "2 modos",
    image: asset + "card-kolors.png",
    accent: "border-orange-300/30",
    chip: "text-orange-300",
  },
];

const bannerImages = [
  asset + "card-city-car.png",
  asset + "card-mountain.png",
  asset + "card-serum.png",
  asset + "card-portrait.png",
];

function ModelCard({ item }) {
  return (
    <Link
      href={`/dashboard/models/${item.slug}`}
      className={`group relative overflow-hidden rounded-[1.45rem] border ${item.accent} bg-[#080808] no-underline shadow-[0_24px_80px_rgba(0,0,0,.38)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_0_80px_rgba(215,255,0,.12)]`}
    >
      <div className="relative h-full min-h-[330px] overflow-hidden rounded-[1.35rem]">
        <Image
          src={item.image}
          alt={item.title}
          width={1086}
          height={1448}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(215,255,0,.20),transparent_24%),radial-gradient(circle_at_85%_15%,rgba(56,189,248,.14),transparent_22%)] opacity-70" />

        <div className="relative flex min-h-[330px] flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-[65%] text-[10px] font-black uppercase tracking-[0.2em] text-white/62">
              {item.eyebrow}
            </p>
            <span className={`rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur ${item.chip}`}>
              {item.badge}
            </span>
          </div>

          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${item.chip}`}>
              {item.category}
            </p>
            <h3 className="mt-2 text-2xl font-black leading-[0.95] tracking-[-0.055em] text-white md:text-3xl">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/63">
              {item.description}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.12em]">
              <span className="text-white/45">{item.modes}</span>
              <span className="text-[#D7FF00]">Abrir modelo →</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardModelsPage() {
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
              Explore nossa biblioteca de modelos e encontre o estilo, a tecnologia e o desempenho ideais para cada criação.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <span
                key={filter}
                className={
                  index === 0
                    ? "rounded-full bg-[#D7FF00] px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black"
                    : "rounded-full border border-white/12 bg-white/[.03] px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/55"
                }
              >
                {filter}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.title} className="rounded-[1.2rem] border border-white/10 bg-black/30 p-5">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#D7FF00]/10 text-2xl text-[#D7FF00]">
                  {item.icon}
                </div>
                <h3 className="text-base font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/45">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[1.8rem] border border-white/10 bg-[#070707] p-5 md:rounded-[2.2rem] md:p-7">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Model library</p>
            <h2 className="mt-2 text-3xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-5xl">
              13 modelos. Mais impacto visual.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {models.map((item) => (
              <ModelCard key={item.slug} item={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
