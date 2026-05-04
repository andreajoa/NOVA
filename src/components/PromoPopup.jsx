"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function PromoPopup() {
  const [open, setOpen] = useState(true);
  const [mins, setMins] = useState(47);
  const [secs, setSecs] = useState(23);

  useEffect(() => {
    const t = setInterval(() => {
      setSecs(s => {
        if (s > 0) return s - 1;
        setMins(m => {
          if (m === 0) { clearInterval(t); return 0; }
          return m - 1;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] w-[280px] animate-slide-up">
      <div className="bg-[#0D0D0D] border border-[#D7FF00]/40 rounded-2xl p-4 shadow-[0_8px_40px_rgba(215,255,0,0.15)]">
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-white/30 hover:text-white text-lg leading-none bg-transparent border-none cursor-pointer"
        >×</button>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider bg-[#D7FF00] text-black px-2 py-0.5 rounded-full">
            ⚡ 30% OFF
          </span>
          <span className="text-white/40 text-[10px]">Limited offer</span>
        </div>

        <p className="text-white font-black text-sm leading-tight mb-1">
          Get Plus for just <span className="text-[#D7FF00]">$23.80/mo</span>
        </p>
        <p className="text-white/40 text-xs mb-3">
          500 credits · All models · 7-Day Unlimited
        </p>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-white/30 text-[10px]">Expires in</span>
          <span className="font-black text-[#D7FF00] text-sm tabular-nums">
            {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
          </span>
        </div>

        <Link href="/checkout/plus-promo"
          className="block w-full text-center bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider py-2.5 rounded-xl hover:bg-[#c8f000] transition no-underline">
          Claim 30% OFF →
        </Link>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.4s ease forwards; }
      `}</style>
    </div>
  );
}