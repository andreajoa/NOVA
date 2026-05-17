import Image from "next/image";
import Link from "next/link";


import HomeVideoHero from "@/components/HomeVideoHero";

const R2_VIDEO_BASE = "https://pub-c1436a1811c64a27a4f69459e98ad02a.r2.dev/explore/videos";

const createdWithNovaVideos = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  src: `${R2_VIDEO_BASE}/${index + 1}.mp4`,
}));

const asset = "/nova/landing-v2/";

const creativeCards = [
  {
    category: "Perfume",
    title: "Luxury that lasts.",
    image: asset + "ad-perfume.png",
    accent: "from-amber-400/30 via-[#D7FF00]/10 to-transparent",
    border: "border-amber-300/30",
  },
  {
    category: "Skincare",
    title: "Glow deeper every day.",
    image: asset + "ad-serum.png",
    accent: "from-fuchsia-500/30 via-violet-500/10 to-transparent",
    border: "border-fuchsia-300/30",
  },
  {
    category: "Sneakers",
    title: "Built to move fast.",
    image: asset + "ad-sneaker.png",
    accent: "from-[#D7FF00]/30 via-cyan-400/10 to-transparent",
    border: "border-[#D7FF00]/35",
  },
  {
    category: "Watches",
    title: "Precision every second.",
    image: asset + "ad-watch.png",
    accent: "from-cyan-400/30 via-blue-500/10 to-transparent",
    border: "border-cyan-300/30",
  },
  {
    category: "Coffee",
    title: "Better coffee. Better day.",
    image: asset + "ad-coffee.png",
    accent: "from-orange-500/30 via-amber-500/10 to-transparent",
    border: "border-orange-300/30",
  },
  {
    category: "UGC Creator",
    title: "Real people. Real results.",
    image: asset + "ad-ugc.png",
    accent: "from-purple-500/30 via-[#D7FF00]/10 to-transparent",
    border: "border-purple-300/30",
  },
];

const modelCards = [
  { name: "Seedance", version: "2.0 Fast", copy: "Speed meets simplicity.", accent: "from-violet-500/35 to-blue-500/10" },
  { name: "Seedance", version: "2.0 Pro", copy: "Balanced power for pros.", accent: "from-[#D7FF00]/35 to-emerald-500/10" },
  { name: "Kling", version: "3.0", copy: "Realistic depth and detail.", accent: "from-cyan-400/35 to-blue-500/10" },
  { name: "Veo", version: "3.1", copy: "Next-gen visuals and motion.", accent: "from-white/18 to-zinc-500/10" },
  { name: "Wan", version: "2.6", copy: "Optimized for social formats.", accent: "from-lime-300/30 to-yellow-500/10" },
];

const benefits = [
  { title: "10x faster", copy: "Create in minutes, not days.", icon: "⚡", color: "text-[#D7FF00]" },
  { title: "All AI models", copy: "Access the best engines in one place.", icon: "✦", color: "text-violet-300" },
  { title: "Export-ready", copy: "Videos, images and ads ready to publish.", icon: "⬇", color: "text-amber-300" },
  { title: "Product ads", copy: "Built to convert. Designed to sell.", icon: "▣", color: "text-[#D7FF00]" },
  { title: "UGC & social", copy: "Real, relatable, ready to post.", icon: "◎", color: "text-cyan-300" },
  { title: "All formats", copy: "9:16, 1:1, 16:9 and more.", icon: "⌁", color: "text-fuchsia-300" },
];

const useCases = [
  { title: "Product Ads", copy: "High-impact ads that convert.", image: asset + "ad-perfume.png" },
  { title: "UGC Creatives", copy: "Creator-style assets that feel real.", image: asset + "ad-ugc.png" },
  { title: "Landing Page Videos", copy: "Boost trust and drive action.", image: asset + "workflow-banner.png" },
  { title: "Reels, TikTok & Shorts", copy: "Short-form creatives that stop the scroll.", image: asset + "ad-sneaker.png" },
];

