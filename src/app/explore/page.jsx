"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const asset = "/nova/explore-v1/";
const BASE_VIDEO = "https://pub-c1436a1811c64a27a4f69459e98ad02a.r2.dev/explore/videos-explorar/";

const categories = [
  { id: "all", pt: "Todos", en: "All" },
  { id: "product", pt: "Product Ads", en: "Product Ads" },
  { id: "ugc", pt: "UGC Creatives", en: "UGC Creatives" },
  { id: "cinematic", pt: "Cinemático", en: "Cinematic" },
  { id: "beauty", pt: "Beauty", en: "Beauty" },
  { id: "food", pt: "Food", en: "Food" },
  { id: "tech", pt: "Tech", en: "Tech" },
  { id: "interior", pt: "Interior", en: "Interior" },
];

const cards = [
  {
    id: "luxury-watch",
    video: BASE_VIDEO + "1.mp4",
    category: "product",
    image: asset + "card-watch.png",
    time: "00:07",
    model: "Flux Ultra",
    title: { pt: "Luxury Watch Gold Sparks", en: "Luxury Watch Gold Sparks" },
    label: { pt: "Product Ads", en: "Product Ads" },
    prompt: {
      pt: "Relógio de luxo preto e dourado sobre rocha vulcânica escura com rachaduras verde neon, iluminação dramática premium, reflexos cinematográficos, fotografia macro comercial, fundo preto, atmosfera sofisticada, ultra realista.",
      en: "Luxury black and gold watch on dark volcanic rock with neon green cracks, premium dramatic lighting, cinematic reflections, commercial macro photography, black background, sophisticated atmosphere, ultra realistic.",
    },
  },
  {
    id: "gaming-chair",
    video: BASE_VIDEO + "2.mp4",
    category: "tech",
    image: asset + "card-gaming-chair.png",
    time: "00:08",
    model: "Recraft V3",
    title: { pt: "Gaming Chair Neon Studio", en: "Gaming Chair Neon Studio" },
    label: { pt: "Tech", en: "Tech" },
    prompt: {
      pt: "Cadeira gamer futurista em estúdio escuro com iluminação roxa e azul neon, setup premium ao fundo, reflexos no piso, atmosfera cyberpunk elegante, fotografia de produto para anúncio.",
      en: "Futuristic gaming chair in a dark studio with purple and blue neon lighting, premium setup in the background, reflective floor, elegant cyberpunk atmosphere, product advertising photography.",
    },
  },
  {
    id: "coffee",
    video: BASE_VIDEO + "3.mp4",
    category: "food",
    image: asset + "card-coffee.png",
    time: "00:06",
    model: "HiDream I1",
    title: { pt: "Artisan Coffee Cinematic", en: "Artisan Coffee Cinematic" },
    label: { pt: "Food", en: "Food" },
    prompt: {
      pt: "Pacote de café artesanal preto com textura marmorizada dourada, xícara fumegante em bancada de mármore escura, iluminação quente premium, clima cinematográfico, fotografia comercial realista.",
      en: "Artisan black coffee bag with golden marble texture, steaming cup on dark marble counter, warm premium lighting, cinematic mood, realistic commercial photography.",
    },
  },
  {
    id: "interior",
    video: BASE_VIDEO + "4.mp4",
    category: "interior",
    image: asset + "card-interior.png",
    time: "00:06",
    model: "Stable Diffusion 3.5",
    title: { pt: "Minimal Interior Lounge", en: "Minimal Interior Lounge" },
    label: { pt: "Interior", en: "Interior" },
    prompt: {
      pt: "Poltrona premium em sala minimalista sofisticada, luz natural suave, tons bege e madeira, planta decorativa, arquitetura editorial de alto padrão, fotografia de interiores realista.",
      en: "Premium lounge chair in a sophisticated minimalist room, soft natural light, beige and wood tones, decorative plant, high-end editorial architecture, realistic interior photography.",
    },
  },
  {
    id: "citrus-drink",
    video: BASE_VIDEO + "5.mp4",
    category: "product",
    image: asset + "card-drink.png",
    time: "00:07",
    model: "KOLORS",
    title: { pt: "Citrus Energy Splash", en: "Citrus Energy Splash" },
    label: { pt: "Product Ads", en: "Product Ads" },
    prompt: {
      pt: "Lata de bebida energética preta com detalhes verde neon, limões explodindo em splash de água, fundo preto, gotas congeladas no ar, iluminação intensa, anúncio comercial de alto impacto.",
      en: "Black energy drink can with neon green details, limes exploding in water splash, black background, frozen droplets in the air, intense lighting, high-impact commercial ad.",
    },
  },
  {
    id: "beauty",
    video: BASE_VIDEO + "6.mp4",
    category: "beauty",
    image: asset + "card-beauty.png",
    time: "00:07",
    model: "Flux Dev",
    title: { pt: "Holographic Beauty Look", en: "Holographic Beauty Look" },
    label: { pt: "Beauty", en: "Beauty" },
    prompt: {
      pt: "Retrato beauty editorial com maquiagem holográfica neon azul, rosa e verde, pele brilhante, roupa translúcida futurista, fundo preto limpo, fotografia premium de moda e beleza.",
      en: "Editorial beauty portrait with holographic neon blue, pink and green makeup, glowing skin, futuristic translucent outfit, clean black background, premium fashion and beauty photography.",
    },
  },
  {
    id: "dessert",
    video: BASE_VIDEO + "7.mp4",
    category: "food",
    image: asset + "card-dessert.png",
    time: "00:06",
    model: "Ideogram V3",
    title: { pt: "Gourmet Dessert Macro", en: "Gourmet Dessert Macro" },
    label: { pt: "Food", en: "Food" },
    prompt: {
      pt: "Sobremesa gourmet de chocolate com calda vermelha brilhante, frutas vermelhas frescas e detalhes dourados, prato preto, luz dramática, fotografia macro culinária premium.",
      en: "Gourmet chocolate dessert with glossy red glaze, fresh berries and golden details, black plate, dramatic lighting, premium culinary macro photography.",
    },
  },
  {
    id: "cosmic-gallery",
    video: BASE_VIDEO + "8.mp4",
    category: "cinematic",
    image: asset + "explore-gallery.png",
    time: "00:10",
    model: "Seedance 2.0 Pro",
    title: { pt: "Cosmic Gallery Portal", en: "Cosmic Gallery Portal" },
    label: { pt: "Cinematic", en: "Cinematic" },
    prompt: {
      pt: "Galeria futurista escura com portal circular verde neon, telas flutuantes mostrando mundos imaginários, pessoa em silhueta no centro, chão reflexivo, atmosfera cinematográfica mágica.",
      en: "Dark futuristic gallery with neon green circular portal, floating screens showing imaginary worlds, silhouetted person in the center, reflective floor, magical cinematic atmosphere.",
    },
  },
];

