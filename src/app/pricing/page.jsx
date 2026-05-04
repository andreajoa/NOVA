"use client";
import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

const PLANS = [
  {
    id: "basic", name: "BASIC", badge: null, badgeColor: "",
    desc: "For creators building AI content",
    monthly: 7, annual: 5, credits: 70,
    highlight: false, cta: "Get Plan",
    border: "border-white/10", bg: "bg-[#111]",
    accentColor: "text-white",
    savings: null,
    tags: [],
    features: [
      "70 credits/mo",
      "5 Seedance Fast videos",
      "1 Kling 3.0 video",
      "Fixed amount of 70 credits/mo",
    ],
    unlimited7: ["Seedance 2.0 Fast"],
    unlimited365: [],
    models: [
      { name: "Seedance 2.0 Fast", tag: null },
      { name: "Kling 3.0", tag: null },
    ],
  },
  {
    id: "plus", name: "PLUS", badge: "MOST POPULAR",
    badgeColor: "bg-[#D7FF00] text-black",
    desc: "For consistent and easy AI content creation",
    monthly: 44, annual: 34, credits: 500,
    highlight: true, cta: "Get Plan",
    border: "border-[#D7FF00]", bg: "bg-[#0f1200]",
    accentColor: "text-[#D7FF00]",
    savings: "Save $120 compared to monthly",
    tags: ["4x SEEDANCE FAST"],
    features: [
      "500 credits/mo",
      "38 Nano Banana Pro Generations",
      "114 Kling 3.0 videos",
      "Lowest cost per credit",
    ],
    unlimited7: ["Seedance 2.0 Fast", "Seedance 2.0 Pro"],
    unlimited365: ["Seedance 2.0 Fast", "Seedance 2.0 Pro", "Kling 3.0"],
    models: [
      { name: "Seedance 2.0 Fast", tag: "7D UNLIMITED" },
      { name: "Seedance 2.0 Pro", tag: null },
      { name: "Kling 3.0", tag: null },
      { name: "Veo 3.1", tag: null },
      { name: "Happy Horse", tag: null },
    ],
  },
  {
    id: "ultra", name: "ULTRA", badge: "BEST VALUE",
    badgeColor: "bg-blue-500 text-white",
    desc: "For teams producing AI video at scale",
    monthly: 119, annual: 89, credits: 3000,
    highlight: false, cta: "Get Plan",
    border: "border-blue-500/40", bg: "bg-[#080b12]",
    accentColor: "text-blue-400",
    savings: "Save $360 compared to monthly",
    tags: ["4x SEEDANCE FAST"],
    features: [
      "3,000 credits/mo",
      "230 Seedance Fast videos",
      "343 Kling 3.0 videos",
      "One 365-day Unlimited video model",
    ],
    unlimited7: ["Seedance 2.0 Fast", "Seedance 2.0 Pro", "Kling 3.0", "Veo 3.1", "Happy Horse", "LTX Video", "Wan 2.2"],
    unlimited365: ["Seedance 2.0 Fast", "Seedance 2.0 Pro", "Kling 3.0", "Veo 3.1", "Happy Horse", "LTX Video", "Wan 2.2"],
    models: [
      { name: "Seedance 2.0 Fast", tag: "UNLIMITED" },
      { name: "Seedance 2.0 Pro", tag: "UNLIMITED" },
      { name: "Kling 3.0", tag: "UNLIMITED" },
      { name: "Veo 3.1", tag: "UNLIMITED" },
      { name: "Happy Horse", tag: "UNLIMITED" },
      { name: "LTX Video", tag: "UNLIMITED" },
      { name: "Wan 2.2", tag: "UNLIMITED" },
    ],
  },
  {
    id: "business", name: "BUSINESS", badge: "BEST VALUE",
    badgeColor: "bg-blue-600 text-white",
    desc: "For agencies and small teams",
    monthly: 89, annual: 62, credits: 3000,
    highlight: false, cta: "Get Plan",
    border: "border-white/10", bg: "bg-[#080d18]",
    accentColor: "text-blue-300",
    savings: null,
    isTeam: true,
    tags: ["4x SEEDANCE FAST"],
    features: [
      "3,000 credits in total/mo",
      "1,500 credits per seat/mo",
      "Shared credit pool",
      "Priority support",
    ],
    teamFeatures: [
      "Access to all features & models",
      "All members in one shared workspace",
      "Shared credit pool",
      "Usage analytics and tracking",
      "Parallel generations: up to 16 Videos, 16 Images",
      "Priority support",
    ],
    unlimited7: ["Seedance 2.0 Fast", "Seedance 2.0 Pro", "Kling 3.0", "Veo 3.1", "Happy Horse", "LTX Video", "Wan 2.2"],
    unlimited365: ["Seedance 2.0 Fast", "Seedance 2.0 Pro", "Kling 3.0", "Veo 3.1", "Happy Horse", "LTX Video", "Wan 2.2"],
    models: [
      { name: "Seedance 2.0 Fast", tag: "UNLIMITED" },
      { name: "Seedance 2.0 Pro", tag: "UNLIMITED" },
      { name: "Kling 3.0", tag: "UNLIMITED" },
      { name: "Veo 3.1", tag: "UNLIMITED" },
      { name: "Happy Horse", tag: "UNLIMITED" },
      { name: "LTX Video", tag: "365 UNLIMITED" },
      { name: "Wan 2.2", tag: "7-DAY UNLIMITED" },
    ],
  },
];

