"use client";
import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/components/LangProvider";

const t = {
  en: {
    tagline: "AI video studio for creators, brands, e-commerce teams and agencies.",
    product: "Product", studio: "Studio", models: "Models", pricing: "Pricing",
    usecases: "Use cases", productAds: "Product Ads", ugc: "UGC Creatives", social: "Social Videos",
    company: "Company", terms: "Terms", privacy: "Privacy", contact: "Contact",
    copy: "All rights reserved.",
  },
  pt: {
    tagline: "Estúdio de vídeo com IA para criadores, marcas, e-commerce e agências.",
    product: "Produto", studio: "Estúdio", models: "Modelos", pricing: "Preços",
    usecases: "Casos de uso", productAds: "Anúncios de produto", ugc: "Criativos UGC", social: "Vídeos Sociais",
    company: "Empresa", terms: "Termos", privacy: "Privacidade", contact: "Contato",
    copy: "Todos os direitos reservados.",
  },
};

export default function Footer() {
  const { lang } = useLang();
  const s = t[lang] || t.en;
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-[#050505] px-5 py-16 md:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/nova/nova-logo-full.png"
              alt="Nova"
              width={180}
              height={80}
              className="h-14 w-auto object-contain mb-4"
            />
            <p className="text-sm text-white/40 leading-7 max-w-xs">{s.tagline}</p>
            <p className="mt-4 text-sm text-white/30">info@nova.online</p>
          </div>
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-widest text-white/30">{s.product}</p>
            {[[s.studio,"/dashboard"],[s.models,"/dashboard/models"],[s.pricing,"/pricing"]].map(([label,href])=>(
              <Link key={href} href={href} className="mb-3 block text-sm text-white/35 hover:text-white transition">{label}</Link>
            ))}
          </div>
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-widest text-white/30">{s.usecases}</p>
            {[[s.productAds,"#"],[s.ugc,"#"],[s.social,"#"]].map(([label,href])=>(
              <Link key={label} href={href} className="mb-3 block text-sm text-white/35 hover:text-white transition">{label}</Link>
            ))}
          </div>
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-widest text-white/30">{s.company}</p>
            {[[s.terms,"/terms"],[s.privacy,"/privacy"],[s.contact,"/contact"]].map(([label,href])=>(
              <Link key={href} href={href} className="mb-3 block text-sm text-white/35 hover:text-white transition">{label}</Link>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t border-white/8 pt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-white/20 text-xs">© {year} Nova AI. {s.copy}</p>
          <div className="flex items-center gap-6">
            {[["Instagram","https://instagram.com"],["X / Twitter","https://x.com"],["TikTok","https://tiktok.com"]].map(([n,u])=>(
              <a key={n} href={u} target="_blank" rel="noopener noreferrer"
                className="text-white/20 hover:text-white transition text-xs font-bold uppercase tracking-wider">{n}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}