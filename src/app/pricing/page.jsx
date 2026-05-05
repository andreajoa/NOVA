"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Basic",
    subtitle: "For first-time AI content creators",
    price: "$5",
    period: "/mo",
    billing: "per month, billed annually",
    button: "Get Basic",
    tone: "default",
    badge: "",
    highlight: "",
    features: [
      "70 credits/mo",
      "5 Nano Banana Pro Generations",
      "8 Kling 3.0 videos",
      "Fixed amount of 70 credits/mo",
    ],
    included: [
      "Access to selected models only",
      "Parallel generations: up to 2 videos, 2 images",
      "Early access to advanced AI features",
      "Lowest cost per credit",
    ],
    unlimited: ["Seedance 2.0 Fast"],
    freeGens: [],
  },
  {
    name: "Plus",
    subtitle: "For consistent and easy AI content creation",
    price: "$34",
    oldPrice: "$49",
    period: "/mo",
    billing: "per month, billed annually",
    button: "Get Plus",
    tone: "lime",
    badge: "Most Popular",
    highlight: "Save $120 compared to monthly",
    features: [
      "500 credits/mo",
      "38 Nano Banana Pro Generations",
      "114 Kling 3.0 videos",
      "Lowest cost per credit",
    ],
    included: [
      "Access to all models",
      "Parallel generations: up to 6 videos, 8 images",
      "Access to all features",
      "Early access to advanced AI features",
      "One 365-day Unlimited video model",
    ],
    unlimited: ["Seedance 2.0 Fast", "Seedance 2.0 Pro", "Kling 3.0"],
    freeGens: ["Seedream 4.0", "Flux 2 Pro", "GPT Image"],
  },
  {
    name: "Ultra",
    subtitle: "For creators building AI projects at scale",
    price: "$89",
    oldPrice: "$129",
    period: "/mo",
    billing: "per month, billed annually",
    button: "Get Ultra",
    tone: "blue",
    badge: "Best Value",
    highlight: "Save $360 compared to monthly",
    features: [
      "3,000 credits/mo",
      "230 Seedance Fast videos",
      "343 Kling 3.0 videos",
      "One 365-day Unlimited video model",
    ],
    included: [
      "Access to all models",
      "Parallel generations: up to 8 videos, 8 images",
      "Access to all features",
      "Early access to advanced AI features",
      "Lowest cost per credit",
    ],
    unlimited: ["Seedance 2.0 Fast", "Seedance 2.0 Pro", "Kling 3.0", "Hailuo 3.1", "Wan 2.2"],
    freeGens: ["Seedream 4.0", "Flux 2 Pro", "Nano Banana", "Kling 3.0", "GPT Image"],
  },
  {
    name: "Business",
    subtitle: "For agencies and small teams",
    price: "$62",
    oldPrice: "$89",
    period: "/seat/mo",
    billing: "per seat/mo, billed annually",
    button: "Get Business",
    tone: "business",
    badge: "Best Value",
    highlight: "Calculated for min. 2 seats",
    features: [
      "3,000 credits in total/mo",
      "1,500 credits per seat/mo",
      "Shared credit pool",
      "Priority support",
    ],
    included: [
      "Access to all features & models",
      "2 to 15 members in one shared workspace",
      "Shared credit pool",
      "Parallel generations: up to 16 videos, 16 images",
      "Priority support",
    ],
    unlimited: ["Seedance 2.0 Fast", "Seedance 2.0 Pro", "Kling 3.0", "GPT Image", "Nano Banana Pro"],
    freeGens: ["Seedream 4.0", "Flux 2 Pro", "Kling 3.0", "GPT Image"],
  },
];

const compareRows = [
  ["Concurrent Jobs", "1 concurrent job", "2 concurrent jobs", "6 concurrent jobs", "8 concurrent jobs", "16 concurrent jobs"],
  ["Seedance 2.0 720p", "—", "—", "533 videos", "1600 videos", "1600 videos"],
  ["Seedance 2.0 Fast 720p", "—", "48 videos", "685 videos", "2057 videos", "2057 videos"],
  ["Kling 3.0 720p", "—", "112 videos", "1600 videos", "4800 videos", "4800 videos"],
  ["All models", "—", "—", "—", "✓", "✓"],
  ["7-Day Unlimited", "—", "—", "Select", "Select", "All"],
  ["365-Day Unlimited", "—", "—", "—", "✓", "✓"],
  ["Team workspace", "—", "—", "—", "—", "✓"],
];

const faqs = [
  "How do credits work?",
  "Is my subscription automatically renewed?",
  "How many videos can I generate?",
  "How can I purchase extra credits?",
  "How does Unlimited work?",
  "How does 365-Day Unlimited promo work?",
  "Can I change my plan?",
];

