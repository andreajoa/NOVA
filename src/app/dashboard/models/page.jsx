import Image from "next/image";
import Link from "next/link";

const asset = "/nova/models-v2/";

const stats = [
  ["13 image models", "Choose the best engine for each visual idea."],
  ["Clean mobile layout", "Larger headlines, clearer hierarchy, better readability."],
  ["Faster decision", "Each card is more visual and easier to compare."],
];

const filters = [
  "Ultra Realistic",
  "Cinematic",
  "Product Ads",
  "Portrait",
  "Fast",
  "Design",
  "OpenAI",
  "Text",
];

const models = [
  {
    slug: "seedance-fast",
    brand: "Seedance",
    version: "2.0 Fast",
    label: "Fast",
    category: "Ultra realistic",
    title: "Seedance 2.0 Fast",
    description: "Great for speed, realism and punchy automotive visuals.",
    image: asset + "card-car.png",
    accent: "from-[#D7FF00]/30 via-cyan-400/12 to-transparent",
    border: "border-[#D7FF00]/30",
    chip: "text-[#D7FF00]",
    meta: "2 modes",
  },
  {
    slug: "flux-dev",
    brand: "UGC Creatives",
    version: "Flux Dev",
    label: "UGC",
    category: "Creator style",
    title: "Flux Dev",
    description: "Best for creator-led content and authentic beauty scenes.",
    image: asset + "card-ugc.png",
    accent: "from-fuchsia-500/25 via-[#D7FF00]/10 to-transparent",
    border: "border-fuchsia-300/25",
    chip: "text-fuchsia-300",
    meta: "2 modes",
  },
  {
    slug: "flux-pro-1-1",
    brand: "Veo 3.1",
    version: "Flux Pro 1.1",
    label: "Pro",
    category: "Cinematic",
    title: "Flux Pro 1.1",
    description: "Stronger mood, atmosphere and premium cinematic composition.",
    image: asset + "card-mountain.png",
    accent: "from-amber-400/25 via-[#D7FF00]/10 to-transparent",
    border: "border-amber-300/25",
    chip: "text-amber-300",
    meta: "2 modes",
  },
  {
    slug: "flux-ultra",
    brand: "Cinematic Videos",
    version: "Flux Ultra",
    label: "4MP",
    category: "Studio quality",
    title: "Flux Ultra",
    description: "High-end detail with dramatic night lighting and glossy reflections.",
    image: asset + "card-city-car.png",
    accent: "from-cyan-400/25 via-blue-500/10 to-transparent",
    border: "border-cyan-300/25",
    chip: "text-cyan-300",
    meta: "1 mode",
  },
  {
    slug: "gpt-image-2",
    brand: "E Creative Agent",
    version: "GPT Image 2",
    label: "OpenAI",
    category: "AI native",
    title: "GPT Image 2",
    description: "Fast all-round image generation for concepts, layouts and ideation.",
    abstract: true,
    icon: "◎",
    accent: "from-[#D7FF00]/25 via-emerald-500/10 to-cyan-500/10",
    border: "border-[#D7FF00]/30",
    chip: "text-[#D7FF00]",
    meta: "1 mode",
  },
  {
    slug: "recraft-v3",
    brand: "Product Ads",
    version: "Recraft V3",
    label: "Design",
    category: "Made to convert",
    title: "Recraft V3",
    description: "Excellent for polished product visuals and commercial image ads.",
    image: asset + "card-serum.png",
    accent: "from-[#D7FF00]/30 via-yellow-400/10 to-transparent",
    border: "border-[#D7FF00]/30",
    chip: "text-[#D7FF00]",
    meta: "2 modes",
  },
  {
    slug: "ideogram-v3",
    brand: "Kling 3.0",
    version: "Ideogram V3",
    label: "Text",
    category: "Dynamic concept",
    title: "Ideogram V3",
    description: "Strong for graphic visuals and energetic concept imagery.",
    image: asset + "card-motorbike.png",
    accent: "from-yellow-400/25 via-orange-500/10 to-transparent",
    border: "border-yellow-300/25",
    chip: "text-yellow-300",
    meta: "2 modes",
  },
  {
    slug: "stable-diffusion-3-5",
    brand: "Wan 2.6",
    version: "Stable Diffusion 3.5",
    label: "Open source",
    category: "Portrait",
    title: "Stable Diffusion 3.5",
    description: "Flexible generation with a strong balance between control and style.",
    image: asset + "card-portrait.png",
    accent: "from-violet-500/25 via-cyan-500/10 to-transparent",
    border: "border-violet-300/25",
    chip: "text-violet-300",
    meta: "2 modes",
  },
  {
    slug: "auraflow",
    brand: "Seedance 2.0 Pro",
    version: "AuraFlow",
    label: "Pro",
    category: "Sci-fi",
    title: "AuraFlow",
    description: "Ideal for futuristic concepts, sci-fi campaigns and premium posters.",
    image: asset + "card-astronaut.png",
    accent: "from-cyan-400/25 via-[#D7FF00]/10 to-transparent",
    border: "border-cyan-300/25",
    chip: "text-cyan-300",
    meta: "1 mode",
  },
  {
    slug: "nano-banana-2",
    brand: "UGC Creatives",
    version: "Nano Banana 2",
    label: "Fast",
    category: "Social",
    title: "Nano Banana 2",
    description: "Lightweight, social-friendly and great for quick creative experimentation.",
    abstract: true,
    icon: "◉",
    accent: "from-fuchsia-500/25 via-orange-400/10 to-[#D7FF00]/10",
    border: "border-fuchsia-300/25",
    chip: "text-fuchsia-300",
    meta: "1 mode",
  },
  {
    slug: "hidream-i1",
    brand: "Veo 3.1",
    version: "HiDream I1",
    label: "HD",
    category: "Product spotlight",
    title: "HiDream I1",
    description: "Nice for isolated premium objects, hardware and hero product shots.",
    image: asset + "card-headphones.png",
    accent: "from-[#D7FF00]/25 via-cyan-400/10 to-transparent",
    border: "border-[#D7FF00]/30",
    chip: "text-[#D7FF00]",
    meta: "2 modes",
  },
  {
    slug: "sana",
    brand: "Cinematic Videos",
    version: "SANA",
    label: "NVIDIA",
    category: "Experimental",
    title: "SANA",
    description: "A strong option for exploratory high-style renders and visual moods.",
    abstract: true,
    icon: "✦",
    accent: "from-cyan-400/25 via-blue-500/10 to-violet-500/10",
    border: "border-cyan-300/25",
    chip: "text-cyan-300",
    meta: "1 mode",
  },
  {
    slug: "kolors",
    brand: "Product Ads",
    version: "KOLORS",
    label: "Colors",
    category: "Branding",
    title: "KOLORS",
    description: "Built for colorful brand systems, rich palettes and design-led ads.",
    abstract: true,
    icon: "◌",
    accent: "from-orange-400/25 via-fuchsia-500/10 to-[#D7FF00]/10",
    border: "border-orange-300/25",
    chip: "text-orange-300",
    meta: "2 modes",
  },
];

