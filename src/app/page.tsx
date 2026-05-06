import Image from "next/image";
import Link from "next/link";

const workflow = [
  {
    number: "01",
    title: "Upload your product",
    text: "Start with a product photo, asset or simple prompt.",
  },
  {
    number: "02",
    title: "Choose the video style",
    text: "Pick a model, scene direction and creative angle.",
  },
  {
    number: "03",
    title: "Generate ready creatives",
    text: "Create product videos, UGC angles and social assets.",
  },
];

const creativeExamples = [
  {
    title: "Product Ads",
    subtitle: "Ready-to-sell product creatives",
    image: "/nova/landing/ad-headphones.png",
  },
  {
    title: "Beauty & Lifestyle",
    subtitle: "Premium vertical ads for commerce",
    image: "/nova/landing/ad-serum.png",
  },
  {
    title: "UGC Creatives",
    subtitle: "Creator-style assets for social",
    image: "/nova/landing/ad-ugc-headphones.png",
  },
  {
    title: "Luxury Products",
    subtitle: "High-end product storytelling",
    image: "/nova/landing/ad-perfume.png",
  },
  {
    title: "Fitness & Wearables",
    subtitle: "Dynamic creative variations",
    image: "/nova/landing/ad-watch.png",
  },
  {
    title: "Fashion & Footwear",
    subtitle: "Fast-moving launch assets",
    image: "/nova/landing/ad-sneaker.png",
  },
];

const modelCards = [
  {
    name: "Seedance",
    version: "2.0 Fast",
    tag: "Fast motion",
    image: "/nova/landing/model-seedance-fast-new.png",
  },
  {
    name: "Seedance",
    version: "2.0 Pro",
    tag: "Premium detail",
    image: "/nova/landing/model-seedance-pro-new.png",
  },
  {
    name: "Kling",
    version: "3.0",
    tag: "Cinematic scenes",
    image: "/nova/landing/model-kling-new.png",
  },
  {
    name: "Veo",
    version: "3.1",
    tag: "Studio quality",
    image: "/nova/landing/model-veo-new.png",
  },
  {
    name: "Wan",
    version: "2.6",
    tag: "Creative control",
    image: "/nova/landing/model-wan-new.png",
  },
];

const useCases = [
  "Product Ads",
  "UGC Creatives",
  "Landing Page Videos",
  "Reels, TikTok & Shorts",
];

const pricing = [
  {
    name: "Basic",
    annualPrice: "$5",
    monthlyPrice: "$7",
    billing: "per month, billed annually",
    credits: "70 credits/mo",
    details: ["Video generation", "All AI models", "MP4 download"],
    highlight: false,
  },
  {
    name: "Plus",
    annualPrice: "$34",
    monthlyPrice: "$49",
    billing: "per month, billed annually",
    credits: "500 credits/mo",
    details: ["Video generation", "All AI models", "MP4 download"],
    highlight: true,
  },
  {
    name: "Ultra",
    annualPrice: "$89",
    monthlyPrice: "$129",
    billing: "per month, billed annually",
    credits: "3,000 credits/mo",
    details: ["Video generation", "All AI models", "MP4 download"],
    highlight: false,
  },
  {
    name: "Business",
    annualPrice: "$62",
    monthlyPrice: "$89",
    billing: "per seat/mo, billed annually",
    credits: "3,000 credits total/mo",
    details: ["1,500 credits per seat/mo", "Video generation", "All AI models"],
    highlight: false,
  },
];

function GlowGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_15%,rgba(215,255,0,.18),transparent_24%),radial-gradient(circle_at_82%_8%,rgba(215,255,0,.10),transparent_22%),linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:100%_100%,100%_100%,76px_76px,76px_76px]" />
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#050505] text-white">
      <section className="relative px-4 pb-10 pt-8 md:px-8 md:pb-16 md:pt-12">
        <GlowGrid />

        <div className="mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D7FF00]/25 bg-[#D7FF00]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[.18em] text-[#D7FF00] shadow-[0_0_30px_rgba(215,255,0,.10)]">
              AI video studio for e-commerce
            </div>

            <h1 className="mt-6 max-w-4xl text-[clamp(3.4rem,13vw,7.8rem)] font-black uppercase leading-[.82] tracking-[-.1em] text-white lg:text-[clamp(5rem,7vw,8.6rem)]">
              Create <span className="text-[#D7FF00]">product</span> videos with AI
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/62 md:text-xl md:leading-8">
              Turn product photos, prompts and ideas into ads, UGC creatives and social videos ready to publish.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex justify-center rounded-2xl bg-[#D7FF00] px-7 py-4 text-xs font-black uppercase tracking-[.14em] text-black no-underline shadow-[0_0_40px_rgba(215,255,0,.20)] transition hover:bg-[#c7ef00]"
              >
                Start free
              </Link>
              <Link
                href="/dashboard/generate"
                className="inline-flex justify-center rounded-2xl border border-white/15 bg-white/[.03] px-7 py-4 text-xs font-black uppercase tracking-[.14em] text-white no-underline transition hover:border-[#D7FF00]/50 hover:text-[#D7FF00]"
              >
                View studio
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm font-bold text-white/55 sm:grid-cols-4">
              {["10 free credits", "Videos in minutes", "Built for product ads", "Export MP4"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[.025] px-4 py-3">
                  <span className="text-[#D7FF00]">✓</span> {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-[#D7FF00]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[1.8rem] border border-[#D7FF00]/25 bg-[#090909] p-2 shadow-[0_0_100px_rgba(215,255,0,.16)] md:rounded-[2.4rem] md:p-3">
              <Image
                src="/nova/landing/hero-dashboard.png"
                alt="NOVA AI video studio dashboard generating product videos"
                width={1448}
                height={1086}
                priority
                sizes="(max-width: 1024px) 100vw, 54vw"
                className="h-auto w-full rounded-[1.35rem] object-cover md:rounded-[2rem]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 md:px-8 md:pb-20">
        <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#090909] shadow-[0_0_80px_rgba(215,255,0,.08)] md:rounded-[2.4rem]">
          <Image
            src="/nova/landing/hero-desktop-banner.png"
            alt="NOVA creates product videos with AI"
            width={2172}
            height={724}
            priority
            sizes="100vw"
            className="h-[260px] w-full object-cover object-center md:h-auto"
          />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0A0A0A] px-4 py-14 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.24em] text-[#D7FF00]">Workflow</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-[.9] tracking-[-.08em] md:text-7xl">
                From product image to finished creative.
              </h2>
            </div>
            <p className="max-w-3xl text-base leading-7 text-white/52 md:text-lg md:leading-8">
              NOVA keeps the page clear: upload a product, choose the creative direction, generate product videos and export assets for ads, UGC and social channels.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:mt-14 lg:grid-cols-3">
            {workflow.map((step) => (
              <article key={step.number} className="rounded-[1.5rem] border border-white/10 bg-white/[.035] p-6 md:rounded-[2rem] md:p-8">
                <div className="text-5xl font-black tracking-[-.08em] text-[#D7FF00]">{step.number}</div>
                <h3 className="mt-8 text-2xl font-black uppercase tracking-[-.06em] md:text-3xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/45">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[.24em] text-[#D7FF00]">Creative agent</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-[.9] tracking-[-.08em] md:text-7xl">
                Product creatives that actually explain the product.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/52 md:text-lg md:leading-8">
                Clear visuals first. Text only where it helps. The landing page does not rely on tiny words inside images, so it stays readable on mobile.
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-[#0B0B0B] p-2 md:rounded-[2.2rem] md:p-3">
              <Image
                src="/nova/landing/product-creatives-banner.png"
                alt="NOVA product creatives generated from a product image"
                width={2172}
                height={724}
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="h-[240px] w-full rounded-[1.2rem] object-cover object-center md:h-auto md:rounded-[1.8rem]"
              />
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creativeExamples.map((item) => (
              <article key={item.title} className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101010] md:rounded-[2rem]">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={1086}
                    height={1448}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/8 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#D7FF00]">{item.title}</p>
                    <p className="mt-2 text-xl font-black uppercase leading-none tracking-[-.05em] text-white md:text-2xl">{item.subtitle}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="models" className="border-y border-white/10 bg-[#0A0A0A] px-4 py-14 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.24em] text-[#D7FF00]">Models</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-[.9] tracking-[-.08em] md:text-7xl">
                Choose the right engine for each idea.
              </h2>
            </div>
            <Link href="/dashboard/models" className="text-sm font-black uppercase tracking-[.14em] text-[#D7FF00] no-underline hover:underline">
              Explore models →
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 md:mt-14 lg:grid-cols-5">
            {modelCards.map((model) => (
              <Link key={model.name + model.version} href="/dashboard/models" className="group no-underline">
                <article className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#111] transition hover:border-[#D7FF00]/60 hover:shadow-[0_0_60px_rgba(215,255,0,.12)] md:rounded-[1.8rem]">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={model.image}
                      alt={`${model.name} ${model.version}`}
                      width={1086}
                      height={1448}
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#D7FF00]">{model.name}</p>
                      <p className="mt-1 text-2xl font-black uppercase leading-none tracking-[-.07em] text-white">{model.version}</p>
                      <p className="mt-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-bold text-white/65 backdrop-blur">{model.tag}</p>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="rounded-[1.8rem] border border-[#D7FF00]/25 bg-[#0B0B0B] p-6 shadow-[0_0_100px_rgba(215,255,0,.10)] md:rounded-[2.5rem] md:p-10">
            <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[.24em] text-[#D7FF00]">Value stack</p>
                <h2 className="mt-4 text-4xl font-black uppercase leading-[.9] tracking-[-.08em] md:text-7xl">
                  More output. Less creative friction.
                </h2>
                <p className="mt-5 text-base leading-7 text-white/52 md:text-lg md:leading-8">
                  The first conversion goal is simple: get the visitor to generate one video and understand the result quickly.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "10 free credits to start",
                  "Product ads, UGC and social creatives",
                  "All AI models in one studio",
                  "MP4 exports ready to publish",
                  "Clean workflow for teams",
                  "Upgrade only when ready",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm font-bold text-white/70">
                    <span className="text-[#D7FF00]">✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0A0A0A] px-4 py-14 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[.24em] text-[#D7FF00]">Use cases</p>
            <h2 className="mx-auto mt-4 max-w-5xl text-4xl font-black uppercase leading-[.9] tracking-[-.08em] md:text-7xl">
              One AI studio for every product channel.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {useCases.map((item) => (
              <div key={item} className="rounded-[1.5rem] border border-white/10 bg-white/[.035] p-6 md:rounded-[2rem]">
                <div className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#D7FF00] text-2xl font-black text-black">✦</div>
                <h3 className="text-2xl font-black uppercase tracking-[-.06em]">{item}</h3>
                <p className="mt-3 text-sm leading-7 text-white/45">Generate platform-ready assets without starting from a blank page.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-14 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[.24em] text-[#D7FF00]">Pricing</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-[.9] tracking-[-.08em] md:text-7xl">
              Choose your plan.
            </h2>
            <p className="mt-4 text-sm text-white/42">Annual billing — save up to 30%</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pricing.map((plan) => (
              <article key={plan.name} className={(plan.highlight ? "border-[#D7FF00] bg-[#D7FF00] text-black" : "border-white/10 bg-[#111] text-white") + " rounded-[1.5rem] border p-6 md:rounded-[2rem]"}>
                {plan.highlight && <p className="mb-4 inline-flex rounded-full bg-black px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-[#D7FF00]">Most popular</p>}
                <p className={(plan.highlight ? "text-black/55" : "text-white/35") + " text-xs font-black uppercase tracking-[.18em]"}>{plan.name}</p>
                <div className="mt-5 flex items-end gap-1">
                  <p className="text-5xl font-black tracking-[-.09em]">{plan.annualPrice}</p>
                  <span className="mb-1 text-base font-bold opacity-55">/mo</span>
                </div>
                <p className={(plan.highlight ? "text-black/55" : "text-white/35") + " mt-2 text-xs font-bold"}>{plan.billing}</p>
                <p className={(plan.highlight ? "text-black/75" : "text-[#D7FF00]") + " mt-4 text-sm font-black"}>{plan.credits}</p>
                <p className={(plan.highlight ? "text-black/50" : "text-white/30") + " mt-1 text-xs"}>{plan.monthlyPrice}/mo billed monthly</p>
                <div className={(plan.highlight ? "text-black/70" : "text-white/62") + " mt-6 space-y-2 text-sm font-semibold"}>
                  {plan.details.map((detail) => <p key={detail}>✓ {detail}</p>)}
                </div>
                <Link
                  href={`/checkout/plan?plan=${plan.name.toLowerCase()}&billing=annual`}
                  className={(plan.highlight ? "bg-black text-white hover:bg-[#111]" : "bg-white text-black hover:bg-[#D7FF00]") + " mt-7 inline-flex w-full justify-center rounded-xl px-5 py-3 text-xs font-black uppercase tracking-[.14em] no-underline transition"}
                >
                  Get {plan.name}
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-8 text-center">
            <Link href="/pricing" className="text-sm font-bold text-[#D7FF00] no-underline hover:underline">See full pricing details →</Link>
          </p>
        </div>
      </section>

      <section className="bg-[#D7FF00] px-4 py-16 text-center text-black md:px-8 md:py-24">
        <h2 className="mx-auto max-w-6xl text-4xl font-black uppercase leading-[.9] tracking-[-.09em] md:text-8xl">
          Generate your first product video today.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base font-semibold leading-7 text-black/62 md:text-lg md:leading-8">
          Start with 10 free credits and turn one product into ready-to-publish creatives.
        </p>
        <Link href="/sign-up" className="mt-8 inline-flex rounded-xl bg-black px-8 py-4 text-xs font-black uppercase tracking-[.14em] text-[#D7FF00] no-underline transition hover:bg-[#111]">
          Start free →
        </Link>
      </section>

      <footer className="border-t border-white/10 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <img src="/nova/logo-nova.jpeg" alt="NOVA logo" className="mb-4 h-11 w-auto object-contain" />
              <p className="max-w-sm text-sm leading-7 text-white/40">AI video studio for creators, brands, e-commerce teams and agencies.</p>
              <p className="mt-4 text-sm text-white/35">info@novvideos.online</p>
            </div>
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[.16em] text-white/40">Product</p>
              <Link href="/dashboard" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Studio</Link>
              <Link href="/dashboard/models" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Models</Link>
              <Link href="/pricing" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Pricing</Link>
              <Link href="/product-ad-generator" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Ad Generator</Link>
            </div>
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[.16em] text-white/40">Use cases</p>
              <Link href="/product-ad-generator" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Product Ads</Link>
              <Link href="/dashboard/templates" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">UGC Creatives</Link>
              <Link href="/explore" className="mb-3 block text-sm text-white/35 no-underline hover:text-white">Social Videos</Link>
            </div>
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[.16em] text-white/40">Company</p>
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