function CheckIcon({ blue = false }) {
  return (
    <span className={`mt-[2px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${blue ? "text-blue-400" : "text-[#D7FF00]"}`}>
      ✓
    </span>
  );
}

function Pill({ children, blue = false }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.14em] ${blue ? "bg-blue-600 text-white" : "bg-[#D7FF00] text-black"}`}>
      {children}
    </span>
  );
}

function PlanCard({ plan }) {
  const isLime = plan.tone === "lime";
  const isBlue = plan.tone === "blue" || plan.tone === "business";

  return (
    <article
      className={[
        "relative flex min-h-[720px] flex-col overflow-hidden rounded-2xl border p-5 transition duration-300",
        "bg-[linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.018))]",
        isLime ? "border-[#D7FF00] shadow-[0_0_55px_rgba(215,255,0,.16)]" : "",
        isBlue ? "border-blue-500/80 shadow-[0_0_55px_rgba(37,99,235,.13)]" : "",
        !isLime && !isBlue ? "border-white/10" : "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        {isLime && <div className="absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-[#D7FF00]/10 blur-3xl" />}
        {isBlue && <div className="absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-blue-600/12 blur-3xl" />}
      </div>

      {plan.badge && (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <div className={`rounded-b-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-[.16em] ${isLime ? "bg-[#D7FF00] text-black" : "bg-blue-600 text-white"}`}>
            ✦ {plan.badge}
          </div>
        </div>
      )}

      <div className="relative z-10 pt-5">
        <h3 className={`text-sm font-black uppercase tracking-[.24em] ${isLime ? "text-[#D7FF00]" : isBlue ? "text-blue-400" : "text-white"}`}>
          {plan.name}
        </h3>
        <p className="mt-3 min-h-10 text-xs leading-5 text-white/45">{plan.subtitle}</p>
      </div>

      <div className="relative z-10 mt-5 rounded-xl border border-white/8 bg-black/35 p-3">
        <ul className="space-y-2 text-xs text-white/75">
          {plan.features.map((item) => (
            <li key={item} className="flex gap-2">
              <CheckIcon blue={isBlue} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mt-6">
        <div className="flex items-end gap-2">
          {plan.oldPrice && <span className="pb-1 text-xl font-black text-white/30 line-through">{plan.oldPrice}</span>}
          <span className="text-4xl font-black tracking-tight text-white">{plan.price}</span>
          <span className="pb-1 text-xs font-bold text-white/45">{plan.period}</span>
        </div>
        <p className="mt-1 text-[11px] text-white/45">{plan.billing}</p>
        {plan.highlight && <p className={`mt-1 text-[11px] font-black ${isBlue ? "text-blue-300" : "text-[#D7FF00]"}`}>{plan.highlight}</p>}
      </div>

      <Link
        href="/dashboard"
        className={[
          "relative z-10 mt-5 grid h-12 place-items-center rounded-xl text-xs font-black uppercase tracking-[.14em] no-underline transition",
          isLime ? "bg-[#D7FF00] text-black hover:bg-[#c7ef00]" : "",
          isBlue ? "bg-blue-600 text-white hover:bg-blue-500" : "",
          !isLime && !isBlue ? "bg-white/10 text-white hover:bg-white/15" : "",
        ].join(" ")}
      >
        {plan.button}
      </Link>

      <div className="relative z-10 mt-6 space-y-2">
        {plan.included.map((item) => (
          <div key={item} className="flex gap-2 text-xs leading-5 text-white/55">
            <CheckIcon blue={isBlue} />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-6 border-t border-white/8 pt-5">
        <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[.15em] text-white/30">
          <span>7-Day Unlimited</span>
          <span>Learn more</span>
        </div>
        <div className="space-y-2">
          {plan.unlimited.map((item) => (
            <div key={item} className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-black/25 px-3 py-2 text-xs text-white/55">
              <span>{item}</span>
              <span className="rounded-full bg-[#D7FF00] px-2 py-0.5 text-[9px] font-black text-black">UNLIMITED</span>
            </div>
          ))}
        </div>
      </div>

      {plan.freeGens.length > 0 && (
        <div className="relative z-10 mt-5">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[.15em] text-white/30">365-Day Unlimited & Free Gens</div>
          <div className="space-y-2">
            {plan.freeGens.map((item) => (
              <div key={item} className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-black/25 px-3 py-2 text-xs text-white/55">
                <span>{item}</span>
                <span className="rounded-full bg-[#D7FF00] px-2 py-0.5 text-[9px] font-black text-black">365</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(215,255,0,.10),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(37,99,235,.16),transparent_25%),linear-gradient(180deg,#050505,#080808_50%,#050505)]" />

      <header className="relative z-10 border-b border-white/8 bg-black/45 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <Image
              src="/nova/nova-logo-full.png"
              alt="NOVA"
              width={140}
              height={60}
              priority
              className="h-9 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-bold text-white/60 md:flex">
            <Link href="/dashboard" className="hover:text-white">Studio</Link>
            <Link href="/dashboard/models" className="hover:text-white">Models</Link>
            <Link href="/features" className="hover:text-white">Features</Link>
            <Link href="/pricing" className="text-[#D7FF00]">Pricing</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-xs font-bold text-white/65 hover:text-white sm:block">Log in</Link>
            <Link href="/dashboard" className="rounded-xl bg-[#D7FF00] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-black no-underline hover:bg-[#c7ef00]">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1500px] px-5 pt-8">
        <div className="relative overflow-hidden rounded-[28px] border border-[#D7FF00]/25 bg-[linear-gradient(100deg,rgba(215,255,0,.12),rgba(255,255,255,.035)_42%,rgba(37,99,235,.10))] p-6 shadow-[0_0_80px_rgba(215,255,0,.08)] md:p-9">
          <div className="absolute right-8 top-1/2 hidden h-44 w-44 -translate-y-1/2 rounded-[36px] border border-[#D7FF00]/20 bg-[#D7FF00]/10 shadow-[0_0_90px_rgba(215,255,0,.35)] rotate-12 md:block" />
          <div className="absolute right-20 top-14 hidden text-5xl text-[#D7FF00] md:block">✦</div>
          <div className="absolute right-52 bottom-12 hidden text-4xl text-[#D7FF00] md:block">✦</div>

          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <Pill>Limited Time</Pill>
              <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
                Create without limits. Save more.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                Get <span className="font-black text-[#D7FF00]">30% OFF</span> on annual NOVA plans — including high limits, premium models and Unlimited video generation.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-bold text-white/65">✦ Unlimited generations</div>
                <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-bold text-white/65">✓ Cancel anytime</div>
              </div>
            </div>

            <Link href="#plans" className="w-fit rounded-2xl bg-[#D7FF00] px-7 py-4 text-xs font-black uppercase tracking-[.14em] text-black no-underline hover:bg-[#c7ef00]">
              30% Off Annual Plans
            </Link>
          </div>
        </div>
      </section>

      <section id="plans" className="relative z-10 mx-auto max-w-[1500px] px-5 py-14">
        <div className="text-center">
          <h2 className="text-4xl font-black uppercase tracking-tight md:text-5xl">Pick your plan</h2>
          <p className="mt-3 text-sm text-white/40">Scale creativity with higher limits, priority access, and early features</p>

          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[.035] px-4 py-2 text-xs text-white/45">
            <span>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative h-6 w-11 rounded-full transition ${annual ? "bg-[#D7FF00]" : "bg-white/20"}`}
              aria-label="Toggle annual billing"
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full transition ${annual ? "left-6 bg-black" : "left-1 bg-white"}`} />
            </button>
            <span className="font-bold text-white">Annual</span>
            <Pill>30% Off</Pill>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-4xl text-center text-[11px] leading-5 text-white/30">
          Prices exclude VAT and local taxes, calculated at checkout. Unlimited usage may be subject to dynamic speed adjustments during high-traffic periods.
        </p>
      </section>

      <section className="relative z-10 mx-auto grid max-w-[1500px] gap-6 px-5 pb-16 lg:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02))] p-7 md:p-9">
          <h2 className="max-w-2xl text-2xl font-black uppercase leading-tight md:text-3xl">
            Enterprise AI video infrastructure for teams that produce at scale
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
            Tailored workflows, dedicated support, seamless onboarding, full control at scale, and no training on your data.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              ["🛡️", "Security & Compliance", "Your data is never used for model training. SOC 2 Type II in progress."],
              ["🗄️", "Data & usage rights", "You retain all rights in every AI generated output."],
              ["⚙️", "SSO & admin control", "Set and manage roles and permissions from one dashboard."],
            ].map(([icon, title, text]) => (
              <div key={title} className="rounded-2xl border border-white/8 bg-black/25 p-5">
                <div className="mb-4 text-xl">{icon}</div>
                <h3 className="text-sm font-black">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-white/40">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02))] p-7 md:p-9">
          <p className="text-xs font-black uppercase tracking-[.18em] text-white/35">Everything on Business Plan and...</p>

          <ul className="mt-5 space-y-3 text-sm text-white/70">
            {[
              "Unlimited members",
              "Custom credit amount",
              "Dedicated model capacity",
              "Access to all models on the platform",
              "Volume-based discounts at the best rates",
              "Priority queue for faster task processing",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Link href="/contact" className="mt-7 grid h-12 w-full place-items-center rounded-xl bg-white text-xs font-black uppercase tracking-[.15em] text-black no-underline">
            Contact Sales
          </Link>
          <Link href="/enterprise" className="mt-3 grid h-12 w-full place-items-center rounded-xl bg-white/10 text-xs font-black uppercase tracking-[.15em] text-white no-underline">
            Learn More
          </Link>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1500px] px-5 py-12">
        <h2 className="text-center text-4xl font-black uppercase tracking-tight">Compare Plans</h2>

        <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-black/20">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-6 border-b border-white/8 bg-white/[.03] text-xs font-black uppercase tracking-[.14em] text-white/45">
                <div className="p-4">Annual 30% Off</div>
                {["Free", "Basic", "Plus", "Ultra", "Business"].map((head) => (
                  <div key={head} className="p-4 text-center">
                    <div className={head === "Plus" ? "text-[#D7FF00]" : head === "Business" ? "text-blue-400" : "text-white/65"}>{head}</div>
                    <Link href="/dashboard" className="mt-3 inline-block rounded-lg bg-white/10 px-4 py-2 text-[10px] text-white no-underline hover:bg-white/15">
                      Get Plan
                    </Link>
                  </div>
                ))}
              </div>

              <div className="bg-white/[.025] px-4 py-3 text-xs font-black uppercase tracking-[.14em] text-white/50">Video</div>

              {compareRows.map((row) => (
                <div key={row[0]} className="grid grid-cols-6 border-b border-white/6 text-sm text-white/55 last:border-b-0">
                  {row.map((cell, index) => (
                    <div
                      key={`${row[0]}-${index}`}
                      className={[
                        "p-4",
                        index === 0 ? "font-bold text-white/70" : "text-center",
                        cell === "✓" ? "font-black text-[#D7FF00]" : "",
                        index === 3 && cell !== "—" && index !== 0 ? "font-black text-[#D7FF00]" : "",
                      ].join(" ")}
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button className="rounded-xl border border-white/15 px-7 py-3 text-xs font-black uppercase tracking-[.15em] text-white hover:bg-white/10">
            Compare Features
          </button>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-5 py-12">
        <h2 className="text-center text-3xl font-black tracking-tight md:text-4xl">Frequently Asked Questions</h2>

        <div className="mt-8 space-y-3">
          {faqs.map((question, index) => (
            <div key={question} className="overflow-hidden rounded-xl border border-white/8 bg-white/[.035]">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-black text-white"
              >
                {question}
                <span className={`text-white/45 transition ${openFaq === index ? "rotate-180" : ""}`}>⌄</span>
              </button>

              {openFaq === index && (
                <p className="px-5 pb-5 text-sm leading-6 text-white/45">
                  NOVA plans are designed for AI video and image generation. Credits, Unlimited access and model availability may vary depending on the selected plan and model usage.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-[#D7FF00]/20 bg-[linear-gradient(100deg,rgba(215,255,0,.10),rgba(255,255,255,.035))] p-7 text-center">
          <p className="text-sm text-white/40">Are you ready?</p>
          <h3 className="mt-2 text-2xl font-black">Ready to create without limits?</h3>
          <Link href="/dashboard" className="mt-5 inline-block rounded-xl bg-[#D7FF00] px-8 py-4 text-xs font-black uppercase tracking-[.16em] text-black no-underline hover:bg-[#c7ef00]">
            Choose your plan
          </Link>
        </div>
      </section>

      <div className="fixed bottom-5 right-5 z-30 hidden w-[290px] rounded-2xl border border-[#D7FF00]/45 bg-black/95 p-4 shadow-[0_0_50px_rgba(215,255,0,.22)] backdrop-blur-xl md:block">
        <div className="mb-2 flex items-center justify-between">
          <Pill>30% Off</Pill>
          <span className="text-white/35">×</span>
        </div>
        <p className="text-lg font-black leading-tight">Save 30% on Annual Plans</p>
        <p className="mt-2 text-xs leading-5 text-white/45">Unlimited video, more power, better value.</p>
        <Link href="#plans" className="mt-4 grid h-10 place-items-center rounded-xl bg-[#D7FF00] text-xs font-black uppercase text-black no-underline">
          Claim 30% Off →
        </Link>
      </div>

      <Footer />
    </main>
  );
}