const COMPARE_ROWS = [
  { label: "Concurrent Jobs", values: ["1 concurrent job", "2 concurrent jobs", "6 concurrent jobs", "8 concurrent jobs", "16 concurrent jobs"] },
  { label: "Seedance Fast (720p)", values: ["✗", "✗", "533 videos", "1600 videos", "1600 videos"] },
  { label: "Seedance Fast 720p", values: ["✗", "48 videos", "685 videos", "2057 videos", "2057 videos"] },
  { label: "Kling 3.0 videos", values: ["1", "1", "12", "75", "75+"] },
  { label: "All models", values: ["✗", "✗", "✓", "✓", "✓"] },
  { label: "7-Day Unlimited", values: ["✗", "Select", "Select", "All", "All"] },
  { label: "365-Day Unlimited", values: ["✗", "✗", "✗", "✓", "✓"] },
  { label: "Team workspace", values: ["✗", "✗", "✗", "✗", "✓"] },
];

const FAQS = [
  { q: "How do credits work?", a: "Each generation costs a fixed number of credits depending on the model. Seedance Fast = 10 cr, Kling = 40 cr, Veo = 50 cr. Credits reset monthly on your billing date. Unused credits do not carry over." },
  { q: "Is my subscription automatically renewed?", a: "Yes. All plans renew automatically on your billing date. You can cancel anytime from account settings with no extra fees." },
  { q: "How many videos can I generate?", a: "It depends on the model and your plan. On Plus (500 cr): ~38 Seedance Fast videos (10 cr each), ~12 Kling videos (40 cr each). On Ultra (3,000 cr): ~300 Seedance Fast or ~75 Kling videos." },
  { q: "How can I purchase extra credits?", a: "You can purchase credit top-ups at any time from your billing page without changing your plan." },
  { q: "How does Unlimited work?", a: "7-Day Unlimited gives unrestricted generations on select models for the first 7 days after subscribing. After 7 days, your normal monthly credit allowance applies." },
  { q: "How does 365-Day Unlimited work?", a: "Ultra and Business subscribers get free generation runs on specific models for the entire year. These free gens are separate from your credit balance." },
  { q: "Can I change my plan?", a: "Yes. Upgrades take effect immediately with prorated billing. Downgrades take effect at the next billing cycle." },
];

