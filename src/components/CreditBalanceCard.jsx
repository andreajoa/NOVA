"use client";

import { useEffect, useState } from "react";

export default function CreditBalanceCard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/me/credits", { cache: "no-store" });
        if (!res.ok) return;

        const json = await res.json();
        if (active) setData(json);
      } catch {}
    }

    load();

    window.addEventListener("focus", load);
    return () => {
      active = false;
      window.removeEventListener("focus", load);
    };
  }, []);

  if (!data) {
    return (
      <div className="m-4 rounded-2xl border border-white/10 bg-white/[.03] p-4 text-xs text-white/35">
        Loading credits...
      </div>
    );
  }

  return (
    <div className="m-4 rounded-2xl border border-[#D7FF00]/30 bg-[#D7FF00]/10 p-4">
      <p className="text-lg font-black text-[#D7FF00]">{data.credits} credits</p>
      <p className="mt-1 text-xs font-bold capitalize text-white/45">{data.plan} account</p>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] leading-5 text-white/40">
          Video generation uses{" "}
          <span className="font-black text-[#D7FF00]">
            {data.videoCreditsPerSecond} credits/sec
          </span>
          .
        </p>
        <p className="mt-1 text-[11px] leading-5 text-white/30">
          A {data.defaultVideoSeconds}s video needs {data.defaultVideoCost} credits.
        </p>
      </div>

      <a
        href="/pricing"
        className="mt-4 inline-flex text-xs font-black text-[#D7FF00] no-underline hover:text-white"
      >
        Upgrade →
      </a>
    </div>
  );
}
