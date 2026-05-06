"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CreditBalanceCard from "@/components/CreditBalanceCard";

const items = [
  { href: "/dashboard",                  label: "Dashboard",    icon: "▦" },
  { href: "/dashboard/models",           label: "Gerar Imagem", icon: "⬛" },
  { href: "/dashboard/generate",         label: "Gerar Vídeo",  icon: "▶" },
  { href: "/dashboard/templates",        label: "UGC Produto",  icon: "✦" },
  { href: "/dashboard/brandkit",         label: "Brand Kit",    icon: "◎" },
  { href: "/dashboard/projects",         label: "Projetos",     icon: "▣" },
  { href: "/dashboard/uploads",          label: "Uploads",      icon: "↑" },
  { href: "/dashboard/settings/api-keys",label: "API",          icon: "⊙" },
  { href: "/dashboard/settings",         label: "Settings",     icon: "≡" },
];

export default function Sidebar() {
  const pathname = usePathname() || "/dashboard";

  return (
    <aside className="hidden h-full w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#050505] lg:flex">
      <div className="flex h-24 items-center border-b border-white/10 px-7">
        <Link href="/dashboard" className="no-underline">
          <img src="/nova/logo-nova.jpeg" alt="NOVA" className="h-9 w-auto object-contain" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
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
  );
}
