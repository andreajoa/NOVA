"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/",                    label: "Home"       },
  { href: "/dashboard",           label: "Dashboard"  },
  { href: "/dashboard/generate",  label: "Generate"   },
  { href: "/dashboard/models",    label: "Models"     },
  { href: "/pricing",             label: "Pricing"    },
  { href: "/dashboard/brandkit",  label: "Brand Kit"  },
  { href: "/dashboard/settings",  label: "Settings"   },
];

export default function TopNav() {
  const path = usePathname();
  if (path.startsWith("/dashboard")) return null;
  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:50,
      height:"76px", display:"flex", alignItems:"center",
      background:"rgba(5,5,5,0.92)", backdropFilter:"blur(20px)",
      borderBottom:"1px solid rgba(255,255,255,0.07)",
      padding:"0 24px",
    }}>
      <div style={{width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8}}>

        {/* LOGO */}
        <Link href="/" style={{flexShrink:0, textDecoration:"none"}}>
          <img
            src="/nova/nova-logo-full.png"
            alt="NOVA"
            style={{height:"56px", width:"auto", objectFit:"contain", display:"block"}}
          />
        </Link>

        {/* LINKS */}
        <div style={{display:"flex", alignItems:"center", gap:4}}>
          {LINKS.filter(l=>l.href !== "/").map(({href, label}) => {
            const active = path === href || (href !== "/dashboard" && href !== "/" && path.startsWith(href));
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
        </div>

        {/* CTA */}
        <Link href="/dashboard" style={{
          textDecoration:"none",
          background:"#D7FF00",
          color:"#000",
          fontSize:"11px",
          fontWeight:900,
          letterSpacing:"0.12em",
          textTransform:"uppercase",
          padding:"8px 18px",
          borderRadius:"8px",
          flexShrink:0,
          whiteSpace:"nowrap",
        }}>
          Start Free →
        </Link>
      </div>
    </nav>
  );
}