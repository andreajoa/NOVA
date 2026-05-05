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
        const url =
          typeof input === "string"
            ? input
            : input?.url || "";

        if (response.status === 402 && String(url).includes("/api/generate")) {
          const data = await response.clone().json();

          if (data?.code === "INSUFFICIENT_CREDITS") {
            setPaywall(data);
          }
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

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/80 px-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#D7FF00]/40 bg-[#070707] p-6 shadow-[0_0_80px_rgba(215,255,0,.18)] md:p-8">
        <button
          onClick={() => setPaywall(null)}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/45 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          ×
        </button>

        <div className="mb-5 inline-flex rounded-full bg-[#D7FF00] px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-black">
          Upgrade Required
        </div>

        <h2 className="text-3xl font-black uppercase tracking-tight text-white">
          Your starter credits are not enough
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/50">
          NOVA video generation uses{" "}
          <span className="font-black text-[#D7FF00]">
            {paywall.creditsPerSecond} credits per second
          </span>
          . This generation needs{" "}
          <span className="font-black text-white">{paywall.creditsRequired} credits</span>,
          and you currently have{" "}
          <span className="font-black text-white">{paywall.currentCredits} credits</span>.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <a
            href={annualHref}
            className="rounded-2xl bg-[#D7FF00] px-5 py-5 text-black no-underline transition hover:bg-[#c8f000]"
          >
            <div className="text-xs font-black uppercase tracking-[.16em]">Best value</div>
            <div className="mt-2 text-2xl font-black">$5/mo</div>
            <div className="mt-1 text-xs font-bold text-black/60">Billed annually</div>
          </a>

          <a
            href={monthlyHref}
            className="rounded-2xl border border-white/10 bg-white/[.04] px-5 py-5 text-white no-underline transition hover:bg-white/[.08]"
          >
            <div className="text-xs font-black uppercase tracking-[.16em] text-white/40">Monthly</div>
            <div className="mt-2 text-2xl font-black">$7/mo</div>
            <div className="mt-1 text-xs font-bold text-white/40">Cancel anytime</div>
          </a>
        </div>

        <p className="mt-5 text-xs leading-5 text-white/30">
          Your account includes 10 starter credits, but video generation requires more credits because it is charged by duration.
        </p>
      </div>
    </div>
  );
}
