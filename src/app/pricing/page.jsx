"use client";
import Footer from "@/components/Footer";
import { useState } from "react";
import Link from "next/link";


const PLANS = [
  {
    id: "free", name: "FREE", badge: null,
    desc: "Try Nova with no commitment",
    monthly: 0, annual: 0, credits: 50,
    highlight: false, cta: "Get Started",
    border: "border-white/10", bg: "bg-[#0D0D0D]",
    features: [
      "50 credits total (one-time)",
      "com 50 cr: 3 vídeos Seedance Fast, ou 10 vídeos Kling",
      "Access to selected models",
      "1 concurrent generation",
      "MP4 download",
      "No credit card required",
    ],
    models: [
      { name: "Seedance 2.0 Fast", tag: null },
      { name: "Kling 3.0", tag: null },
    ],
  },
  {
    id: "starter", name: "STARTER", badge: null,
    desc: "For creators getting started",
    monthly: 5, annual: 4, credits: 70,
    highlight: false, cta: "Get Plan",
    border: "border-white/10", bg: "bg-[#0D0D0D]",
    features: [
      "70 credits / month",
      "com 70 cr: 5 vídeos Seedance Fast, ou 14 vídeos Kling, ou 14 imagens",
      "Access to selected models",
      "1 concurrent generation",
      "MP4 download",
    ],
    models: [
      { name: "Seedance 2.0 Fast", tag: null },
      { name: "Seedance 2.0 Pro",  tag: null },
      { name: "Kling 3.0",         tag: null },
    ],
  },
  {
    id: "plus", name: "PLUS",
    badge: "MOST POPULAR", badgeColor: "bg-[#D7FF00] text-black",
    desc: "For consistent AI content creation",
    monthly: 44, annual: 34, credits: 500,
    highlight: true, cta: "Get Plan",
    border: "border-[#D7FF00]", bg: "bg-[#D7FF00]/5",
    features: [
      "500 credits / month",
      "com 500 cr: 38 vídeos Seedance Fast, ou 16 vídeos Kling, ou 100 imagens",
      "Access to ALL models",
      "Up to 4 concurrent generations",
      "Priority support",
      "⚡ 7-Day Unlimited (select models)",
    ],
    models: [
      { name: "Seedance 2.0 Fast", tag: "7D UNLIMITED" },
      { name: "Seedance 2.0 Pro",  tag: null },
      { name: "Kling 3.0",         tag: null },
      { name: "Veo 3.1",           tag: null },
      { name: "Happy Horse",        tag: null },
    ],
  },
  {
    id: "ultra", name: "ULTRA",
    badge: "BEST VALUE", badgeColor: "bg-indigo-500 text-white",
    desc: "For teams producing at scale",
    monthly: 119, annual: 89, credits: 3000,
    highlight: false, cta: "Get Plan",
    border: "border-indigo-500/40", bg: "bg-[#0D0D0D]",
    features: [
      "3,000 credits / month",
      "com 3.000 cr: 230 vídeos Seedance Fast, ou 100 vídeos Kling, ou 600 imagens",
      "Access to ALL models",
      "Up to 8 concurrent generations",
      "⚡ 7-Day Unlimited (ALL models)",
      "★ 365-Day Unlimited free gens",
      "Priority queue",
    ],
    models: [
      { name: "Seedance 2.0 Fast", tag: "UNLIMITED" },
      { name: "Seedance 2.0 Pro",  tag: "UNLIMITED" },
      { name: "Kling 3.0",         tag: "UNLIMITED" },
      { name: "Veo 3.1",           tag: "UNLIMITED" },
      { name: "Happy Horse",        tag: "UNLIMITED" },
      { name: "LTX Video",          tag: "UNLIMITED" },
      { name: "Wan 2.2",            tag: "UNLIMITED" },
    ],
  },
];

