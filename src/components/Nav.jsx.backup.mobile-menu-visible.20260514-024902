"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
const L = {
  en: { dashboard:"Dashboard",generate:"Generate",explore:"Explore",originals:"Originals",brandkit:"Brand Kit",pricing:"Pricing",settings:"Settings",contact:"Contact",start:"Start Free →" },
  pt: { dashboard:"Dashboard",generate:"Gerar",explore:"Explorar",originals:"Originais",brandkit:"Brand Kit",pricing:"Planos",settings:"Configurações",contact:"Contato",start:"Começar Grátis →" },
};
export default function Nav({ lang="en", setLang=()=>{} }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const t = L[lang] || L.en;
  const links = [
    {href:"/dashboard",label:t.dashboard},{href:"/generate",label:t.generate},
    {href:"/explore",label:t.explore},{href:"/originals",label:t.originals},
    {href:"/brandkit",label:t.brandkit},{href:"/pricing",label:t.pricing},
    {href:"/claude",label:"Claude AI"},
    {href:"/settings",label:t.settings},{href:"/contact",label:t.contact},
  ];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8 bg-[#050505]/95 backdrop-blur-xl px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img src="/logo-nova.png" alt="Nova" style={{height:"64px",width:"auto",objectFit:"contain"}} />
        </Link>
        <div className="hidden lg:flex items-center gap-5">
          {links.map(l=>(
            <Link key={l.href} href={l.href} className={"text-xs font-bold uppercase tracking-widest transition hover:text-white "+(path===l.href?"text-[#D7FF00]":"text-white/40")}>{l.label}</Link>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={()=>setLang(lang==="en"?"pt":"en")} className="text-xs font-black uppercase tracking-wider text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition">{lang==="en"?"PT":"EN"}</button>
          <Link href="/dashboard" className="hidden sm:inline-flex bg-[#D7FF00] text-black text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-lg hover:bg-[#c8f000] transition">{t.start}</Link>
          <button onClick={()=>setOpen(!open)} className="lg:hidden flex flex-col gap-1.5 p-2" aria-label="Menu">
            <span className={"block w-6 h-0.5 bg-white transition-all "+(open?"rotate-45 translate-y-2":"")} />
            <span className={"block w-6 h-0.5 bg-white transition-all "+(open?"opacity-0":"")} />
            <span className={"block w-6 h-0.5 bg-white transition-all "+(open?"-rotate-45 -translate-y-2":"")} />
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-white/8 mt-3 pt-4 pb-4 space-y-1">
          {links.map(l=>(
            <Link key={l.href} href={l.href} onClick={()=>setOpen(false)} className={"block px-4 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition "+(path===l.href?"bg-[#D7FF00]/10 text-[#D7FF00]":"text-white/50 hover:text-white hover:bg-white/5")}>{l.label}</Link>
          ))}
          <div className="pt-3 px-4">
            <Link href="/dashboard" onClick={()=>setOpen(false)} className="block w-full text-center bg-[#D7FF00] text-black text-sm font-black uppercase tracking-wider py-3 rounded-xl">{t.start}</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
