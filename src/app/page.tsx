import Image from "next/image";
import Link from "next/link";

const useCases = [
  { title: "Product Ads",      subtitle: "Ready to sell",  image: "/nova/nova-product-ads.png"     },
  { title: "Cinematic Videos", subtitle: "Studio grade",   image: "/nova/nova-cinematic-videos.png" },
  { title: "UGC Creatives",    subtitle: "Made to engage", image: "/nova/nova-ugc-creatives.png"    },
];

const modelCards = [
  { name: "Seedance", version: "2.0 Fast", image: "/nova/nova-seedance-fast.png" },
  { name: "Seedance", version: "2.0 Pro",  image: "/nova/nova-seedance-pro.png"  },
  { name: "Kling",    version: "3.0",      image: "/nova/nova-kling-3.png"       },
  { name: "Veo",      version: "3.1",      image: "/nova/nova-veo-3-1.png"       },
  { name: "Wan",      version: "2.6",      image: "/nova/nova-wan-2-6.png"       },
];

const pricing = [
  { name: "Basic",    annualPrice: "$5",  monthlyPrice: "$7",   credits: "70 credits / month",     highlight: false },
  { name: "Plus",     annualPrice: "$34", monthlyPrice: "$49",  credits: "500 credits / month",    highlight: true  },
  { name: "Ultra",    annualPrice: "$89", monthlyPrice: "$129", credits: "3,000 credits / month",  highlight: false },
  { name: "Business", annualPrice: "$62", monthlyPrice: "$89",  credits: "3,000 credits / month",  highlight: false },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white pt-[72px]">

      {/* HERO BENTO */}
      <section className="relative px-4 pb-12 pt-6 md:px-8 md:pb-16 md:pt-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(215,255,0,0.18),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(215,255,0,0.10),transparent_25%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:100%_100%,100%_100%,72px_72px,72px_72px]" />

        <div className="relative mx-auto max-w-[1640px]">
          <div className="grid gap-4 xl:grid-cols-[1.22fr_0.88fr]">

            {/* Main dashboard card */}
            <div className="relative overflow-hidden rounded-2xl border border-[#D7FF00]/25 bg-[#080808] p-3 shadow-[0_0_100px_rgba(215,255,0,0.12)] md:rounded-[2rem] md:p-6">
              <Image src="/nova/nova-dashboard.png" alt="NOVA AI video dashboard"
                width={1600} height={1100} priority className="w-full rounded-xl object-cover md:rounded-[1.6rem]" />
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-black/35 via-transparent to-transparent md:rounded-[2rem]" />
              <div className="absolute bottom-5 left-5 hidden items-end gap-4 md:flex md:bottom-8 md:left-8">
                <img src="/nova/logo-nova.jpeg" alt="NOVA AI Video Studio"
                  style={{height:"72px",width:"auto",objectFit:"contain",display:"block"}} />
                <p className="mb-4 text-3xl font-black uppercase tracking-[-0.08em] text-white md:text-4xl">AI Video Studio</p>
              </div>
            </div>

            {/* Right column */}
            <div className="grid gap-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080808] p-3 md:rounded-[2rem] md:p-4">
                <Image src="/nova/nova-creative-agent.png" alt="NOVA E-commerce Creative Agent"
                  width={1600} height={900} priority className="w-full rounded-xl object-cover md:rounded-[1.5rem]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {useCases.map((item) => (
                  <article key={item.title}
                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#111] md:rounded-[1.5rem]">
                    <Image src={item.image} alt={item.title} width={1100} height={1500}
                      className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-5 md:right-5">
                      <p className="text-[9px] font-black uppercase tracking-[0.10em] text-[#D7FF00] md:text-xs md:tracking-[0.12em]">{item.title}</p>
                      <p className="mt-0.5 text-sm font-black uppercase leading-none tracking-tight md:mt-1 md:text-xl">{item.subtitle}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Models strip */}
          <section id="models" className="mt-4 grid grid-cols-3 gap-3 md:mt-6 md:gap-5 lg:grid-cols-5">
            {modelCards.map((model) => (
              <Link key={model.name + model.version} href="/dashboard/models" className="no-underline">
                <article className="group overflow-hidden rounded-xl border border-white/10 bg-[#0D0D0D] transition hover:border-[#D7FF00]/60 hover:shadow-[0_0_60px_rgba(215,255,0,0.12)] md:rounded-[1.7rem]">
                  <Image src={model.image} alt={model.name + " " + model.version} width={1100} height={1500}
                    className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105" />
                </article>
              </Link>
            ))}
          </section>
        </div>
      </section>

      {/* SHOWCASE */}
      <section id="showcase" className="border-y border-white/10 bg-[#0B0B0B] px-4 py-14 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] md:text-sm">Full AI video workflow</span>
              <h2 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:mt-4 md:text-7xl">
                From idea to finished creative.
              </h2>
            </div>
            <p className="text-base leading-7 text-white/50 md:text-lg md:leading-8">
              NOVA feels like a real AI production studio: choose a model, upload a product, generate hooks, create scenes, render video and export ready-to-publish assets.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:mt-14 md:gap-5 lg:grid-cols-3">
            {["Prompt + Product","Model Selection","Generated Video"].map((step, index) => (
              <div key={step} className="rounded-xl border border-white/10 bg-[#111] p-5 md:rounded-[1.7rem] md:p-7">
                <div className="mb-6 text-5xl font-black text-[#D7FF00] md:mb-10 md:text-6xl">0{index + 1}</div>
                <h3 className="text-2xl font-black uppercase tracking-[-0.06em] md:text-3xl">{step}</h3>
                <p className="mt-3 text-sm leading-7 text-white/45 md:mt-4">
                  The platform guides users from commercial idea to final video with a clean, professional workflow.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-4 py-14 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] md:text-sm">Pricing</span>
            <h2 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:mt-4 md:text-7xl">Choose your plan.</h2>
            <p className="mt-3 text-sm text-white/40">Annual billing — save up to 30%</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
            {pricing.map((plan) => (
              <article key={plan.name}
                className={"rounded-xl border p-5 md:rounded-[1.7rem] md:p-6 " + (plan.highlight ? "border-[#D7FF00] bg-[#D7FF00] text-black" : "border-white/10 bg-[#111] text-white")}>
                {plan.highlight && (
                  <div className={"mb-3 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider " + (plan.highlight ? "bg-black text-[#D7FF00]" : "bg-white/10 text-white/50")}>
                    Most Popular
                  </div>
                )}
                <p className={"text-xs font-black uppercase tracking-[0.16em] " + (plan.highlight ? "text-black/50" : "text-white/35")}>{plan.name}</p>
                <div className="mt-4 flex items-end gap-1">
                  <p className="text-4xl font-black tracking-[-0.08em] md:text-5xl">{plan.annualPrice}</p>
                  <span className="mb-1 text-base font-normal opacity-50">/mo</span>
                </div>
                <p className={"text-xs mt-1 " + (plan.highlight ? "text-black/50" : "text-white/30")}>
                  {plan.monthlyPrice}/mo billed monthly
                </p>
                <p className={"mt-3 text-sm font-black " + (plan.highlight ? "text-black/70" : "text-[#D7FF00]")}>{plan.credits}</p>
                <div className="mt-5 space-y-2 text-sm font-semibold opacity-70">
                  <p>✓ Video generation</p>
                  <p>✓ All AI models</p>
                  <p>✓ MP4 download</p>
                </div>
                <Link href={"/checkout/plan?plan=" + plan.name.toLowerCase() + "&billing=annual"}
                  className={"mt-6 inline-flex w-full justify-center rounded-lg px-5 py-3 text-sm font-black uppercase tracking-[0.08em] no-underline transition md:rounded-xl " +
                    (plan.highlight ? "bg-black text-white hover:bg-[#111]" : "bg-white text-black hover:bg-[#D7FF00]")}>
                  Get {plan.name}
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center md:mt-8">
            <Link href="/pricing" className="text-sm text-[#D7FF00] hover:underline">See full pricing details →</Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#D7FF00] px-4 py-16 text-center text-black md:px-8 md:py-24">
        <h2 className="mx-auto max-w-5xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.09em] md:text-8xl">
          The AI video studio for brands that move fast.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-black/65 md:mt-7 md:text-lg md:leading-8">
          Start with 50 free credits. Generate product videos, ad angles and social creatives from one professional platform.
        </p>
        <Link href="/dashboard"
          className="mt-7 inline-flex rounded-xl bg-black px-8 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#D7FF00] no-underline hover:bg-[#111] md:mt-9 md:rounded-md md:px-9 md:text-base">
          Generate first video →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <img src="/nova/logo-nova.jpeg" alt="NOVA logo"
                style={{height:"44px",width:"auto",objectFit:"contain",display:"block",marginBottom:"16px"}} />
              <p className="max-w-sm text-sm leading-7 text-white/40">AI video studio for creators, brands, e-commerce teams and agencies.</p>
              <p className="mt-4 text-sm text-white/35">info@novvideos.online</p>
            </div>
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white/40">Product</p>
              <Link href="/dashboard" className="mb-3 block text-sm text-white/35 hover:text-white no-underline">Studio</Link>
              <Link href="/dashboard/models" className="mb-3 block text-sm text-white/35 hover:text-white no-underline">Models</Link>
              <Link href="/pricing" className="mb-3 block text-sm text-white/35 hover:text-white no-underline">Pricing</Link>
              <Link href="/product-ad-generator" className="mb-3 block text-sm text-white/35 hover:text-white no-underline">Ad Generator</Link>
            </div>
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white/40">Use cases</p>
              <Link href="/product-ad-generator" className="mb-3 block text-sm text-white/35 hover:text-white no-underline">Product Ads</Link>
              <Link href="/dashboard/templates" className="mb-3 block text-sm text-white/35 hover:text-white no-underline">UGC Creatives</Link>
              <Link href="/explore" className="mb-3 block text-sm text-white/35 hover:text-white no-underline">Social Videos</Link>
            </div>
            <div>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white/40">Company</p>
              <Link href="/terms" className="mb-3 block text-sm text-white/35 hover:text-white no-underline">Terms</Link>
              <Link href="/privacy" className="mb-3 block text-sm text-white/35 hover:text-white no-underline">Privacy</Link>
              <Link href="/contact" className="mb-3 block text-sm text-white/35 hover:text-white no-underline">Contact</Link>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
            <p className="text-xs text-white/20">© 2026 NOVA AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </main>
  );
}
