"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CreditBalanceCard from "@/components/CreditBalanceCard";

const items = [
  { href: "/dashboard",                   label: "Dashboard",    icon: "▦" },
  { href: "/claude",                      label: "Claude AI",    icon: "◇" },
  { href: "/dashboard/models",            label: "Imagem",       icon: "⬛" },
  { href: "/dashboard/generate",          label: "Vídeo",        icon: "▶" },
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
  { href: "/claude",             label: "Claude", icon: "◇" },
  { href: "/dashboard/models",   label: "Imagem", icon: "⬛" },
  { href: "/dashboard/generate", label: "Vídeo",  icon: "▶" },
  { href: "/dashboard/templates",label: "UGC",    icon: "✦" },
  { href: "/dashboard/settings", label: "Config", icon: "≡" },
];

export default function Sidebar() {
  const pathname = usePathname() || "/dashboard";

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

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 bg-[#050505]/95 backdrop-blur-md pb-safe lg:hidden" style={{paddingBottom:"env(safe-area-inset-bottom)"}}>
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
                "flex flex-col items-center gap-1 px-3 py-3 no-underline transition",
                active ? "text-[#D7FF00]" : "text-white/35 hover:text-white",
              ].join(" ")}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