const CREDIT_COSTS = [
  { model: "Seedance 2.0 Fast", credits: 10, example: "7 vídeos / 70 cr" },
  { model: "Seedance 2.0 Pro",  credits: 25, example: "2 vídeos / 70 cr" },
  { model: "Kling 3.0",         credits: 40, example: "1 vídeo / 70 cr"  },
  { model: "Veo 3.1",           credits: 50, example: "1 vídeo / 70 cr"  },
  { model: "Happy Horse",        credits: 20, example: "3 vídeos / 70 cr" },
  { model: "LTX Video",          credits: 15, example: "4 vídeos / 70 cr" },
  { model: "Wan 2.2",            credits: 18, example: "3 vídeos / 70 cr" },
];

const FAQS = [
  { q: "How do credits work?",
    a: "Each generation costs a fixed number of credits depending on the model. Seedance Fast = 10 cr, Kling = 40 cr, Veo = 50 cr. Credits reset monthly on your billing date. Unused credits do not carry over." },
  { q: "What is 7-Day Unlimited?",
    a: "7-Day Unlimited gives you unrestricted generations on select models for the first 7 days after subscribing. After 7 days your normal monthly credit allowance applies. This is NOT permanent unlimited access." },
  { q: "What does 365-Day Unlimited mean on Ultra?",
    a: "Ultra subscribers get free generation runs on specific base models for the entire year. These free gens are separate from your credit balance and apply only to models marked Unlimited." },
  { q: "Can I buy extra credits?",
    a: "Yes. You can purchase credit top-ups at any time from your billing page without changing your plan." },
  { q: "Can I change my plan?",
    a: "Yes. Upgrades take effect immediately with prorated billing. Downgrades take effect at the next billing cycle." },
];

function tagStyle(tag) {
  if (tag === "UNLIMITED")    return "bg-[#D7FF00] text-black";
  if (tag === "7D UNLIMITED") return "bg-blue-500/80 text-white";
  return "bg-white/10 text-white/50";
}

