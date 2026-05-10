"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import CreditBalancePill from "@/components/CreditBalancePill";

const MENU_GROUPS = [
  {
    key: "criar",
    label: "Criar",
    description: "Escolha o tipo de conteúdo que quer gerar",
    columns: [
      {
        title: "Geração",
        items: [
          { label: "Gerar Imagem",  href: "/dashboard/models",    path: "/dashboard/models"    },
          { label: "Gerar Vídeo",   href: "/dashboard/generate",  path: "/dashboard/generate"  },
          { label: "UGC Produto",   href: "/dashboard/templates", path: "/dashboard/templates" },
          { href: "/dashboard/landing-page", label: "Landing Page", icon: "▣" },
        ],
      },
      {
        title: "Recursos",
        items: [
          { label: "Brand Kit",     href: "/dashboard/brandkit",  path: "/dashboard/brandkit"  },
          { label: "Uploads",       href: "/dashboard/uploads",   path: "/dashboard/uploads"   },
          { label: "Projetos",      href: "/dashboard/projects",  path: "/dashboard/projects"  },
        ],
      },
    ],
  },
  {
    key: "produto",
    label: "Produto",
    description: "Saiba mais sobre o NOVA e escolha seu plano",
    columns: [
      {
        title: "NOVA",
        items: [
          { label: "Home",                href: "/",                     path: "/"                      },
          { label: "Pricing",             href: "/pricing",              path: "/pricing"               },
          { label: "Claude AI", href: "/claude", path: "/claude" },
          { label: "Product Ad Generator",href: "/product-ad-generator", path: "/product-ad-generator"  },
          { label: "Explorar",            href: "/explore",              path: "/explore"               },
        ],
      },
    ],
  },
  {
    key: "api",
    label: "API",
    description: "Use os modelos NOVA no seu próprio projeto",
    columns: [
      {
        title: "Desenvolvedor",
        items: [
          { label: "API Credits",   href: "/dashboard/settings/api-keys", path: "/dashboard/settings/api-keys" },
          { label: "Billing",       href: "/dashboard/settings/billing",   path: "/dashboard/settings/billing"  },
          { label: "Settings",      href: "/dashboard/settings",           path: "/dashboard/settings"           },
        ],
      },
    ],
  },
  {
    key: "empresa",
    label: "Empresa",
    description: "Informações legais e contato",
    columns: [
      {
        title: "Empresa",
        items: [
          { label: "Contato",  href: "/contact", path: "/contact" },
          { label: "Termos",   href: "/terms",   path: "/terms"   },
          { label: "Privacy",  href: "/privacy", path: "/privacy" },
        ],
      },
    ],
  },
];

function isActivePath(pathname, item) {
  const routePath = item.path || item.href;

  if (routePath === "/") return pathname === "/";

  if (pathname === routePath) return true;
  if (pathname === item.href) return true;

  if (!routePath.includes("[") && pathname.startsWith(routePath + "/")) return true;
  if (!item.href.includes("[") && item.href !== "/" && pathname.startsWith(item.href + "/")) return true;

  return false;
}

function groupIsActive(pathname, group) {
  return group.columns.some((column) =>
    column.items.some((item) => isActivePath(pathname, item))
  );
}

