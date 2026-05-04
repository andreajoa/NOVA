"use client";
import Link from "next/link";

const tabs = [
  { href: "/dashboard/settings/profile",  label: "Profile",  icon: "👤", desc: "Name, email, avatar" },
  { href: "/dashboard/settings/billing",  label: "Billing",  icon: "💳", desc: "Plan, payments, invoices" },
  { href: "/dashboard/settings/api-keys", label: "API Keys", icon: "🔑", desc: "Manage API access" },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Settings</h1>
        <p className="text-white/40 text-sm mb-10">Gerencie sua conta, plano e integracoes</p>
        <div className="grid gap-4">
          {tabs.map(t => (
            <Link key={t.href} href={t.href} className="flex items-center justify-between bg-[#0D0D0D] border border-white/8 rounded-2xl p-6 hover:border-[#D7FF00]/40 hover:bg-[#D7FF00]/5 transition group no-underline">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="text-white font-black text-sm uppercase tracking-wider group-hover:text-[#D7FF00] transition">{t.label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{t.desc}</p>
                </div>
              </div>
              <span className="text-white/20 group-hover:text-[#D7FF00] transition text-lg">→</span>
            </Link>
          ))}
        </div>
      </div>

      <footer className="mt-16 pt-8 border-t border-white/8 flex items-center justify-between">
        <p className="text-white/20 text-xs">© 2026 Nova AI · All rights reserved</p>
        <div className="flex gap-6">
          <a href="/pricing" className="text-white/20 text-xs hover:text-white transition">Pricing</a>
          <a href="/terms" className="text-white/20 text-xs hover:text-white transition">Terms</a>
          <a href="/privacy" className="text-white/20 text-xs hover:text-white transition">Privacy</a>
          <a href="/contact" className="text-white/20 text-xs hover:text-white transition">Contact</a>
        </div>
      </footer>
    </div>
  );
}