function AbstractCard({ item }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[1.2rem] bg-[#0a0a0a]">
      <div className={"absolute inset-0 bg-gradient-to-br " + item.accent} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(215,255,0,.18),transparent_25%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,.15),transparent_24%),radial-gradient(circle_at_55%_80%,rgba(217,70,239,.15),transparent_22%)]" />
      <div className="relative flex h-full min-h-[280px] flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{item.brand}</p>
          </div>
          <span className={"rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur " + item.chip}>
            {item.label}
          </span>
        </div>

        <div className="flex items-center justify-center py-6">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-black/30 text-5xl text-white shadow-[0_0_60px_rgba(215,255,0,.12)]">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            {item.icon}
          </div>
        </div>

        <div>
          <p className={"text-[11px] font-black uppercase tracking-[0.18em] " + item.chip}>{item.category}</p>
          <h3 className="mt-2 text-2xl font-black leading-[0.95] tracking-[-0.06em] text-white">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-white/50">{item.description}</p>
          <div className="mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">
            <span>{item.meta}</span>
            <span>Open model →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageCard({ item }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[1.2rem] bg-[#0a0a0a]">
      <Image
        src={item.image}
        alt={item.title}
        width={1086}
        height={1448}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className={"absolute inset-0 bg-gradient-to-br " + item.accent} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
      <div className="relative flex h-full min-h-[280px] flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/65">{item.brand}</p>
          </div>
          <span className={"rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur " + item.chip}>
            {item.label}
          </span>
        </div>

        <div>
          <p className={"text-[11px] font-black uppercase tracking-[0.18em] " + item.chip}>{item.category}</p>
          <h3 className="mt-2 text-2xl font-black leading-[0.95] tracking-[-0.06em] text-white">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-white/60">{item.description}</p>
          <div className="mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
            <span>{item.meta}</span>
            <span>Open model →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardModelsPage() {
  return (
    <main className="min-h-screen bg-[#020303] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#060606] p-5 shadow-[0_0_100px_rgba(215,255,0,.06)] md:p-7">
          <div className="absolute -left-12 top-10 h-48 w-48 rounded-full bg-[#D7FF00]/12 blur-3xl" />
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-500/8 blur-3xl" />
          <div className="absolute bottom-0 right-20 h-48 w-48 rounded-full bg-fuchsia-500/8 blur-3xl" />

          <div className="relative">
            <div className="mb-4 inline-flex rounded-full border border-[#D7FF00]/25 bg-[#D7FF00]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#D7FF00]">
              Geração • modelos de imagem
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <h1 className="max-w-3xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-6xl">
                  Escolha o modelo ideal para cada imagem.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 md:text-base">
                  Escolha o melhor modelo para cada tipo de imagem: produto, retrato, campanha, conceito, UGC ou visual cinematográfico.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/[.03] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/60 backdrop-blur">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {stats.map(([title, copy]) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/[.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
                      <p className="text-sm font-black text-white">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/40">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/40 p-2">
                <Image
                  src={asset + "hero-banner-clean.png"}
                  alt="NOVA image models hero banner"
                  width={2172}
                  height={724}
                  priority
                  className="h-[180px] w-full rounded-[1.25rem] object-cover object-center transition duration-700 group-hover:scale-[1.01] sm:h-[240px] lg:h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[#070707] p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Model library</p>
              <h2 className="mt-2 text-3xl font-black uppercase leading-[0.92] tracking-[-0.06em] md:text-5xl">
                13 modelos. Mais impacto visual.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-white/40">
              Cards mais visuais, comparação rápida e seleção direta para começar a gerar.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {models.map((item) => (
              <Link
                key={item.slug}
                href={`/dashboard/models/${item.slug}`}
                className={"group overflow-hidden rounded-[1.35rem] border bg-[#0a0a0a] no-underline shadow-[0_18px_70px_rgba(0,0,0,.35)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_0_70px_rgba(215,255,0,.10)] " + item.border}
              >
                {item.abstract ? <AbstractCard item={item} /> : <ImageCard item={item} />}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
