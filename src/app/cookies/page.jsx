"use client";
import { useLang } from "@/components/LangProvider";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const SECTIONS = {
  en: [['What are cookies?', 'Cookies are small text files stored on your device when you visit our website.'], ['Cookies we use', 'We use essential cookies (required for the site to function), analytics cookies (to understand how the site is used), and preference cookies (to remember your settings).'], ['Managing cookies', 'You can control cookies in your browser settings. Blocking essential cookies may affect site functionality.'], ['Contact', 'Questions about cookies: info@novvideos.online']],
  pt: [['O que são cookies?', 'Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita nosso site.'], ['Cookies que usamos', 'Usamos cookies essenciais (necessários para o funcionamento do site), cookies de análise e cookies de preferência para lembrar suas configurações.'], ['Gerenciar cookies', 'Você pode controlar cookies nas configurações do seu navegador. Bloquear cookies essenciais pode afetar o funcionamento do site.'], ['Contato', 'Dúvidas sobre cookies: info@novvideos.online']],
};

export default function Page() {
  const { lang, setLang } = useLang();
  const isPt = lang === "pt";
  const sections = SECTIONS[lang] || SECTIONS.en;
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Nav lang={lang} setLang={setLang} />
      <div className="pt-28 pb-10 px-6 max-w-3xl mx-auto">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-3">Legal</p>
        <h1 className="text-4xl font-black uppercase tracking-[-0.06em] mb-2">{isPt ? "POLÍTICA DE COOKIES" : "COOKIE POLICY"}</h1>
        <p className="text-white/30 text-xs mb-10">{isPt ? "Atualizado em maio de 2026" : "Last updated May 2026"}</p>
        <div className="space-y-8">
          {sections.map(([title, text]) => (
            <div key={title}>
              <h2 className="text-white font-black text-base mb-2">{title}</h2>
              <p className="text-white/60 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}