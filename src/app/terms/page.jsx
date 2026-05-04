"use client";
import { useLang } from "@/components/LangProvider";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const SECTIONS = {
  en: [['1. Acceptance of Terms', 'By accessing or using the Nova platform, you agree to these Terms of Use. If you do not agree, do not use the service.'], ['2. Permitted Use', 'You may use Nova to create AI-generated videos for personal and commercial purposes within your plan limits. Creating illegal, deceptive, or harmful content is strictly prohibited.'], ['3. Intellectual Property', 'You retain rights over the content you create. Nova retains rights over the platform, technology, and AI models used.'], ['4. Credits and Payments', 'Credits are consumed per generation and are non-refundable. Subscriptions renew automatically until cancelled.'], ['5. Limitation of Liability', 'Nova is not liable for indirect, incidental, or consequential damages arising from use of the platform.'], ['6. Contact', 'Questions about these terms: info@nova.online']],
  pt: [['1. Aceitação dos Termos', 'Ao acessar ou usar a plataforma Nova, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.'], ['2. Uso Permitido', 'Você pode usar a Nova para criar vídeos com IA para fins pessoais e comerciais dentro dos limites do seu plano. É proibido criar conteúdo ilegal, enganoso ou prejudicial.'], ['3. Propriedade Intelectual', 'Você mantém os direitos sobre o conteúdo que cria. A Nova mantém direitos sobre a plataforma, tecnologia e modelos de IA utilizados.'], ['4. Créditos e Pagamentos', 'Os créditos são consumidos por geração e não são reembolsáveis. Assinaturas renovam automaticamente até cancelamento.'], ['5. Limitação de Responsabilidade', 'A Nova não é responsável por danos indiretos, incidentais ou consequenciais decorrentes do uso da plataforma.'], ['6. Contato', 'Dúvidas sobre os termos: info@nova.online']],
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
        <h1 className="text-4xl font-black uppercase tracking-[-0.06em] mb-2">{isPt ? "TERMOS DE USO" : "TERMS OF USE"}</h1>
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