const featuredStyles = [
  { name: "Cyberpunk", icon: "◎", count: "2.4K+" },
  { name: "Hyper Real", icon: "⬡", count: "3.1K+" },
  { name: "Neon Future", icon: "ϟ", count: "2.0K+" },
  { name: "Minimal", icon: "○", count: "1.8K+" },
  { name: "Luxury", icon: "◇", count: "2.6K+" },
  { name: "Vibrant", icon: "✽", count: "2.2K+" },
];

function ExploreCard({ item, lang, onCopy, copied }) {
  const prompt = item.prompt[lang];
  const generateHref = `/dashboard/generate?prompt=${encodeURIComponent(prompt)}`;

  return (
    <article className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#090909] shadow-[0_24px_80px_rgba(0,0,0,.35)] transition duration-500 hover:-translate-y-1 hover:border-[#D7FF00]/45 hover:shadow-[0_0_80px_rgba(215,255,0,.12)]">
      <div className="relative aspect-[4/5] overflow-hidden">
        {item.video ? (
          <video
            src={item.video}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={item.image}
            alt={item.title[lang]}
            width={1080}
            height={1350}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/5" />
        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur">
          ▶ {item.time}
        </div>
        <div className="absolute inset-0 grid place-items-center opacity-100 transition duration-300 group-hover:opacity-0">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-black/35 text-xl text-white backdrop-blur">
            ▶
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D7FF00]">
          {item.label[lang]}
        </p>
        <h3 className="mt-2 text-xl font-black leading-[0.98] tracking-[-0.05em] text-white md:text-2xl">
          {item.title[lang]}
        </h3>
        <p className="mt-2 text-xs leading-5 text-white/45">
          {lang === "pt" ? "Modelo" : "Model"}: {item.model}
        </p>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <Link
            href={generateHref}
            className="inline-flex items-center justify-center rounded-xl border border-[#D7FF00]/30 bg-[#D7FF00] px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-black no-underline transition hover:bg-[#e7ff3a]"
          >
            {lang === "pt" ? "Usar prompt" : "Use prompt"}
          </Link>
          <button
            type="button"
            onClick={() => onCopy(item.id, prompt)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-white transition hover:border-[#D7FF00]/40 hover:text-[#D7FF00]"
            aria-label={lang === "pt" ? "Copiar prompt" : "Copy prompt"}
          >
            {copied === item.id ? "✓" : "⧉"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ExplorePage() {
  const [lang, setLang] = useState("pt");
  const [active, setActive] = useState("all");
  const [copied, setCopied] = useState("");

  const visibleCards = useMemo(() => {
    if (active === "all") return cards;
    return cards.filter((card) => card.category === active);
  }, [active]);

  async function copyPrompt(id, prompt) {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(id);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      setCopied("");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020303] text-white">
      <section className="relative border-b border-white/10 bg-[#050505]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(215,255,0,.13),transparent_26%),radial-gradient(circle_at_82%_20%,rgba(217,70,239,.12),transparent_24%)]" />

        <div className="relative mx-auto grid max-w-[1600px] gap-6 px-4 py-8 md:px-6 md:py-10 xl:grid-cols-[0.75fr_1.25fr] xl:items-center">
          <div className="order-2 xl:order-1">
            <div className="mb-5 inline-flex rounded-full border border-[#D7FF00]/25 bg-[#D7FF00]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#D7FF00]">
              Explore
            </div>

            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.86] tracking-[-0.09em] md:text-7xl">
              {lang === "pt" ? (
                <>
                  Olha o que a <span className="text-[#D7FF00]">NOVA</span> é capaz de fazer.
                </>
              ) : (
                <>
                  See what <span className="text-[#D7FF00]">NOVA</span> can create.
                </>
              )}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/58 md:text-lg md:leading-8">
              {lang === "pt"
                ? "Explore criações incríveis feitas com a NOVA. Encontre um estilo, pegue o prompt e crie conteúdos que impressionam."
                : "Explore incredible creations made with NOVA. Find a style, get the prompt, and create content that stands out."}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/generate"
                className="inline-flex items-center justify-center rounded-2xl bg-[#D7FF00] px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-black no-underline shadow-[0_0_45px_rgba(215,255,0,.2)] transition hover:scale-[1.02] hover:bg-[#e7ff3a]"
              >
                {lang === "pt" ? "Começar a criar" : "Start creating"} →
              </Link>
              <a
                href="#gallery"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[.03] px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-white no-underline transition hover:border-[#D7FF00]/40 hover:text-[#D7FF00]"
              >
                {lang === "pt" ? "Ver inspirações" : "View inspiration"} ↓
              </a>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-3">
              {[
                ["10K+", lang === "pt" ? "criações" : "creations"],
                ["50+", lang === "pt" ? "estilos" : "styles"],
                ["13", lang === "pt" ? "modelos" : "models"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-2xl font-black tracking-[-0.06em] text-[#D7FF00]">{value}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 xl:order-2">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.03] p-2 shadow-[0_0_100px_rgba(215,255,0,.08)]">
              <Image
                src={asset + "explore-hero.png"}
                alt="NOVA explore creative showcase"
                width={1792}
                height={1024}
                priority
                className="h-[260px] w-full rounded-[1.5rem] object-cover object-center sm:h-[360px] xl:h-[520px]"
              />
              <div className="absolute right-4 top-4 flex rounded-full border border-white/10 bg-black/50 p-1 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setLang("pt")}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] ${lang === "pt" ? "bg-[#D7FF00] text-black" : "text-white/50"}`}
                >
                  PT
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] ${lang === "en" ? "bg-[#D7FF00] text-black" : "text-white/50"}`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActive(category.id)}
                  className={
                    active === category.id
                      ? "rounded-full bg-[#D7FF00] px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-black"
                      : "rounded-full border border-white/12 bg-white/[.03] px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/55 transition hover:border-[#D7FF00]/35 hover:text-[#D7FF00]"
                  }
                >
                  {category[lang]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visibleCards.map((item) => (
              <ExploreCard
                key={item.id}
                item={item}
                lang={lang}
                onCopy={copyPrompt}
                copied={copied}
              />
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-[1.8rem] border border-white/10 bg-white/[.025] p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                    {lang === "pt" ? "Estilos em destaque" : "Featured styles"}
                  </p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.05em] text-white">
                    {lang === "pt" ? "Encontre o visual certo." : "Find the right look."}
                  </h2>
                </div>
                <Link href="/dashboard/templates" className="text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00] no-underline">
                  {lang === "pt" ? "Ver todos" : "View all"} →
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {featuredStyles.map((style) => (
                  <div key={style.name} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#D7FF00]/25 bg-[#D7FF00]/10 text-2xl text-[#D7FF00]">
                      {style.icon}
                    </div>
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-white">{style.name}</p>
                    <p className="mt-1 text-xs text-[#D7FF00]/70">{style.count}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.8rem] border border-white/10 bg-white/[.025] p-5 md:p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                {lang === "pt" ? "Como funciona" : "How it works"}
              </p>

              <div className="mt-5 grid gap-3">
                {[
                  [lang === "pt" ? "Explore" : "Explore", lang === "pt" ? "Navegue por estilos e criativos prontos." : "Browse ready styles and creative ideas."],
                  [lang === "pt" ? "Pegue o prompt" : "Get the prompt", lang === "pt" ? "Clique em Usar prompt ou copie." : "Click Use prompt or copy it."],
                  [lang === "pt" ? "Customize" : "Customize", lang === "pt" ? "Adapte para seu produto e sua marca." : "Adapt it to your product and brand."],
                  [lang === "pt" ? "Gere" : "Generate", lang === "pt" ? "Crie seu conteúdo final em minutos." : "Create your final content in minutes."],
                ].map(([title, copy], index) => (
                  <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#D7FF00] text-sm font-black text-black">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-white">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/45">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-6 overflow-hidden rounded-[1.8rem] border border-[#D7FF00]/20 bg-[#D7FF00] text-black shadow-[0_0_80px_rgba(215,255,0,.18)]">
            <div className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
              <div>
                <h2 className="text-3xl font-black uppercase leading-[0.92] tracking-[-0.06em] md:text-5xl">
                  {lang === "pt" ? "Pronto para criar algo incrível?" : "Ready to create something incredible?"}
                </h2>
                <p className="mt-3 text-sm font-semibold text-black/65 md:text-base">
                  {lang === "pt"
                    ? "Transforme inspiração em criação em segundos."
                    : "Turn inspiration into creation in seconds."}
                </p>
              </div>
              <Link
                href="/dashboard/generate"
                className="inline-flex justify-center rounded-2xl bg-black px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-[#D7FF00] no-underline transition hover:scale-[1.02]"
              >
                {lang === "pt" ? "Começar agora" : "Start now"} →
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
