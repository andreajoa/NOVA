"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
];

export default function TopNav() {
  const path = usePathname();
  if (path.startsWith("/dashboard")) return null;

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      height: "76px", display: "flex", alignItems: "center",
      background: "rgba(5,5,5,0.92)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      padding: "0 24px",
    }}>
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Link href="/" style={{ flexShrink: 0, textDecoration: "none" }}>
          <img
            src="/nova/nova-logo-full.png"
            alt="NOVA"
            style={{ height: "56px", width: "auto", objectFit: "contain", display: "block" }}
          />
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {LINKS.filter(l => l.href !== "/").map(({ href, label }) => {
            const active = path === href || (href !== "/" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  textDecoration: "none",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  transition: "all 0.15s",
                  background: active ? "#D7FF00" : "transparent",
                  color: active ? "#000" : "rgba(255,255,255,0.45)",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/sign-in" style={{
            textDecoration: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.85)",
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.14)"
          }}>
            Sign In
          </Link>

          <Link href="/sign-up" style={{
            textDecoration: "none",
            background: "#D7FF00",
            color: "#000",
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "8px 18px",
            borderRadius: "8px",
          }}>
            Sign Up
          </Link>

          <div style={{ display: "flex", alignItems: "center" }}>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9",
                  userButtonTrigger: "focus:shadow-none",
                },
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
