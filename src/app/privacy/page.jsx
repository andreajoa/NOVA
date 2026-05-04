"use client";
import { useLang } from "@/components/LangProvider";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const SECTIONS = {
  en: [['1. Information We Collect', 'We collect information you provide when creating an account, such as your name, email address, and payment information. We also automatically collect usage data, IP addresses, and cookie information.'], ['2. How We Use Your Information', 'We use your information to provide, maintain, and improve our services, process transactions, send service-related communications, and comply with legal obligations.'], ['3. Information Sharing', 'We do not sell your personal data. We may share information with service providers that help us operate the platform, under confidentiality agreements.'], ['4. Security', 'We implement technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction.'], ['5. Your Rights', 'You have the right to access, correct, or delete your personal information. Contact us at info@nova.online.'], ['6. Contact', 'For questions about this policy, email info@nova.online.']],
  pt: [['1. Informações que Coletamos', 'Coletamos informações que você fornece ao criar uma conta, como nome, e-mail e dados de pagamento. Também coletamos automaticamente dados de uso, IPs e cookies.'], ['2. Como Usamos suas Informações', 'Usamos suas informações para fornecer, manter e melhorar nossos serviços, processar transações, enviar comunicações e cumprir obrigações legais.'], ['3. Compartilhamento de Informações', 'Não vendemos seus dados pessoais. Podemos compartilhá-los com prestadores de serviço que nos auxiliam na operação da plataforma.'], ['4. Segurança', 'Implementamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado ou destruição.'], ['5. Seus Direitos', 'Você tem direito de acessar, corrigir ou excluir suas informações pessoais. Entre em contato pelo e-mail info@nova.online.'], ['6. Contato', 'Dúvidas sobre esta política: info@nova.online']],
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
        <h1 className="text-4xl font-black uppercase tracking-[-0.06em] mb-2">{isPt ? "POLÍTICA DE PRIVACIDADE" : "PRIVACY POLICY"}</h1>
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