export default function PricingPage() {
  const [annual,  setAnnual]  = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [seats,   setSeats]   = useState(2);

  return (
    <main className="min-h-screen bg-[#050505] text-white">

      {/* ── NAV ── */}

      <div className="pt-28 pb-24 px-6">
        <div className="max-w-7xl mx-auto">

          {/* ── HERO ── */}
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-4">Transparent Pricing</p>
            <h1 className="text-6xl font-black uppercase tracking-[-0.06em] mb-4">PICK YOUR PLAN</h1>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Scale your AI video production. No hidden fees — every credit cost is listed below.
            </p>

            {/* ── TOGGLE ANNUAL / MONTHLY ── */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setAnnual(false)}
                className={"text-sm font-black uppercase tracking-wider transition border-none bg-transparent cursor-pointer " +
                  (!annual ? "text-white" : "text-white/30")}>
                Monthly
              </button>
              <button
                onClick={() => setAnnual(a => !a)}
                className={"relative w-12 h-6 rounded-full transition-colors cursor-pointer border-none " +
                  (annual ? "bg-[#D7FF00]" : "bg-white/20")}
                aria-label="Toggle billing period">
                <span className={"absolute top-1 w-4 h-4 rounded-full bg-[#050505] transition-all " +
                  (annual ? "left-7" : "left-1")} />
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={"text-sm font-black uppercase tracking-wider transition border-none bg-transparent cursor-pointer " +
                  (annual ? "text-white" : "text-white/30")}>
                Annual{" "}
                <span className="ml-2 text-[9px] bg-[#D7FF00] text-black px-2 py-0.5 rounded-full font-black">
                  SAVE UP TO 30%
                </span>
              </button>
            </div>
          </div>

          {/* ── PLAN CARDS ── */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {PLANS.map(plan => (
              <div key={plan.id}
                className={"relative rounded-2xl border " + plan.border + " " + plan.bg +
                  " p-6 flex flex-col " +
                  (plan.highlight ? "shadow-[0_0_60px_rgba(215,255,0,0.12)]" : "")}>

                {plan.badge && (
                  <div className={"absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap " + plan.badgeColor}>
                    ✦ {plan.badge}
                  </div>
                )}

                {/* plan name + desc */}
                <div className="mb-5">
                  <p className={"text-xs font-black uppercase tracking-[0.2em] mb-2 " +
                    (plan.highlight ? "text-[#D7FF00]" : "text-white/40")}>
                    {plan.name}
                  </p>
                  <p className="text-white/40 text-xs leading-relaxed">{plan.desc}</p>
                </div>

                {/* price — reacts to annual toggle */}
                <div className="mb-5">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-black tracking-tighter">
                      ${annual ? plan.annual : plan.monthly}
                    </span>
                    <span className="text-white/30 text-sm mb-2">/mo</span>
                  </div>

                  {/* show savings hint only when annual is active and prices differ */}
                  {annual && plan.monthly > 0 && plan.annual !== plan.monthly && (
                    <p className="text-white/25 text-xs mt-1">
                      <span className="line-through">${plan.monthly}/mo</span>
                      <span className="ml-2 text-[#D7FF00] font-bold">billed annually</span>
                    </p>
                  )}

                  {/* show monthly label when monthly is active */}
                  {!annual && plan.monthly > 0 && (
                    <p className="text-white/25 text-xs mt-1">billed monthly</p>
                  )}

                  {plan.credits > 0 && (
                    <p className="text-sm font-black mt-3 text-[#D7FF00]">
                      {plan.credits.toLocaleString()} credits/mo
                    </p>
                  )}
                </div>

                {/* CTA */}
                <Link href="/dashboard"
                  className={"w-full text-center py-3 rounded-xl text-sm font-black uppercase tracking-wider transition mb-6 block no-underline " +
                    (plan.highlight
                      ? "bg-[#D7FF00] text-black hover:bg-[#c8f000]"
                      : "bg-white text-black hover:bg-[#D7FF00]")}>
                  {plan.cta}
                </Link>

                {/* features */}
                <div className="space-y-2.5 mb-6">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <span className="text-[#D7FF00] mt-0.5 flex-shrink-0">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                {/* models */}
                <div className="mt-auto pt-4 border-t border-white/8 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-white/20 mb-3">Included Models</p>
                  {plan.models.map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-white/40">{m.name}</span>
                      {m.tag && (
                        <span className={"text-[8px] font-black uppercase px-1.5 py-0.5 rounded " + tagStyle(m.tag)}>
                          {m.tag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── BUSINESS PLAN ── */}
          <div className="rounded-2xl border border-blue-500/30 bg-[#08080f] p-8 mb-16">
            <div className="grid grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">
                  BUSINESS
                </span>
                <h3 className="text-3xl font-black uppercase tracking-tight mt-4 mb-2">For Teams</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-5">
                  Shared workspace, team credits, and centralized billing for agencies and creative teams.
                </p>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-4xl font-black">${annual ? 59 : 69}</span>
                  <span className="text-white/30 text-sm mb-1">/seat/mo · min 2 seats</span>
                </div>
                <p className="text-[#D7FF00] text-sm font-bold mb-5">
                  {annual ? "Billed annually" : "Billed monthly"}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2">
                    <button onClick={() => setSeats(s => Math.max(2, s - 1))}
                      className="text-white/40 hover:text-white text-lg font-bold bg-transparent border-none cursor-pointer">−</button>
                    <span className="text-white font-black w-6 text-center">{seats}</span>
                    <button onClick={() => setSeats(s => s + 1)}
                      className="text-white/40 hover:text-white text-lg font-bold bg-transparent border-none cursor-pointer">+</button>
                    <span className="text-white/40 text-xs ml-1">seats</span>
                  </div>
                  <span className="text-white/40 text-sm">
                    = <span className="text-white font-black">${(annual ? 59 : 69) * seats}/mo</span>
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-white/30 mb-4">Everything in Ultra, plus:</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {["Shared team workspace","Usage analytics dashboard","Shared projects & assets","SSO access","Centralized billing","Volume-based discounts","Custom credit amounts","Priority support"].map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                      <span className="text-blue-400 mt-0.5">✓</span><span>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard"
                  className="mt-6 inline-flex bg-blue-500 text-white text-sm font-black uppercase tracking-wider px-8 py-3 rounded-xl hover:bg-blue-400 transition no-underline">
                  Get Business Plan →
                </Link>
              </div>
            </div>
          </div>

          {/* ── CREDIT COST TABLE ── */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Credit Cost Per Model</h2>
              <p className="text-white/40 text-sm">No surprises. Exact credit cost per generation.</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {CREDIT_COSTS.map((item, i) => (
                <div key={i} className="bg-[#0D0D0D] border border-white/8 rounded-2xl p-5">
                  <p className="text-white font-black text-sm mb-2">{item.model}</p>
                  <p className="text-[#D7FF00] text-3xl font-black mb-1">
                    {item.credits}<span className="text-sm text-white/30 ml-1 font-normal">cr</span>
                  </p>
                  <p className="text-white/30 text-xs">{item.example}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── COMPARE TABLE ── */}
          <div className="mb-16 overflow-x-auto">
            <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-8">Compare Plans</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 text-white/30 font-bold text-xs uppercase tracking-wider w-1/3">Feature</th>
                  {["Free","Starter","Plus","Ultra","Business"].map((p, i) => (
                    <th key={p} className={"text-center py-4 font-black uppercase text-xs tracking-wider " +
                      (i === 2 ? "text-[#D7FF00]" : "text-white/60")}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Credits / month","50 total","70","500","3,000","3,000+"],
                  ["Seedance Fast per video","10 cr","10 cr","10 cr","10 cr","10 cr"],
                  ["Kling 3.0 per video","40 cr","40 cr","40 cr","40 cr","40 cr"],
                  ["Concurrent generations","1","1","4","8","16"],
                  ["All models","✗","✗","✓","✓","✓"],
                  ["7-Day Unlimited","✗","✗","Select","All","All"],
                  ["365-Day Unlimited","✗","✗","✗","✓","✓"],
                  ["Priority queue","✗","✗","✗","✓","✓"],
                  ["Team workspace","✗","✗","✗","✗","✓"],
                ].map(([feat, ...vals], i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-4 text-white/50 text-xs">{feat}</td>
                    {vals.map((v, j) => (
                      <td key={j} className={"text-center py-4 text-xs font-bold " +
                        (v === "✓" ? "text-[#D7FF00]" : v === "✗" ? "text-white/15" : j === 2 ? "text-[#D7FF00]" : "text-white/60")}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── FAQ ── */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-8">FAQ</h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-white/8 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left bg-[#0D0D0D] hover:bg-[#111] transition cursor-pointer border-none"
                    style={{ color: "white" }}>
                    <span className="font-bold text-sm">{faq.q}</span>
                    <span className={"text-white/40 text-lg transition-transform inline-block " +
                      (openFaq === i ? "rotate-180" : "")}>∨</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 py-5 bg-[#0a0a0a] border-t border-white/5">
                      <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA BOTTOM ── */}
          <div className="bg-[#D7FF00] rounded-3xl p-16 text-center">
            <h2 className="text-5xl font-black uppercase tracking-[-0.05em] leading-tight mb-4 text-black">
              The AI video studio<br />for brands that move fast.
            </h2>
            <p className="text-black/60 text-lg mb-8 max-w-lg mx-auto">
              Start with 50 free credits. No credit card required.
            </p>
            <Link href="/dashboard"
              className="inline-flex bg-black text-[#D7FF00] text-sm font-black uppercase tracking-wider px-10 py-4 rounded-xl hover:bg-[#111] transition no-underline">
              Generate first video →
            </Link>
          </div>

        </div>
      </div>
      <Footer />
    </main>
  );
}