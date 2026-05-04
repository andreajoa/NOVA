"use client";
import { useLang } from "@/components/LangProvider";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
export default function Page() {
  const { lang, setLang } = useLang();
  const isPt = lang === "pt";
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Nav lang={lang} setLang={setLang} />
      <div className="pt-28 pb-10 px-6 max-w-7xl mx-auto">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-3">Nova</p>
        <h1 className="text-5xl font-black uppercase tracking-[-0.06em] mb-3">{isPt ? "Explorar" : "EXPLORE"}</h1>
        <p className="text-white/40 text-sm">{isPt ? "Navegue e descubra vídeos gerados com IA." : "Browse and discover AI-generated videos."}</p>
        <div className="mt-16 bg-[#0D0D0D] border border-white/10 rounded-2xl p-16 text-center">
          <p className="text-white/20 text-sm font-black uppercase tracking-widest">Coming Soon</p>
        </div>
      </div>
      <Footer />
    </main>
  );
}