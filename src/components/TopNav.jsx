"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/product-ad-generator", label: "Ad Generator" },
  { href: "/dashboard/models",     label: "Models" },
  { href: "/pricing",              label: "Pricing" },
  { href: "/dashboard",            label: "Dashboard" },
];

export default function TopNav() {
  const path = usePathname();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[#050505]/90 backdrop-blur-xl px-6"
         style={{height:"72px",display:"flex",alignItems:"center"}}>
      <div className="w-full flex items-center justify-between gap-6">

        <Link href="/" className="flex-shrink-0">
          <img
            src="/nova/nova-logo-full.png"
            alt="NOVA"
            style={{height:"48px",width:"auto",objectFit:"contain",display:"block"}}
          />
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1">
          {LINKS.map(({ href, label }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className={"px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition no-underline " +
                  (active ? "bg-[#D7FF00] text-black" : "text-white/40 hover:text-white hover:bg-white/5")}>
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/pricing"
            className="hidden md:block text-xs font-bold text-white/40 hover:text-white transition no-underline px-3 py-2">
            Plans from $5/mo
          </Link>
          <Link href="/dashboard"
            className="flex-shrink-0 bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-[#c8f000] transition no-underline">
            Start Free →
          </Link>
        </div>

      </div>
    </nav>
  );
}