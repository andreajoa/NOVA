"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard",          label: "Dashboard"  },
  { href: "/dashboard/characters", label: "Characters" },
  { href: "/dashboard/generate", label: "Generate"   },
  { href: "/dashboard/models",   label: "Models"     },
  { href: "/pricing",            label: "Pricing"    },
  { href: "/claude", label: "Claude AI" },
  { href: "/dashboard/brandkit", label: "Brand Kit"  },
  { href: "/dashboard/settings", label: "Settings"   },
];

export default function DashboardTopBar() {
  const path = usePathname();
  return (
    <header style={{
      height:"64px", flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 24px",
      borderBottom:"1px solid rgba(255,255,255,0.07)",
      background:"#050505",
    }}>
      {/* Logo */}
      <Link href="/" style={{flexShrink:0, textDecoration:"none"}}>
        <img
          src="/nova/logo-nova.jpeg"
          alt="NOVA"
          style={{height:"52px", width:"auto", objectFit:"contain", display:"block"}}
        />
      </Link>

      {/* Links */}
      <nav style={{display:"flex", alignItems:"center", gap:4}}>
        {LINKS.map(({href, label}) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link key={href} href={href} style={{
              textDecoration:"none",
              padding:"6px 12px",
              borderRadius:"8px",
              fontSize:"11px",
              fontWeight:700,
              letterSpacing:"0.1em",
              textTransform:"uppercase",
              transition:"all 0.15s",
              background: active ? "#D7FF00" : "transparent",
              color: active ? "#000" : "rgba(255,255,255,0.45)",
            }}>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{display:"flex", alignItems:"center", gap:12, flexShrink:0}}>
        <span style={{fontSize:"11px", color:"rgba(255,255,255,0.3)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em"}}>nova studio</span>
        <div style={{
          width:32, height:32, borderRadius:"50%",
          background:"#D7FF00", color:"#000",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"12px", fontWeight:900,
        }}>N</div>
      </div>
    </header>
  );
}
