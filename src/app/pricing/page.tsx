"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const plans = [
  {
    id: "starter",
    name: "STARTER",
    badge: null,
    badgeColor: "",
    desc: "For creators getting started with AI video.",
    monthly: 5,
    annual: 5,
    credits: 70,
    highlight: false,
    cta: "Get Plan",
    color: "border-white/10",
    bg: "bg-[#0D0D0D]",
    features: [
      "70 credits / month",
      "2 Seedance Fast videos OR 1 Kling Pro video",
      "Access to selected models",
      "1 concurrent generation",
      "MP4 download",
      "Lowest cost per credit",
    ],
    models: [
      { name: "Seedance 2.0 Fast", tag: null },
      { name: "Seedance 2.0 Pro", tag: null },
      { name: "Kling 3.0", tag: null },
    ],
  },
  {
    id: "plus",
    name: "PLUS",
    badge: "MOST POPULAR",
    badgeColor: "bg-[#D7FF00] text-black",
    desc: "For consistent AI content creation.",
    monthly: 44,
    annual: 34,
    credits: 500,
    highlight: true,
    cta: "Get Plan",
    color: "border-[#D7FF00]",
    bg: "bg-[#101406]",
    features: [
      "500 credits / month",
      "14 Seedance Pro videos OR 8 Kling videos",
      "Access to all models",
      "Up to 4 concurrent generations",
      "Early access to advanced AI features",
      "Priority support",
      "7-Day Unlimited select models",
    ],
    models: [
      { name: "Seedance 2.0 Fast", tag: "7D UNLIMITED" },
      { name: "Seedance 2.0 Pro", tag: null },
      { name: "Kling 3.0", tag: null },
      { name: "Veo 3.1", tag: null },
      { name: "Happy Horse", tag: null },
    ],
  },
  {
    id: "ultra",
    name: "ULTRA",
    badge: "BEST VALUE",
    badgeColor: "bg-blue-500 text-white",
    desc: "For teams and agencies producing at scale.",
    monthly: 119,
    annual: 89,
    credits: 3000,
    highlight: false,
    cta: "Get Plan",
    color: "border-white/10",
    bg: "bg-[#0D0D0D]",
    features: [
      "3,000 credits / month",
      "85 Seedance Pro videos OR 50 Kling videos",
      "Access to all models",
      "Up to 8 concurrent generations",
      "Lowest cost per credit",
      "Priority queue",
      "7-Day Unlimited all models",
      "365-Day Unlimited free gens",
    ],
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
];

function tagStyle(tag: string) {
  if (tag === "UNLIMITED") return "bg-[#D7FF00] text-black";
  if (tag === "7D UNLIMITED") return "bg-blue-500/80 text-white";
  return "bg-white/10 text-white/60";
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[#050505]/90 backdrop-blur-xl px-4 sm:px-6 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/nova/nova-logo-full.png"
              alt="NOVA"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
            />
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-[0.18em] text-white/40">
            <Link href="/models" className="transition hover:text-white">Models</Link>
            <Link href="/pricing" className="text-white">Pricing</Link>
            <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#D7FF00] px-5 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:bg-[#c8f000]"
          >
            Start Free
          </Link>
        </div>
      </nav>

      <section className="px-4 sm:px-6 pt-28 md:pt-32 pb-16 md:pb-24">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 md:mb-10 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 md:px-6 md:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-white text-sm md:text-base font-bold">
                Start free inside Nova
              </p>
              <p className="text-white/45 text-sm">
                Get 50 free credits to test the studio before upgrading.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#D7FF00] px-5 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:bg-[#c8f000]"
            >
              Start Free
            </Link>
          </div>

          <div className="text-center mb-10 md:mb-14">
            <p className="mb-4 text-[11px] md:text-xs font-black uppercase tracking-[0.3em] text-[#D7FF00]">
              Transparent Pricing
            </p>

            <h1 className="mb-4 text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black uppercase tracking-[-0.06em] leading-none">
              Pick Your Plan
            </h1>

            <p className="mx-auto max-w-2xl text-base md:text-lg leading-relaxed text-white/45">
              Scale your AI video production with the right amount of credits for your workflow.
            </p>

            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                  !annual ? "bg-white text-black" : "text-white/45 hover:text-white"
                }`}
              >
                Monthly
              </button>

              <button
                onClick={() => setAnnual(true)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                  annual ? "bg-[#D7FF00] text-black" : "text-white/45 hover:text-white"
                }`}
              >
                Annual
              </button>

              <span className="hidden sm:inline-flex rounded-full bg-[#D7FF00] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">
                Save up to 30%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex h-full flex-col overflow-hidden rounded-[28px] border p-6 md:p-7 xl:p-8 ${
                  plan.highlight
                    ? `${plan.color} ${plan.bg} shadow-[0_0_60px_rgba(215,255,0,0.10)] xl:scale-[1.02]`
                    : `${plan.color} ${plan.bg}`
                }`}
              >
                {plan.badge && (
                  <div className={`mb-5 inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${plan.badgeColor}`}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <p className={`mb-2 text-[11px] font-black uppercase tracking-[0.24em] ${plan.highlight ? "text-[#D7FF00]" : "text-white/45"}`}>
                    {plan.name}
                  </p>
                  <p className="max-w-[28ch] text-sm leading-6 text-white/50">
                    {plan.desc}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1.5">
                    <span className="text-5xl md:text-6xl font-black tracking-[-0.06em] leading-none">
                      ${annual ? plan.annual : plan.monthly}
                    </span>
                    <span className="mb-2 text-sm md:text-base text-white/35">/mo</span>
                  </div>

                  <p className="mt-4 text-base font-black text-[#D7FF00]">
                    {plan.credits.toLocaleString()} credits/mo
                  </p>
                </div>

                <Link
                  href="/dashboard"
                  className={`mb-7 mt-1 flex h-14 items-center justify-center rounded-2xl text-sm font-black uppercase tracking-[0.16em] transition ${
                    plan.highlight
                      ? "bg-[#D7FF00] text-black hover:bg-[#c8f000]"
                      : "bg-white text-black hover:bg-[#D7FF00]"
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="mb-7 space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm leading-6 text-white/68">
                      <span className="mt-1 shrink-0 text-[#D7FF00]">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto border-t border-white/8 pt-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25">
                    Included models
                  </p>

                  {plan.models.map((model, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-white/48">{model.name}</span>
                      {model.tag && (
                        <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-black uppercase ${tagStyle(model.tag)}`}>
                          {model.tag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
