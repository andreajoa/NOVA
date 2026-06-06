"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CreditBalanceCard from "@/components/CreditBalanceCard";

const items = [
  { href: "/dashboard/viral-templates",   label: "Templates",    icon: "✦" },
  { href: "/dashboard",                   label: "Dashboard",    icon: "▦" },
  { href: "/claude",                      label: "Claude AI",    icon: "◇" },
  { href: "/dashboard/models",            label: "Imagem",       icon: "⬛" },
  { href: "/dashboard/generate",          label: "Vídeo",        icon: "▶" },
  { href: "/dashboard/characters",       label: "Characters",   icon: "◎" },
  { href: "/dashboard/talking-avatar",   label: "Talking Avatar", icon: "◉" },
  { href: "/dashboard/long-video",       label: "Long Video",    icon: "▤" },
  { href: "/dashboard/video-tools",      label: "Extend Video",  icon: "➜" },
  { href: "/dashboard/templates",         label: "UGC",          icon: "✦" },
  { href: "/dashboard/landing-page", label: "Landing Page", icon: "▣" },
  { href: "/dashboard/claude-connect", label: "Claude Connect", icon: "⌁" },
  { href: "/dashboard/brandkit",          label: "Brand Kit",    icon: "◎" },
  { href: "/dashboard/projects",          label: "Projetos",     icon: "▣" },
  { href: "/dashboard/uploads",           label: "Uploads",      icon: "↑" },
  { href: "/dashboard/settings/api-keys", label: "API",          icon: "⊙" },
  { href: "/dashboard/settings",          label: "Settings",     icon: "≡" },
];

const mobileItems = [
  { href: "/dashboard",          label: "Home",   icon: "▦" },
  { href: "/dashboard/generate", label: "Video",  icon: "▶" },
  { href: "/dashboard/talking-avatar", label: "Avatar", icon: "◉" },
  { href: "/dashboard/viral-templates", label: "Templates", icon: "✦" },
];

const mobileMoreItems = [
  { href: "/dashboard/long-video", label: "Long Video", icon: "▤" },
  { href: "/dashboard/video-tools", label: "Extend Video", icon: "➜" },
  { href: "/dashboard/characters", label: "Characters", icon: "◎" },
  { href: "/dashboard/models", label: "Images", icon: "⬛" },
  { href: "/dashboard/templates", label: "UGC", icon: "✦" },
  { href: "/dashboard/landing-page", label: "Landing Page", icon: "▣" },
  { href: "/dashboard/brandkit", label: "Brand Kit", icon: "◎" },
  { href: "/dashboard/projects", label: "Projects", icon: "▣" },
  { href: "/dashboard/uploads", label: "Uploads", icon: "↑" },
  { href: "/claude", label: "Claude AI", icon: "◇" },
  { href: "/dashboard/claude-connect", label: "Claude Connect", icon: "⌁" },
  { href: "/dashboard/settings/api-keys", label: "API", icon: "⊙" },
  { href: "/dashboard/settings", label: "Settings", icon: "≡" },
];

export default function Sidebar() {
  const pathname = usePathname() || "/dashboard";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#050505] lg:flex">
        <div className="flex h-24 items-center border-b border-white/10 px-7">
          <Link href="/dashboard" className="no-underline">
            <img src="/nova/logo-nova.jpeg" alt="NOVA" className="hidden" />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {items.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-black no-underline transition",
                  active
                    ? "bg-[#D7FF00] text-black"
                    : "text-white/45 hover:bg-white/[.04] hover:text-white",
                ].join(" ")}
              >
                <span className="w-5 text-center text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <CreditBalanceCard />

        <div className="border-t border-white/10 px-5 py-5 text-xs text-white/25">
          nova studio
        </div>
      </aside>

      {/* Mobile all-tools drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute bottom-[76px] left-3 right-3 max-h-[70vh] overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[#050505] p-3 shadow-[0_0_80px_rgba(215,255,0,.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">All tools</p>
              <button onClick={() => setMobileOpen(false)} className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/50">
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {mobileMoreItems.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "rounded-2xl border px-3 py-3 no-underline transition",
                      active
                        ? "border-[#D7FF00] bg-[#D7FF00] text-black"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white",
                    ].join(" ")}
                  >
                    <span className="block text-lg">{item.icon}</span>
                    <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.12em]">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#050505]/95 backdrop-blur-md lg:hidden" style={{paddingBottom:"env(safe-area-inset-bottom)"}}>
        {mobileItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-col items-center gap-1 px-1 py-3 no-underline transition",
                active ? "text-[#D7FF00]" : "text-white/35 hover:text-white",
              ].join(" ")}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-1 px-1 py-3 text-white/35 transition hover:text-white"
        >
          <span className="text-lg leading-none">☰</span>
          <span className="text-[8px] font-black uppercase tracking-wider">More</span>
        </button>
      </nav>
    </>
  );
}
