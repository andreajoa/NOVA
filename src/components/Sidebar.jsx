"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard",           label: "Dashboard",  icon: "⊞" },
  { href: "/dashboard/generate",  label: "Generate",   icon: "✦" },
  { href: "/dashboard/projects",  label: "Projects",   icon: "◫" },
  { href: "/dashboard/templates", label: "Templates",  icon: "❑" },
  { href: "/dashboard/models",    label: "Models",     icon: "◈" },
  { href: "/dashboard/brandkit",  label: "Brand Kit",  icon: "◉" },
  { href: "/dashboard/settings",  label: "Settings",   icon: "⊙" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="flex h-full w-[260px] flex-shrink-0 flex-col border-r border-white/8 bg-[#0A0A0A]">

      {/* LOGO */}
      <div className="px-5 pt-6 pb-5 border-b border-white/8">
        <Link href="/">
          <img
            src="/nova/nova-logo-full.png"
            alt="NOVA"
            style={{ height: "52px", width: "auto", objectFit: "contain", display: "block" }}
          />
        </Link>
      </div>

      {/* NAV */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href || (href !== "/dashboard" && href !== "/" && path.startsWith(href));
          return (
            <Link key={href} href={href} className="block no-underline">
              <div className={[
                "mx-3 my-0.5 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all flex items-center gap-3",
                active
                  ? "bg-[#D7FF00] text-black"
                  : "text-white/50 hover:text-white hover:bg-white/5",
              ].join(" ")}>
                <span className="text-base leading-none">{icon}</span>
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* CREDITS */}
      <div className="mx-3 mb-3 p-4 rounded-xl bg-[#D7FF00]/10 border border-[#D7FF00]/20">
        <p className="text-[#D7FF00] text-sm font-black">500 credits</p>
        <p className="text-white/40 text-xs mt-0.5">Free Plan</p>
        <Link href="/pricing" className="mt-2 block text-xs text-[#D7FF00]/70 hover:text-[#D7FF00] transition no-underline font-bold">
          Upgrade →
        </Link>
      </div>

      {/* AVATAR */}
      <div className="px-4 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#D7FF00] flex items-center justify-center text-black text-xs font-black flex-shrink-0">N</div>
          <span className="text-white/30 text-xs truncate">nova studio</span>
        </div>
      </div>

    </aside>
  );
}