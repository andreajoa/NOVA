"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PromoPopup() {
  const pathname = usePathname() || "/";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem("nova_promo_popup_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Não mostrar popup em dashboard/logado trabalhando.
  if (pathname.startsWith("/dashboard")) return null;
  if (!visible) return null;

  function close() {
    setVisible(false);
    try {
      window.localStorage.setItem("nova_promo_popup_dismissed", "1");
    } catch {}
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90] w-[300px] rounded-2xl border border-[#D7FF00]/45 bg-black/95 p-4 shadow-[0_0_50px_rgba(215,255,0,.28)] backdrop-blur-xl">
      <button
        onClick={close}
        className="absolute right-3 top-2 text-sm text-white/35 transition hover:text-white"
        aria-label="Close promotion"
      >
        ×
      </button>

      <div className="mb-2 inline-flex rounded-full bg-[#D7FF00] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.14em] text-black">
        30% Off
      </div>

      <p className="text-base font-black leading-tight text-white">
        Save 30% on Annual Plans
      </p>

      <p className="mt-2 text-xs leading-5 text-white/45">
        Unlimited video, more power, better value.
      </p>

      <a
        href="/pricing"
        className="mt-4 grid h-10 place-items-center rounded-xl bg-[#D7FF00] text-xs font-black uppercase tracking-[.12em] text-black no-underline transition hover:bg-[#c8f000]"
      >
        Claim 30% Off →
      </a>
    </div>
  );
}
