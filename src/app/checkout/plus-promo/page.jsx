"use client";
import { useState } from "react";
import Link from "next/link";

export default function PlusPromoCheckout() {
  const [annual, setAnnual] = useState(true);
  const price = annual ? "23.80" : "27.20";
  const orig  = annual ? "34"    : "34";

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">

        {/* Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
            ⚡ Exclusive 30% OFF
          </span>
        </div>

        <h1 className="text-4xl font-black uppercase tracking-tight text-center mb-2">
          Nova Plus
        </h1>
        <p className="text-white/40 text-center text-sm mb-8">
          This offer expires soon — lock in your discount now.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button onClick={() => setAnnual(false)}
            className={"text-sm font-black uppercase tracking-wider transition border-none bg-transparent cursor-pointer " + (!annual ? "text-white" : "text-white/30")}>
            Monthly
          </button>
          <button onClick={() => setAnnual(!annual)}
            className={"relative w-12 h-6 rounded-full transition-colors cursor-pointer border-none " + (annual ? "bg-[#D7FF00]" : "bg-white/20")}
            style={{outline:"none"}}>
            <span className={"absolute top-1 w-4 h-4 rounded-full bg-[#050505] transition-all " + (annual ? "left-7" : "left-1")} />
          </button>
          <button onClick={() => setAnnual(true)}
            className={"text-sm font-black uppercase tracking-wider transition border-none bg-transparent cursor-pointer " + (annual ? "text-white" : "text-white/30")}>
            Annual <span className="ml-1 text-[9px] bg-[#D7FF00] text-black px-2 py-0.5 rounded-full font-black">SAVE 30%</span>
          </button>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#D7FF00] bg-[#D7FF00]/5 p-8 mb-6 shadow-[0_0_60px_rgba(215,255,0,0.1)]">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#D7FF00] mb-1">Plus Plan</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black tracking-tighter">${price}</span>
                <span className="text-white/30 text-sm mb-1">/mo</span>
              </div>
              <p className="text-white/30 text-xs mt-1">
                <span className="line-through">${orig}/mo</span>
                <span className="ml-2 text-[#D7FF00] font-bold">30% discount applied</span>
              </p>
            </div>
            <span className="bg-[#D7FF00] text-black text-[10px] font-black uppercase px-2 py-1 rounded-lg">PROMO</span>
          </div>

          <div className="space-y-3 mb-6">
            {[
              "500 credits / month",
              "Access to ALL models",
              "Up to 4 concurrent generations",
              "7-Day Unlimited on select models",
              "Priority support",
              "MP4 download",
            ].map((f,i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                <span className="text-[#D7FF00]">✓</span>{f}
              </div>
            ))}
          </div>

          <button className="w-full bg-[#D7FF00] text-black font-black uppercase tracking-wider py-4 rounded-xl hover:bg-[#c8f000] transition text-sm">
            Subscribe Now — ${price}/mo →
          </button>
        </div>

        <p className="text-center text-white/20 text-xs">
          Cancel anytime · No hidden fees ·{" "}
          <Link href="/pricing" className="text-white/40 hover:text-white underline">See all plans</Link>
        </p>

      </div>
    </main>
  );
}