"use client";

import { useEffect, useState } from "react";

export default function CreditBalancePill() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null,
  });

  useEffect(() => {
    let active = true;

    async function loadCredits() {
      try {
        const res = await fetch("/api/me/credits", {
          cache: "no-store",
          credentials: "include",
        });

        const text = await res.text();
        let json = null;

        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }

        if (!res.ok) {
          throw new Error(json?.error || text || `Credits request failed: ${res.status}`);
        }

        if (active) {
          setState({
            loading: false,
            error: "",
            data: json,
          });
        }
      } catch (error) {
        if (active) {
          setState({
            loading: false,
            error: error?.message || "Credits unavailable",
            data: null,
          });
        }
      }
    }

    loadCredits();

    window.addEventListener("focus", loadCredits);
    window.addEventListener("nova:credits-refresh", loadCredits);

    return () => {
      active = false;
      window.removeEventListener("focus", loadCredits);
      window.removeEventListener("nova:credits-refresh", loadCredits);
    };
  }, []);

  if (state.loading) {
    return (
      <span className="inline-flex items-center rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-[11px] font-black uppercase tracking-[.12em] text-white/45">
        Credits...
      </span>
    );
  }

  if (state.error) {
    return (
      <a
        href="/dashboard/settings"
        className="inline-flex items-center rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[.12em] text-red-200 no-underline transition hover:bg-red-500/20"
        title={state.error}
      >
        Credits error
      </a>
    );
  }

  return (
    <a
      href="/pricing"
      className="inline-flex items-center rounded-xl border border-[#D7FF00]/40 bg-[#D7FF00]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[.12em] text-[#D7FF00] no-underline transition hover:bg-[#D7FF00] hover:text-black"
      title={`${state.data.credits} credits available`}
    >
      {state.data.credits} credits
    </a>
  );
}
