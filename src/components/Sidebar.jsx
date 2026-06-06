"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CreditBalanceCard from "@/components/CreditBalanceCard";

const navGroups = [
  {
    label: null,
    items: [
      { href: "/dashboard",                    label: "Dashboard",     icon: "▦" },
      { href: "/dashboard/viral-templates",    label: "Templates",     icon: "✦" },
      { href: "/dashboard/projects",           label: "Projetos",      icon: "▣" },
    ],
  },
  {
    label: "CRIAR",
    items: [
      { href: "/dashboard/models",             label: "Imagem",        icon: "⬛" },
      { href: "/dashboard/generate",           label: "Vídeo",         icon: "▶" },
      { href: "/dashboard/templates",          label: "UGC",           icon: "✦" },
      { href: "/dashboard/landing-page",       label: "Landing Page",  icon: "▣" },
      { href: "/dashboard/music-video",        label: "Music Video",   icon: "♫" },
    ],
  },
  {
    label: "VÍDEO AVANÇADO",
    collapsible: true,
    items: [
      { href: "/dashboard/talking-avatar",     label: "Talking Avatar", icon: "◉" },
      { href: "/dashboard/video-tools",        label: "Extend Video",   icon: "➜" },
      { href: "/dashboard/long-video",         label: "Long Video",     icon: "▤" },
      { href: "/dashboard/story-studio",       label: "Story Studio",   icon: "◈" },
    ],
  },
  {
    label: "IA & FERRAMENTAS",
    collapsible: true,
    items: [
      { href: "/claude",                       label: "Claude AI",      icon: "◇" },
      { href: "/dashboard/claude-connect",     label: "Claude Connect", icon: "⌁" },
      { href: "/dashboard/creative-agent",     label: "Creative Agent", icon: "⚡" },
      { href: "/dashboard/characters",         label: "Characters",     icon: "◎" },
      { href: "/dashboard/brandkit",           label: "Brand Kit",      icon: "◎" },
    ],
  },
  {
    label: "CONTA",
    items: [
      { href: "/dashboard/uploads",            label: "Uploads",        icon: "↑" },
      { href: "/dashboard/settings/api-keys",  label: "API",            icon: "⊙" },
      { href: "/dashboard/settings",           label: "Settings",       icon: "≡" },
    ],
  },
];

const mobileItems = [
  { href: "/dashboard",          label: "Home",     icon: "▦" },
  { href: "/dashboard/generate", label: "Vídeo",    icon: "▶" },
  { href: "/dashboard/models",   label: "Imagem",   icon: "⬛" },
  { href: "/dashboard/projects", label: "Projetos", icon: "▣" },
];

const mobileDrawerGroups = [
  {
    label: "CRIAR",
    items: [
      { href: "/dashboard/templates",       label: "UGC",          icon: "✦" },
      { href: "/dashboard/landing-page",    label: "Landing Page", icon: "▣" },
      { href: "/dashboard/viral-templates", label: "Templates",    icon: "✦" },
      { href: "/dashboard/music-video",     label: "Music Video",  icon: "♫" },
    ],
  },
  {
    label: "VÍDEO AVANÇADO",
    items: [
      { href: "/dashboard/talking-avatar",  label: "Talking Avatar", icon: "◉" },
      { href: "/dashboard/video-tools",     label: "Extend Video",   icon: "➜" },
      { href: "/dashboard/long-video",      label: "Long Video",     icon: "▤" },
      { href: "/dashboard/story-studio",    label: "Story Studio",   icon: "◈" },
    ],
  },
  {
    label: "IA & FERRAMENTAS",
    items: [
      { href: "/claude",                    label: "Claude AI",      icon: "◇" },
      { href: "/dashboard/claude-connect",  label: "Claude Connect", icon: "⌁" },
      { href: "/dashboard/creative-agent",  label: "Creative Agent", icon: "⚡" },
      { href: "/dashboard/characters",      label: "Characters",     icon: "◎" },
      { href: "/dashboard/brandkit",        label: "Brand Kit",      icon: "◎" },
    ],
  },
  {
    label: "CONTA",
    items: [
      { href: "/dashboard/uploads",           label: "Uploads",  icon: "↑" },
      { href: "/dashboard/settings/api-keys", label: "API",      icon: "⊙" },
      { href: "/dashboard/settings",          label: "Settings", icon: "≡" },
    ],
  },
];

function isActive(href, pathname) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavGroup({ group, pathname }) {
  const hasActive = group.items.some((i) => isActive(i.href, pathname));
  const [open, setOpen] = useState(!group.collapsible || hasActive);

  return (
    <div className="mb-1">
      {group.label && (
        <button
          onClick={() => group.collapsible && setOpen((v) => !v)}
          className={[
            "flex w-full items-center justify-between px-4 pb-1 pt-3",
            group.collapsible ? "cursor-pointer" : "cursor-default",
          ].join(" ")}
        >
          <span className="text-[9px] font-black tracking-[0.2em] text-white/25">
            {group.label}
          </span>
          {group.collapsible && (
            <span
              className="text-[10px] text-white/20 transition-transform duration-200"
              style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              ›
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-black no-underline transition",
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
        </div>
      )}
    </div>
  );
}

function DrawerGroup({ group, pathname, onClose }) {
  return (
    <div className="mb-4">
      <p className="mb-2 px-1 text-[9px] font-black tracking-[0.2em] text-[#D7FF00]/60">
        {group.label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {group.items.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={[
                "rounded-2xl border px-3 py-3 no-underline transition",
                active
                  ? "border-[#D7FF00] bg-[#D7FF00] text-black"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white",
              ].join(" ")}
            >
              <span className="block text-lg">{item.icon}</span>
              <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.12em]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname() || "/dashboard";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="hidden h-full w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#050505] lg:flex">
        <div className="flex h-24 items-center border-b border-white/10 px-7">
          <Link href="/dashboard" className="no-underline">
            <img src="/nova/logo-nova.jpeg" alt="NOVA" className="hidden" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group, i) => (
            <NavGroup key={i} group={group} pathname={pathname} />
          ))}
        </nav>

        <CreditBalanceCard />

        <div className="border-t border-white/10 px-5 py-5 text-xs text-white/25">
          nova studio
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute bottom-[76px] left-3 right-3 max-h-[75vh] overflow-y-auto rounded-[1.5rem] border border-white/10 bg-[#050505] p-4 shadow-[0_0_80px_rgba(215,255,0,.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">
                Ferramentas
              </p>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/50"
              >
                Fechar
              </button>
            </div>

            {mobileDrawerGroups.map((group, i) => (
              <DrawerGroup
                key={i}
                group={group}
                pathname={pathname}
                onClose={() => setMobileOpen(false)}
              />
            ))}
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#050505]/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {mobileItems.map((item) => {
          const active = isActive(item.href, pathname);
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
              <span className="text-[8px] font-black uppercase tracking-wider">
                {item.label}
              </span>
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