function MenuItem({ item, pathname, closeMenu }) {
  const active = isActivePath(pathname, item);

  return (
    <Link
      href={item.href}
      onClick={closeMenu}
      className={[
        "group block rounded-xl border px-4 py-3 no-underline transition",
        active
          ? "border-[#D7FF00]/60 bg-[#D7FF00]/10"
          : "border-white/8 bg-white/[.025] hover:border-[#D7FF00]/35 hover:bg-[#D7FF00]/5",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={active ? "text-sm font-black text-[#D7FF00]" : "text-sm font-black text-white/80 group-hover:text-white"}>
          {item.label}
        </span>
        <span className={active ? "text-[#D7FF00]" : "text-white/25 group-hover:text-[#D7FF00]"}>
          →
        </span>
      </div>
    </Link>
  );
}

function MegaPanel({ group, pathname, closeMenu }) {
  return (
    <div className="absolute left-1/2 top-[64px] hidden w-[min(1180px,calc(100vw-32px))] -translate-x-1/2 rounded-3xl border border-white/10 bg-[#070707]/95 p-5 shadow-[0_30px_120px_rgba(0,0,0,.75)] backdrop-blur-2xl lg:block">
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_20%_0%,rgba(215,255,0,.10),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(37,99,235,.12),transparent_28%)]" />

      <div className="relative z-10 grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-white/8 bg-white/[.035] p-5">
          <p className="text-[11px] font-black uppercase tracking-[.22em] text-[#D7FF00]">
            NOVA Menu
          </p>
          <h3 className="mt-3 text-2xl font-black text-white">
            {group.label}
          </h3>
          <p className="mt-3 text-sm leading-6 text-white/45">
            {group.description}
          </p>

          <Link
            href="/pricing"
            onClick={closeMenu}
            className="mt-6 inline-flex rounded-xl bg-[#D7FF00] px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-black no-underline hover:bg-[#c7ef00]"
          >
            View Pricing
          </Link>
        </div>

        <div
          className={[
            "grid gap-4",
            group.columns.length >= 4 ? "lg:grid-cols-4" : "",
            group.columns.length === 3 ? "lg:grid-cols-3" : "",
            group.columns.length === 2 ? "lg:grid-cols-2" : "",
            group.columns.length === 1 ? "lg:grid-cols-1" : "",
          ].join(" ")}
        >
          {group.columns.map((column) => (
            <div key={column.title}>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[.18em] text-white/35">
                {column.title}
              </p>
              <div className="space-y-2">
                {column.items.map((item) => (
                  <MenuItem
                    key={`${column.title}-${item.path || item.href}`}
                    item={item}
                    pathname={pathname}
                    closeMenu={closeMenu}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TopNav() {
  const pathname = usePathname() || "/";
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentGroup = MENU_GROUPS.find((group) => group.key === openMenu);

  return (
    <nav className="sticky top-0 z-[100] border-b border-white/10 bg-[#050505]/95 backdrop-blur-2xl">
      <div
        className="relative mx-auto flex h-[76px] max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6"
        onMouseLeave={() => setOpenMenu(null)}
      >
        <Link href="/" className="flex shrink-0 items-center no-underline">
          <img
            src="/nova/logo-nova.jpeg"
            alt="NOVA"
            className="h-12 w-auto object-contain md:h-14"
          />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {MENU_GROUPS.map((group) => {
            const active = groupIsActive(pathname, group);
            const opened = openMenu === group.key;

            return (
              <button
                key={group.key}
                onMouseEnter={() => setOpenMenu(group.key)}
                onFocus={() => setOpenMenu(group.key)}
                className={[
                  "rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[.14em] transition",
                  active || opened
                    ? "bg-[#D7FF00] text-black"
                    : "bg-transparent text-white/50 hover:bg-white/8 hover:text-white",
                ].join(" ")}
              >
                {group.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="hidden rounded-xl border border-white/15 px-4 py-2.5 text-[11px] font-black uppercase tracking-[.12em] text-white/75 no-underline transition hover:border-white/30 hover:text-white sm:inline-flex"
            >
              Sign In
            </Link>

            <Link
              href="/sign-up"
              className="rounded-xl bg-[#D7FF00] px-4 py-2.5 text-[11px] font-black uppercase tracking-[.12em] text-black no-underline transition hover:bg-[#c7ef00] md:px-5"
            >
              Sign Up
            </Link>
          </Show>

          <Show when="signed-in">
            <CreditBalancePill />
            <Link
              href="/dashboard"
              className="hidden rounded-xl bg-[#D7FF00] px-4 py-2.5 text-[11px] font-black uppercase tracking-[.12em] text-black no-underline transition hover:bg-[#c7ef00] sm:inline-flex"
            >
              Dashboard
            </Link>

            <UserButton
              showName
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-9 w-9",
                  userButtonTrigger: "focus:shadow-none",
                },
              }}
            />
          </Show>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[.03] text-xl text-white lg:hidden"
            aria-label="Open menu"
          >
            {mobileOpen ? "×" : "☰"}
          </button>
        </div>

        {currentGroup && (
          <MegaPanel
            group={currentGroup}
            pathname={pathname}
            closeMenu={() => setOpenMenu(null)}
          />
        )}
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#050505] px-4 pb-5 lg:hidden">
          <div className="mx-auto max-w-[760px] space-y-5 pt-4">
            {MENU_GROUPS.map((group) => (
              <div key={group.key} className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <p className="text-xs font-black uppercase tracking-[.18em] text-[#D7FF00]">
                  {group.label}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {group.columns.flatMap((column) => column.items).map((item) => (
                    <MenuItem
                      key={`${group.key}-${item.path || item.href}`}
                      item={item}
                      pathname={pathname}
                      closeMenu={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
