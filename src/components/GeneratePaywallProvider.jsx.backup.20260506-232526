"use client";

import { useEffect, useState } from "react";

export default function GeneratePaywallProvider() {
  const [paywall, setPaywall] = useState(null);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      try {
        const input = args[0];
        const url = typeof input === "string" ? input : input?.url || "";

        if (response.status === 402 && String(url).includes("/api/generate")) {
          const data = await response.clone().json();
          if (data?.code === "INSUFFICIENT_CREDITS") setPaywall(data);
        }
      } catch {}

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!paywall) return null;

  const annualHref = paywall?.plans?.annual?.href || "/pricing?plan=basic&billing=annual";
  const monthlyHref = paywall?.plans?.monthly?.href || "/pricing?plan=basic&billing=monthly";

  const missing = Math.max(0, Number(paywall.creditsMissing || 0));
  const required = Number(paywall.creditsRequired || 120);
  const current = Number(paywall.currentCredits || 10);
  const seconds = Number(paywall.seconds || 5);
  const creditsPerSecond = Number(paywall.creditsPerSecond || 24);

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/85 px-4 py-4 backdrop-blur-md">
      <div className="relative w-full max-w-[720px] overflow-hidden rounded-[28px] border border-[#D7FF00]/45 bg-[#070707] p-5 shadow-[0_0_100px_rgba(215,255,0,.22)] sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#D7FF00]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-[#D7FF00]/10 blur-3xl" />

        <button
          onClick={() => setPaywall(null)}
          className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/40 text-white/45 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          ×
        </button>

        <div className="relative z-10">
          <div className="mb-3 inline-flex rounded-full bg-[#D7FF00] px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-black">
            Ready to render
          </div>

          <h2 className="max-w-2xl pr-10 text-[28px] font-black uppercase leading-[0.96] tracking-tight text-white sm:text-[38px] lg:text-[44px]">
            Don’t leave your AI video unfinished.
          </h2>

          <p className="mt-3 max-w-2xl text-xs leading-5 text-white/55 sm:text-sm">
            Your prompt is ready. NOVA calculated the render, but starter credits are only for exploring. Upgrade to unlock full video generation.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[.035] p-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">
                You have
              </p>
              <p className="mt-1 text-lg font-black text-white sm:text-2xl">{current}</p>
              <p className="text-[10px] text-white/30">credits</p>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">
                Needs
              </p>
              <p className="mt-1 text-lg font-black text-[#D7FF00] sm:text-2xl">{required}</p>
              <p className="text-[10px] text-white/30">credits</p>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">
                Missing
              </p>
              <p className="mt-1 text-lg font-black text-white sm:text-2xl">{missing}</p>
              <p className="text-[10px] text-white/30">credits</p>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-5 text-white/35 sm:text-xs">
            Video uses {creditsPerSecond} credits/sec. A {seconds}s video needs {required} credits. Upgrade now and continue from where you stopped.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <a
              href={annualHref}
              className="group rounded-2xl bg-[#D7FF00] px-4 py-4 text-black no-underline transition hover:bg-[#c8f000]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-black uppercase tracking-[.16em]">
                  Best value
                </div>
                <div className="rounded-full bg-black px-2 py-1 text-[9px] font-black uppercase text-[#D7FF00]">
                  Annual
                </div>
              </div>

              <div className="mt-2 text-3xl font-black">$5/mo</div>
              <div className="mt-1 text-[11px] font-bold leading-4 text-black/60">
                Billed annually. Unlock video generation.
              </div>

              <div className="mt-4 grid h-10 place-items-center rounded-xl bg-black text-[11px] font-black uppercase tracking-[.14em] text-white transition group-hover:scale-[1.01]">
                Unlock my video →
              </div>
            </a>

            <a
              href={monthlyHref}
              className="group rounded-2xl border border-white/10 bg-white/[.04] px-4 py-4 text-white no-underline transition hover:bg-white/[.08]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-black uppercase tracking-[.16em] text-white/40">
                  Flexible
                </div>
                <div className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-black uppercase text-white/50">
                  Monthly
                </div>
              </div>

              <div className="mt-2 text-3xl font-black">$7/mo</div>
              <div className="mt-1 text-[11px] font-bold leading-4 text-white/40">
                Pay monthly. Cancel anytime.
              </div>

              <div className="mt-4 grid h-10 place-items-center rounded-xl border border-white/10 bg-white text-[11px] font-black uppercase tracking-[.14em] text-black transition group-hover:scale-[1.01]">
                Start monthly →
              </div>
            </a>
          </div>

          <div className="mt-4 rounded-2xl border border-[#D7FF00]/20 bg-[#D7FF00]/5 p-3">
            <p className="text-[11px] leading-5 text-white/45 sm:text-xs">
              <span className="font-black text-[#D7FF00]">Next:</span>{" "}
              choose a plan, return to the studio, and render your video with the same workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