const pricing = [
  {
    name: "Basic",
    annualPrice: "$5",
    monthlyPrice: "$7",
    credits: "70 credits/mo",
    description: "Perfect to get started.",
    highlight: false,
    features: ["70 credits/mo", "Video generation", "All AI models", "MP4 download"],
  },
  {
    name: "Plus",
    annualPrice: "$34",
    monthlyPrice: "$49",
    credits: "500 credits/mo",
    description: "Everything you need to grow.",
    highlight: true,
    features: ["500 credits/mo", "Video generation", "All AI models", "MP4 download"],
  },
  {
    name: "Ultra",
    annualPrice: "$89",
    monthlyPrice: "$129",
    credits: "3,000 credits/mo",
    description: "More power for serious creators.",
    highlight: false,
    features: ["3,000 credits/mo", "Video generation", "All AI models", "MP4 download"],
  },
  {
    name: "Business",
    annualPrice: "$62",
    monthlyPrice: "$89",
    credits: "3,000 total/mo + 1,500 per seat/mo",
    description: "Scale content with your team.",
    highlight: false,
    features: ["3,000 total/mo", "1,500 credits per seat/mo", "Team workflow", "Priority support"],
  },
];

function GlowOrb({ className }: { className: string }) {
  return <div className={"pointer-events-none absolute rounded-full blur-3xl " + className} />;
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030304] text-white">
      <HomeVideoHero />

      <div className="relative isolate overflow-hidden border-b border-white/10 bg-[#050505]">
        <GlowOrb className="-left-24 top-20 h-80 w-80 bg-[#D7FF00]/15" />
        <GlowOrb className="right-0 top-24 h-96 w-96 bg-fuchsia-500/12" />
        <GlowOrb className="right-40 bottom-0 h-72 w-72 bg-cyan-500/12" />

        <div className="border-b border-white/10 bg-gradient-to-r from-purple-500/15 via-transparent to-[#D7FF00]/10 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/65">
          Create product videos that sell — in minutes.
        </div>

        <section className="relative mx-auto grid max-w-[1540px] gap-8 px-4 py-10 md:px-8 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative z-10">
            <div className="mb-5 inline-flex rounded-full border border-[#D7FF00]/25 bg-[#D7FF00]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#D7FF00] shadow-[0_0_40px_rgba(215,255,0,.12)]">
              AI studio for product marketing
            </div>

            <h1 className="max-w-4xl text-[3.25rem] font-black uppercase leading-[0.82] tracking-[-0.09em] text-white sm:text-7xl md:text-8xl xl:text-[8.4rem]">
              Create <span className="text-[#D7FF00]">product</span> videos that sell
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/60 md:text-lg md:leading-8">
              Upload one product. Pick a style. Generate high-converting product videos, ads and social creatives in minutes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="group inline-flex items-center justify-center rounded-2xl bg-[#D7FF00] px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-black no-underline shadow-[0_0_50px_rgba(215,255,0,.28)] transition hover:scale-[1.02] hover:bg-[#e3ff2f]"
              >
                Start for free <span className="ml-2 transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/product-ad-generator"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[.03] px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-white no-underline backdrop-blur transition hover:border-[#D7FF00]/40 hover:bg-white/[.06]"
              >
                See product ads
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ["10 free credits", "No card required"],
                ["Video + image", "Creative outputs"],
                ["Export-ready", "Assets for every channel"],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur">
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/40">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.035] p-2 shadow-[0_0_120px_rgba(87,64,255,.18)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D7FF00]/10 via-cyan-500/5 to-fuchsia-500/10 opacity-80" />
              <Image
                src={asset + "hero-desktop.png"}
                alt="NOVA AI product video generation interface"
                width={2172}
                height={724}
                priority
                className="relative hidden w-full rounded-[1.5rem] object-cover transition duration-700 group-hover:scale-[1.015] md:block"
              />
              <Image
                src={asset + "hero-mobile.png"}
                alt="NOVA mobile AI product video generation"
                width={1122}
                height={1402}
                priority
                className="relative w-full rounded-[1.5rem] object-cover transition duration-700 group-hover:scale-[1.015] md:hidden"
              />
            </div>
          </div>
        </section>
      </div>

      <section className="px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-[1540px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#090909] p-2 shadow-[0_0_80px_rgba(215,255,0,.08)]">
          <Image
            src={asset + "creatives-banner.png"}
            alt="NOVA product creative styles"
            width={2172}
            height={724}
            className="w-full rounded-[1.5rem] object-cover"
          />
        </div>
      </section>

      <section className="px-4 py-8 md:px-8 md:py-14">
        <div className="mx-auto grid max-w-[1540px] gap-6 rounded-[2rem] border border-white/10 bg-white/[.025] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] md:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Workflow</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.08em] md:text-6xl">
              From product image to finished creative.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/45 md:text-base">
              A simple path from product input to ready-to-publish ads, videos and social formats.
            </p>
          </div>

          <div className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40 p-2">
            <Image
              src={asset + "workflow-banner.png"}
              alt="NOVA workflow from product to creative outputs"
              width={1672}
              height={941}
              className="w-full rounded-[1.15rem] object-cover transition duration-700 group-hover:scale-[1.02]"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-8 md:py-18">
        <div className="mx-auto max-w-[1540px]">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Created with NOVA</p>
              <h2 className="mt-3 max-w-4xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl">
                Product creatives that actually sell.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/45">
                Different products. Different styles. One platform built to generate scroll-stopping assets.
              </p>
            </div>
            <Link
              href="/dashboard/templates"
              className="inline-flex rounded-2xl border border-[#D7FF00]/25 bg-[#D7FF00]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00] no-underline transition hover:bg-[#D7FF00] hover:text-black"
            >
              Explore templates →
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {createdWithNovaVideos.slice(0, 6).map((video, index) => (
              <article
                key={video.id}
                className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101010] md:rounded-[2rem]"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <video
                    src={video.src}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload={index < 3 ? "auto" : "metadata"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/8 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#D7FF00]">
                      Created with NOVA
                    </p>
                    <p className="mt-2 text-xl font-black uppercase leading-none tracking-[-.05em] text-white md:text-2xl">
                      Product video #{video.id}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="models" className="px-4 py-10 md:px-8 md:py-18">
        <div className="mx-auto max-w-[1540px] rounded-[2rem] border border-white/10 bg-[#080808] p-5 md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">AI Models</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-6xl">
                Choose the right engine for each idea.
              </h2>
            </div>
            <Link href="/dashboard/models" className="inline-flex rounded-2xl border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white no-underline transition hover:border-[#D7FF00]/45 hover:text-[#D7FF00]">
              Compare models →
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {modelCards.map((model) => (
              <Link key={model.name + model.version} href="/dashboard/models" className="no-underline">
                <article className="group relative min-h-[190px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[.025] p-5 transition duration-500 hover:-translate-y-1 hover:border-[#D7FF00]/45">
                  <div className={"absolute inset-0 bg-gradient-to-br opacity-80 " + model.accent} />
                  <div className="absolute right-4 top-4 text-[#D7FF00] transition group-hover:translate-x-1">→</div>
                  <div className="relative">
                    <p className="text-4xl font-black tracking-[-0.08em] text-[#D7FF00]">{model.version}</p>
                    <h3 className="mt-5 text-xl font-black uppercase tracking-[-0.04em] text-white">{model.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/50">{model.copy}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-8 md:py-18">
        <div className="mx-auto grid max-w-[1540px] gap-6 rounded-[2rem] border border-white/10 bg-white/[.025] p-5 md:p-8 lg:grid-cols-[0.65fr_1.35fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Why NOVA</p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-6xl">
              More output. Less creative friction.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/45">
              Everything your team needs to create, test and scale product creatives.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {benefits.map((item) => (
              <div key={item.title} className="group rounded-[1.4rem] border border-white/10 bg-black/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] transition duration-500 hover:-translate-y-1 hover:border-[#D7FF00]/35 hover:bg-white/[.04]">
                <div className={"text-3xl " + item.color}>{item.icon}</div>
                <h3 className="mt-5 text-sm font-black uppercase tracking-[0.12em] text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/45">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-8 md:py-18">
        <div className="mx-auto max-w-[1540px]">
          <div className="grid gap-6 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Use cases</p>
              <h2 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-6xl">
                One AI studio for every channel.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {useCases.map((item) => (
                <article key={item.title} className="group relative min-h-[220px] overflow-hidden rounded-[1.4rem] border border-white/10 bg-black transition duration-500 hover:-translate-y-1 hover:border-[#D7FF00]/35">
                  <Image src={item.image} alt={item.title} width={1086} height={1448} className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-700 group-hover:scale-110 group-hover:opacity-65" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
                  <div className="relative flex min-h-[220px] flex-col justify-end p-5">
                    <h3 className="text-lg font-black uppercase tracking-[-0.03em]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/55">{item.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-12 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1540px]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">Pricing</p>
              <h2 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl">
                Choose your plan.
              </h2>
              <p className="mt-3 text-sm text-white/45">Annual billing. Upgrade anytime.</p>
            </div>
            <Link href="/pricing" className="text-sm font-bold text-[#D7FF00] no-underline hover:underline">
              See full pricing details →
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {pricing.map((plan) => (
              <article
                key={plan.name}
                className={
                  "relative overflow-hidden rounded-[1.7rem] border p-5 transition duration-500 hover:-translate-y-1 md:p-6 " +
                  (plan.highlight
                    ? "border-[#D7FF00] bg-[#D7FF00] text-black shadow-[0_0_90px_rgba(215,255,0,.25)]"
                    : "border-white/10 bg-[#0D0D0D] text-white hover:border-[#D7FF00]/35")
                }
              >
                {plan.highlight && (
                  <div className="mb-4 inline-flex rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D7FF00]">
                    Most popular
                  </div>
                )}
                <p className={"text-xs font-black uppercase tracking-[0.16em] " + (plan.highlight ? "text-black/55" : "text-white/35")}>{plan.name}</p>
                <div className="mt-5 flex items-end gap-1">
                  <p className="text-5xl font-black tracking-[-0.08em]">{plan.annualPrice}</p>
                  <span className="mb-1 text-sm font-semibold opacity-50">/mo</span>
                </div>
                <p className={"mt-1 text-xs " + (plan.highlight ? "text-black/55" : "text-white/35")}>
                  {plan.monthlyPrice}/mo billed monthly
                </p>
                <p className={"mt-4 text-sm font-black " + (plan.highlight ? "text-black/75" : "text-[#D7FF00]")}>{plan.credits}</p>
                <p className={"mt-2 text-sm leading-6 " + (plan.highlight ? "text-black/60" : "text-white/45")}>{plan.description}</p>
                <div className="mt-6 space-y-2 text-sm font-semibold">
                  {plan.features.map((feature) => (
                    <p key={feature} className={plan.highlight ? "text-black/75" : "text-white/65"}>✓ {feature}</p>
                  ))}
                </div>
                <Link
                  href={"/checkout/plan?plan=" + plan.name.toLowerCase() + "&billing=annual"}
                  className={
                    "mt-7 inline-flex w-full justify-center rounded-xl px-5 py-3 text-xs font-black uppercase tracking-[0.12em] no-underline transition " +
                    (plan.highlight ? "bg-black text-white hover:bg-[#111]" : "bg-white text-black hover:bg-[#D7FF00]")
                  }
                >
                  Get {plan.name}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-8 md:py-16">
        <div className="mx-auto overflow-hidden rounded-[2rem] bg-[#D7FF00] text-black shadow-[0_0_100px_rgba(215,255,0,.25)]">
          <div className="relative px-6 py-14 text-center md:px-10 md:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(0,0,0,.22),transparent_24%),radial-gradient(circle_at_88%_30%,rgba(37,99,235,.22),transparent_24%)]" />
            <div className="relative">
              <h2 className="mx-auto max-w-5xl text-4xl font-black uppercase leading-[0.88] tracking-[-0.09em] md:text-8xl">
                Generate your first product video today.
              </h2>
              <p className="mt-5 text-base font-semibold text-black/65 md:text-lg">Start with 10 free credits.</p>
              <Link href="/sign-up" className="mt-8 inline-flex rounded-xl bg-black px-8 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#D7FF00] no-underline transition hover:scale-[1.02]">
                Start for free →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-[1540px]">
          <div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <img src="/nova/logo-nova.jpeg" alt="NOVA logo" style={{ height: "44px", width: "auto", objectFit: "contain", display: "block", marginBottom: "16px" }} />
              <p className="max-w-sm text-sm leading-7 text-white/40">The AI studio for product videos, ads and social creatives that sell.</p>
              <p className="mt-4 text-sm text-white/35">info@novvideos.online</p>
            </div>
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white/40">Product</p>
              <Link href="/dashboard" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Studio</Link>
              <Link href="/dashboard/models" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Models</Link>
              <Link href="/pricing" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Pricing</Link>
              <Link href="/product-ad-generator" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Ad Generator</Link>
            </div>
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white/40">Use cases</p>
              <Link href="/product-ad-generator" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Product Ads</Link>
              <Link href="/dashboard/templates" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">UGC Creatives</Link>
              <Link href="/explore" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Social Videos</Link>
            </div>
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white/40">Company</p>
              <Link href="/terms" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Terms</Link>
              <Link href="/privacy" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Privacy</Link>
              <Link href="/contact" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Contact</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8">
            <p className="text-xs text-white/20">© 2026 NOVA AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
