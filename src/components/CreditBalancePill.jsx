"use client";

import { useEffect, useState } from "react";

export default function CreditBalancePill() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadCredits() {
      try {
        const res = await fetch("/api/me/credits", { cache: "no-store" });
        if (!res.ok) return;

        const json = await res.json();
        if (active) setData(json);
      } catch {}
    }

    loadCredits();

    window.addEventListener("focus", loadCredits);

    return () => {
      active = false;
      window.removeEventListener("focus", loadCredits);
    };
  }, []);

  if (!data) return null;

  return (
    <a
      href="/pricing"
      className="inline-flex items-center rounded-xl border border-[#D7FF00]/40 bg-[#D7FF00]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[.12em] text-[#D7FF00] no-underline transition hover:bg-[#D7FF00] hover:text-black"
      title={`${data.credits} credits available`}
    >
      {data.credits} credits
    </a>
  );
}
