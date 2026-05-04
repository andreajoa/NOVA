import Image from "next/image";
import Link from "next/link";

const useCases = [
  { title: "Product Ads",     subtitle: "Ready to sell",  image: "/nova/nova-product-ads.png"     },
  { title: "Cinematic Videos",subtitle: "Studio grade",   image: "/nova/nova-cinematic-videos.png" },
  { title: "UGC Creatives",   subtitle: "Made to engage", image: "/nova/nova-ugc-creatives.png"    },
];

const modelCards = [
  { name: "Seedance", version: "2.0 Fast", image: "/nova/nova-seedance-fast.png" },
  { name: "Seedance", version: "2.0 Pro",  image: "/nova/nova-seedance-pro.png"  },
  { name: "Kling",    version: "3.0",      image: "/nova/nova-kling-3.png"       },
  { name: "Veo",      version: "3.1",      image: "/nova/nova-veo-3-1.png"       },
  { name: "Wan",      version: "2.6",      image: "/nova/nova-wan-2-6.png"       },
];

const pricing = [
  ["Free",    "$0",   "50 credits (one-time)"],
  ["Starter", "$5",   "70 credits / month"   ],
  ["Plus",    "$34",  "500 credits / month"  ],
  ["Ultra",   "$119", "3,000 credits / month"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white pt-[72px]">

      {/* HERO BENTO */}
      <section className="relative px-5 pb-16 pt-8 md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(215,255,0,0.18),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(215,255,0,0.10),transparent_25%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:100%_100%,100%_100%,72px_72px,72px_72px]" />

        <div className="relative mx-auto max-w-[1640px]">
          <div className="grid gap-6 xl:grid-cols-[1.22fr_0.88fr]">

            {/* Main dashboard card */}
            <div className="relative overflow-hidden rounded-[2rem] border border-[#D7FF00]/25 bg-[#080808] p-4 shadow-[0_0_100px_rgba(215,255,0,0.12)] md:p-6">
              <Image src="/nova/nova-dashboard.png" alt="NOVA AI video dashboard"
                width={1600} height={1100} priority className="w-full rounded-[1.6rem] object-cover" />
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 hidden items-end gap-5 md:flex">
                <img src="/nova/nova-logo-full.png" alt="NOVA AI Video Studio"
                  style={{height:"96px",width:"auto",objectFit:"contain",display:"block"}} />
                <p className="mb-6 text-4xl font-black uppercase tracking-[-0.08em] text-white">AI Video Studio</p>
              </div>
            </div>

            {/* Right column */}
            <div className="grid gap-6">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] p-4">
                <Image src="/nova/nova-creative-agent.png" alt="NOVA E-commerce Creative Agent"
                  width={1600} height={900} priority className="w-full rounded-[1.5rem] object-cover" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {useCases.map((item) => (
                  <article key={item.title}
                    className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111]">
                    <Image src={item.image} alt={item.title} width={1100} height={1500}
                      className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#D7FF00]">{item.title}</p>
                      <p className="mt-1 text-xl font-black uppercase leading-none tracking-[-0.05em]">{item.subtitle}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Models strip */}
          <section id="models" className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {modelCards.map((model) => (
              <Link key={`${model.name}-${model.version}`} href="/dashboard/models" className="no-underline">
                <article className="group overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0D0D0D] transition hover:border-[#D7FF00]/60 hover:shadow-[0_0_60px_rgba(215,255,0,0.12)]">
                  <Image src={model.image} alt={`${model.name} ${model.version}`} width={1100} height={1500}
                    className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105" />
                </article>
              </Link>
            ))}
          </section>
        </div>
      </section>

      {/* SHOWCASE */}
      <section id="showcase" className="border-y border-white/10 bg-[#0B0B0B] px-5 py-24 md:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <span className="text-sm font-black uppercase tracking-[0.25em] text-[#D7FF00]">Full AI video workflow</span>
              <h2 className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl">
                From idea to finished creative.
              </h2>
            </div>
            <p className="max-w-3xl text-lg leading-8 text-white/50">
              NOVA feels like a real AI production studio: choose a model, upload a product, generate hooks, create scenes, render video and export ready-to-publish assets.
            </p>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {["Prompt + Product","Model Selection","Generated Video"].map((step, index) => (
              <div key={step} className="rounded-[1.7rem] border border-white/10 bg-[#111] p-7">
                <div className="mb-10 text-6xl font-black text-[#D7FF00]">0{index + 1}</div>
                <h3 className="text-3xl font-black uppercase tracking-[-0.06em]">{step}</h3>
                <p className="mt-4 text-sm leading-7 text-white/45">
                  The platform guides users from commercial idea to final video with a clean, professional workflow.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-5 py-24 md:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="text-center">
            <span className="text-sm font-black uppercase tracking-[0.25em] text-[#D7FF00]">Pricing</span>
            <h2 className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl">Choose your plan.</h2>
          </div>
          <div className="mt-14 grid gap-4 lg:grid-cols-4">
            {pricing.map((plan, index) => (
              <article key={plan[0]}
                className={"rounded-[1.7rem] border p-6 " + (index === 2 ? "border-[#D7FF00] bg-[#D7FF00] text-black" : "border-white/10 bg-[#111] text-white")}>
                <p className={"text-xs font-black uppercase tracking-[0.16em] " + (index === 2 ? "text-black/50" : "text-white/35")}>{plan[0]}</p>
                <p className="mt-5 text-5xl font-black tracking-[-0.08em]">{plan[1]}<span className="text-lg font-normal opacity-50">/mo</span></p>
                <p className={"mt-3 font-black " + (index === 2 ? "text-black/70" : "text-[#D7FF00]")}>{plan[2]}</p>
                <div className="mt-7 space-y-3 text-sm font-semibold opacity-70">
                  <p>✓ Video generation</p>
                  <p>✓ E-commerce Creative Agent</p>
                  <p>✓ MP4 download</p>
                </div>
                <Link href="/pricing"
                  className={"mt-8 inline-flex w-full justify-center rounded-md px-5 py-3 text-sm font-black uppercase tracking-[0.08em] no-underline " +
                    (index === 2 ? "bg-black text-white hover:bg-[#111]" : "bg-white text-black hover:bg-[#D7FF00]")}>
                  {plan[0] === "Free" ? "Start Free" : "Get Plan"}
                </Link>
              </article>
            ))}
          </div>
          <p className="text-center mt-8">
            <Link href="/pricing" className="text-[#D7FF00] text-sm hover:underline">See full pricing details →</Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#D7FF00] px-5 py-24 text-center text-black md:px-8">
        <h2 className="mx-auto max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.09em] md:text-8xl">
          The AI video studio for brands that move fast.
        </h2>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-black/65">
          Start with 50 free credits. Generate product videos, ad angles and social creatives from one professional platform.
        </p>
        <Link href="/dashboard"
          className="mt-9 inline-flex rounded-md bg-black px-9 py-4 text-base font-black uppercase tracking-[0.08em] text-[#D7FF00] no-underline hover:bg-[#111]">
          Generate first video →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-5 py-10 md:px-8">
        <div className="mx-auto grid max-w-[1500px] gap-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <img src="/nova/nova-logo-full.png" alt="NOVA logo"
              style={{height:"44px",width:"auto",objectFit:"contain",display:"block",marginBottom:"16px"}} />
            <p className="max-w-sm text-sm leading-7 text-white/40">AI video studio for creators, brands, e-commerce teams and agencies.</p>
            <p className="mt-4 text-sm text-white/35">info@nova.online</p>
          </div>
          {[
            ["Product",   [["Studio","/dashboard"],["Models","/dashboard/models"],["Pricing","/pricing"],["Ad Generator","/product-ad-generator"]]],
            ["Use cases", [["Product ads","/product-ad-generator"],["UGC creatives","/product-ad-generator"],["Social videos","/product-ad-generator"]]],
            ["Company",   [["Terms","/terms"],["Privacy","/privacy"],["Contact","/contact"]]],
          ].map((item) => { const col = item[0] as string; const links = item[1] as string[][]; return (
            <div key={col}>
              <p className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white/40">{col}</p>
              {links.map(([label, href]) => (
                <Link key={label} href={href} className="mb-3 block text-sm text-white/35 hover:text-white no-underline">{label}</Link>
              ))}
            </div>
          ))}
        </div>
      </footer>

    </main>
  );
}