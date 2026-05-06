"use client";
import { useState } from "react";
import { useLang } from "@/components/LangProvider";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const T = {
  en: { badge:"Get in Touch",title:"CONTACT",sub:"Have a question or need help? Send us a message.",
        name:"Full Name",email:"Email",subject:"Subject",message:"Message",
        send:"Send Message →",sending:"Sending...",
        ph_name:"Your name",ph_email:"your@email.com",ph_subject:"How can we help?",ph_msg:"Tell us more...",
        info:"Contact Info",addr:"Nova HQ · São Paulo, Brazil",
        ok:"Message sent! We will reply within 24h." },
  pt: { badge:"Fale Conosco",title:"CONTATO",sub:"Tem dúvida ou precisa de ajuda? Mande uma mensagem.",
        name:"Nome Completo",email:"E-mail",subject:"Assunto",message:"Mensagem",
        send:"Enviar Mensagem →",sending:"Enviando...",
        ph_name:"Seu nome",ph_email:"seu@email.com",ph_subject:"Como podemos ajudar?",ph_msg:"Conte mais...",
        info:"Informações de Contato",addr:"Nova HQ · São Paulo, Brasil",
        ok:"Mensagem enviada! Responderemos em até 24h." },
};

export default function ContactPage() {
  const { lang, setLang } = useLang();
  const t = T[lang]||T.en;
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handle = (e) => { e.preventDefault(); setLoading(true); setTimeout(()=>{setLoading(false);setSent(true);},1200); };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Nav lang={lang} setLang={setLang} />
      <div className="pt-28 pb-10 px-6 max-w-5xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7FF00] mb-3">{t.badge}</p>
          <h1 className="text-5xl font-black uppercase tracking-[-0.06em]">{t.title}</h1>
          <p className="text-white/40 mt-2 text-sm max-w-lg">{t.sub}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            {sent ? (
              <div className="bg-[#D7FF00]/10 border border-[#D7FF00]/30 rounded-2xl p-10 text-center">
                <p className="text-2xl font-black">{t.ok}</p>
              </div>
            ) : (
              <form onSubmit={handle} className="space-y-5">
                {[[t.name,t.ph_name,"text"],[t.email,t.ph_email,"email"],[t.subject,t.ph_subject,"text"]].map(([lbl,ph,type])=>(
                  <div key={lbl}>
                    <label className="text-xs font-black uppercase tracking-wider text-white/40 block mb-2">{lbl}</label>
                    <input type={type} placeholder={ph} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D7FF00] transition" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-white/40 block mb-2">{t.message}</label>
                  <textarea placeholder={t.ph_msg} rows={5} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D7FF00] transition resize-none" />
                </div>
                <button type="submit" className="bg-[#D7FF00] text-black text-sm font-black uppercase tracking-wider px-8 py-3 rounded-xl hover:bg-[#c8f000] transition">
                  {loading ? t.sending : t.send}
                </button>
              </form>
            )}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-5">{t.info}</p>
            <div className="space-y-4">
              <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Email</p>
                <a href="mailto:info@novvideos.online" className="text-[#D7FF00] font-bold hover:underline text-sm">info@novvideos.online</a>
              </div>
              <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">HQ</p>
                <p className="text-white/60 text-sm">{t.addr}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}