function tagStyle(tag) {
  if (!tag) return "";
  if (tag === "UNLIMITED" || tag === "365 UNLIMITED") return "bg-[#D7FF00] text-black text-[8px] font-black px-1.5 py-0.5 rounded";
  if (tag === "7D UNLIMITED" || tag === "7-DAY UNLIMITED") return "bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded";
  return "bg-white/10 text-white/50 text-[8px] font-black px-1.5 py-0.5 rounded";
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [seats, setSeats] = useState(2);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── PROMO BANNER ── */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 px-6 py-4 text-center">
        <p className="text-sm font-black uppercase tracking-wider">
          <span className="bg-[#D7FF00] text-black text-[10px] font-black px-2 py-0.5 rounded mr-3">SPECIAL 30% OFF</span>
          UNLIMITED SEEDANCE FAST & KLING 3.0 UNLIMITED WITH 30% OFF
        </p>
        <p className="text-white/50 text-xs mt-1">Get Unlimited access to all models on Ultra plan for 7 days with Special 30% discount</p>
      </div>

      {/* ── HERO ── */}
      <div className="pt-16 pb-8 px-6 text-center">
        <h1 className="text-5xl font-black uppercase tracking-[-0.04em] mb-3">PICK YOUR PLAN</h1>
        <p className="text-white/40 text-base max-w-lg mx-auto">Scale creativity with higher limits, priority access, and early features</p>

        {/* TOGGLE */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={"text-sm font-bold transition " + (!annual ? "text-white" : "text-white/30")}>Monthly</span>
          <button
            onClick={() => setAnnual(a => !a)}
            className={"relative w-12 h-6 rounded-full transition-colors border-none cursor-pointer " + (annual ? "bg-[#D7FF00]" : "bg-white/20")}>
            <span className={"absolute top-1 w-4 h-4 rounded-full bg-[#0a0a0a] transition-all " + (annual ? "left-7" : "left-1")} />
          </button>
          <span className={"text-sm font-bold transition " + (annual ? "text-white" : "text-white/30")}>Annual</span>
          {annual && <span className="bg-[#D7FF00] text-black text-[10px] font-black px-2 py-0.5 rounded">30% OFF</span>}
        </div>
      </div>

      {/* ── PLAN CARDS ── */}
      <div className="px-4 pb-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map(plan => (
            <div key={plan.id}
              className={"relative rounded-2xl border " + plan.border + " " + plan.bg + " p-5 flex flex-col " +
                (plan.highlight ? "shadow-[0_0_40px_rgba(215,255,0,0.08)]" : "")}>

              {/* badge */}
              {plan.badge && (
                <div className={"absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap " + plan.badgeColor}>
                  ★ {plan.badge}
                </div>
              )}

              {/* name + desc */}
              <div className="mb-4 mt-2">
                <p className={"text-[10px] font-black uppercase tracking-[0.2em] mb-1 " + plan.accentColor}>{plan.name}</p>
                <p className="text-white/40 text-xs leading-relaxed">{plan.desc}</p>
              </div>

              {/* tags */}
              {plan.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {plan.tags.map((tag, i) => (
                    <span key={i} className="bg-white/10 text-white/50 text-[9px] font-black uppercase px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}

              {/* features */}
              <div className="mb-4 space-y-1.5">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="text-[#D7FF00] mt-0.5 shrink-0">+</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {/* team seats */}
              {plan.isTeam && (
                <div className="mb-4 flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2 w-fit">
                  <button onClick={() => setSeats(s => Math.max(2, s - 1))}
                    className="text-white/40 hover:text-white font-bold bg-transparent border-none cursor-pointer text-base">−</button>
                  <span className="font-black text-sm w-5 text-center">{seats}</span>
                  <button onClick={() => setSeats(s => s + 1)}
                    className="text-white/40 hover:text-white font-bold bg-transparent border-none cursor-pointer text-base">+</button>
                  <span className="text-white/40 text-xs">seats</span>
                </div>
              )}

              {/* price */}
              <div className="mb-1">
                <div className="flex items-end gap-1">
                  {plan.isTeam && annual && <span className="text-white/30 line-through text-lg mb-1">${plan.monthly}</span>}
                  <span className="text-4xl font-black tracking-tighter">${annual ? plan.annual : plan.monthly}</span>
                  <span className="text-white/30 text-xs mb-1.5">
                    {plan.isTeam ? `/seat/mo · ${seats} seats` : "/mo"}
                  </span>
                </div>
                {annual && plan.savings && (
                  <p className="text-[#D7FF00] text-[10px] font-bold mt-1">{plan.savings}</p>
                )}
                {plan.isTeam && (
                  <p className="text-white/30 text-[10px] mt-1">= ${(annual ? plan.annual : plan.monthly) * seats}/mo total · billed annually</p>
                )}
              </div>

              {/* CTA */}
              <Link href="/dashboard"
                className={"mt-3 mb-5 flex items-center justify-center py-3 rounded-xl text-sm font-black uppercase tracking-wider transition no-underline " +
                  (plan.highlight
                    ? "bg-[#D7FF00] text-black hover:bg-[#c8f000]"
                    : plan.id === "business"
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "bg-white/10 text-white hover:bg-white/20")}>
                {plan.cta}
              </Link>

              {/* team features */}
              {plan.teamFeatures && (
                <div className="mb-4 space-y-1.5">
                  {plan.teamFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                      <span className="text-blue-400 mt-0.5 shrink-0">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/20 mt-3 pt-3 border-t border-white/8">TEAM FEATURES</p>
                  {["Shareable elements and Soul IDs","Usage analytics and tracking","Shared projects with integrated chat","Custom SSO access"].map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                      <span className="text-blue-400 mt-0.5 shrink-0">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 7-day unlimited */}
              {plan.unlimited7?.length > 0 && (
                <div className="mt-auto pt-3 border-t border-white/8">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-white/30">⚡ 7-DAY UNLIMITED</p>
                    <button className="text-[9px] text-white/30 hover:text-white">Learn more</button>
                  </div>
                  <div className="space-y-1.5">
                    {plan.unlimited7.map((m, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-white/40">{m}</span>
                        {plan.id !== "basic" && <span className="bg-[#D7FF00] text-black text-[8px] font-black px-1.5 py-0.5 rounded">UNLIMITED</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 365-day unlimited */}
              {plan.unlimited365?.length > 0 && (
                <div className="pt-3 mt-3 border-t border-white/8">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-white/30">★ 365-DAY UNLIMITED & FREE GENS</p>
                    <button className="text-[9px] text-white/30 hover:text-white">Learn more</button>
                  </div>
                  <div className="space-y-1.5">
                    {plan.unlimited365.map((m, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-white/40">{m}</span>
                        <span className="bg-[#D7FF00] text-black text-[8px] font-black px-1.5 py-0.5 rounded">365 UNLIMITED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-white/20 text-xs mt-6 max-w-2xl mx-auto">
          Prices exclude VAT and local taxes, calculated at checkout.<br />
          Unlimited usage may be subject to dynamic speed adjustments during high-traffic periods.
        </p>
      </div>

      {/* ── ENTERPRISE ── */}
      <div className="px-6 pb-20">
        <div className="max-w-[1400px] mx-auto rounded-2xl border border-white/10 bg-[#0d0d0d] p-10 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-3">Enterprise AI video infrastructure for teams that produce at scale</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-8">Tailored workflows, dedicated support, seamless onboarding, full control at scale, and no training on your data.</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: "🔒", title: "Security & Compliance", desc: "Your data is never used for model training. SOC 2 Type II in progress." },
                { icon: "📊", title: "Data & usage rights", desc: "You retain all rights in every AI-generated output — no restrictions." },
                { icon: "⚙️", title: "SSO & admin control", desc: "Set and manage roles and permissions from a single, centralized dashboard." },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4">
                  <p className="text-xl mb-2">{item.icon}</p>
                  <p className="text-xs font-black mb-1">{item.title}</p>
                  <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-white/30 mb-4">Everything on Business Plan and...</p>
            <div className="space-y-2 mb-8">
              {["Unlimited members","Custom credit amount","Dedicated model capacity","Access to all models on the platform","Volume-based discounts at the best rates","Priority queue for faster task processing"].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                  <span className="text-[#D7FF00]">✓</span>{f}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Link href="/contact" className="bg-white text-black text-sm font-black uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-[#D7FF00] transition no-underline">Contact Sales</Link>
              <Link href="/pricing" className="border border-white/20 text-white text-sm font-black uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-white/10 transition no-underline">Learn More</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPARE PLANS ── */}
      <div className="px-6 pb-20">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-4xl font-black uppercase tracking-tight text-center mb-12">COMPARE PLANS</h2>

          {/* sticky header */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 text-white/30 font-bold text-xs uppercase tracking-wider w-1/4"></th>
                  {["Free","Basic","Plus","Ultra","Business"].map((p, i) => (
                    <th key={p} className="text-center pb-4 px-2">
                      <p className={"text-xs font-black uppercase " + (i === 2 ? "text-[#D7FF00]" : "text-white/60")}>{p}</p>
                      <p className="text-white/30 text-[10px] mt-1">
                        {i === 0 ? "Free" : i === 1 ? `$${annual ? 5 : 7}/month` : i === 2 ? `$${annual ? 34 : 44}/month` : i === 3 ? `$${annual ? 89 : 119}/month` : `$${annual ? 62 : 89}/seat/month`}
                      </p>
                      <p className="text-white/20 text-[9px]">{i === 0 ? "Limited use" : "Billed annually"}</p>
                      {i > 0 && (
                        <Link href="/dashboard" className={"mt-2 inline-block text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition no-underline " +
                          (i === 2 ? "bg-[#D7FF00] text-black" : "bg-white/10 text-white hover:bg-white/20")}>
                          Get Plan
                        </Link>
                      )}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-3 text-white/30 text-xs font-black uppercase tracking-wider">Annual 30% OFF</td>
                  <td colSpan={5} className="py-3 text-right pr-2">
                    <button onClick={() => setAnnual(a => !a)}
                      className={"relative w-10 h-5 rounded-full border-none cursor-pointer transition-colors " + (annual ? "bg-[#D7FF00]" : "bg-white/20")}>
                      <span className={"absolute top-0.5 w-4 h-4 rounded-full bg-[#0a0a0a] transition-all " + (annual ? "left-5" : "left-0.5")} />
                    </button>
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={6} className="py-3 text-xs font-black uppercase tracking-wider text-white/30 border-b border-white/5">Video</td></tr>
                {COMPARE_ROWS.map(({ label, values }, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 text-white/50 text-xs">{label}</td>
                    {["Free", ...values].slice(0, 6).map((v, j) => (
                      <td key={j} className={"text-center py-3 text-xs font-bold " +
                        (v === "✓" ? "text-[#D7FF00]" : v === "✗" ? "text-white/15" : j === 3 ? "text-[#D7FF00]" : "text-white/60")}>
                        {j === 0 ? (i === 0 ? "1 concurrent job" : "✗") : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8">
            <Link href="/dashboard" className="inline-block border border-white/20 text-white text-sm font-black uppercase tracking-wider px-8 py-3 rounded-xl hover:bg-white/10 transition no-underline">
              Compare Features
            </Link>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-white/8 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left bg-[#0f0f0f] hover:bg-[#141414] transition cursor-pointer border-none text-white">
                  <span className="font-bold text-sm">{faq.q}</span>
                  <span className={"text-white/40 text-lg transition-transform inline-block " + (openFaq === i ? "rotate-180" : "")}>∨</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 py-5 bg-[#0a0a0a] border-t border-white/5">
                    <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-white/40 text-sm mb-4">Are you ready?</p>
            <Link href="/dashboard" className="inline-block bg-[#D7FF00] text-black text-sm font-black uppercase tracking-wider px-8 py-3 rounded-xl hover:bg-[#c8f000] transition no-underline">
              Choose your plan
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
