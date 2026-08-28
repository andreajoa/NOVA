"use client";
import { useLang } from "@/components/LangProvider";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const SECTIONS = {
  en: [
    ['1. Acceptance of Terms', 'By accessing or using the Nova platform, you agree to these Terms of Use. If you do not agree, do not use the service.'],
    ['2. Permitted Use', 'You may use Nova to create AI-generated images and videos for personal and commercial purposes within your plan limits. Creating illegal, deceptive, abusive, discriminatory, exploitative, defamatory, privacy-violating, or otherwise harmful content is prohibited. You must not use Nova to harm or exploit minors, provide automated medical diagnoses, or make fully automated high-impact decisions about a person.'],
    ['3. Your Content and Outputs', 'You remain responsible for prompts, reference media, and other content you submit. Rights in generated outputs are subject to applicable law and to any license terms that lawfully apply to the underlying generation technology. You must have the rights needed to upload and use reference media.'],
    ['4. Nova and Third-Party Technology', 'Nova owns its platform, interface, orchestration, proprietary code, branding, and other Nova-owned technology. Some generation capabilities rely on third-party or open-source models, libraries, and infrastructure; ownership of those components remains with their respective owners and is governed by their applicable licenses. Nova does not claim ownership of third-party AI models.'],
    ['5. Included Generations, Credits and Payments', 'Included generations and paid credits are subject to the limits shown for your plan and to technical availability. Failed included generations may be returned to the applicable quota when Nova can verify the failure. Paid subscriptions renew automatically until cancelled unless otherwise stated at purchase.'],
    ['6. Service Availability', 'AI generation can depend on external and open-source compute infrastructure. Nova may route a request among compatible generation engines to improve availability. Temporary capacity limits, maintenance, or upstream outages may delay or prevent a generation.'],
    ['7. Limitation of Liability', 'To the maximum extent permitted by law, Nova is not liable for indirect, incidental, or consequential damages arising from use of the platform. Nothing in these terms excludes rights that cannot legally be excluded.'],
    ['8. Contact', 'Questions about these terms: info@novvideos.online'],
  ],
  pt: [
    ['1. Aceitação dos Termos', 'Ao acessar ou usar a plataforma Nova, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.'],
    ['2. Uso Permitido', 'Você pode usar a Nova para criar imagens e vídeos com IA para fins pessoais e comerciais dentro dos limites do seu plano. É proibido criar conteúdo ilegal, enganoso, abusivo, discriminatório, exploratório, difamatório, que viole a privacidade ou que cause dano. A Nova não pode ser usada para prejudicar ou explorar menores, fornecer diagnósticos médicos automatizados ou tomar decisões automatizadas de alto impacto sobre uma pessoa.'],
    ['3. Seu Conteúdo e os Resultados', 'Você continua responsável pelos prompts, mídias de referência e demais conteúdos enviados. Os direitos sobre resultados gerados dependem da legislação aplicável e das licenças que legalmente incidam sobre a tecnologia de geração utilizada. Você deve possuir os direitos necessários para enviar e utilizar mídias de referência.'],
    ['4. Tecnologia Nova e Tecnologia de Terceiros', 'A Nova é titular da plataforma, interface, sistema de orquestração, código proprietário, marca e demais tecnologias próprias. Algumas funções de geração utilizam modelos, bibliotecas ou infraestrutura de terceiros e de código aberto; esses componentes continuam pertencendo aos respectivos titulares e são regidos por suas licenças aplicáveis. A Nova não reivindica propriedade sobre modelos de IA de terceiros.'],
    ['5. Gerações Incluídas, Créditos e Pagamentos', 'As gerações incluídas e os créditos pagos seguem os limites exibidos para cada plano e dependem da disponibilidade técnica. Quando a Nova consegue confirmar que uma geração incluída falhou, a tentativa pode ser devolvida à cota correspondente. Assinaturas pagas renovam automaticamente até o cancelamento, salvo informação diferente apresentada no momento da compra.'],
    ['6. Disponibilidade do Serviço', 'A geração por IA pode depender de infraestrutura externa e de código aberto. A Nova pode encaminhar uma solicitação entre mecanismos de geração compatíveis para aumentar a disponibilidade. Limites temporários de capacidade, manutenção ou indisponibilidade de serviços externos podem atrasar ou impedir uma geração.'],
    ['7. Limitação de Responsabilidade', 'Na extensão máxima permitida pela lei, a Nova não é responsável por danos indiretos, incidentais ou consequenciais decorrentes do uso da plataforma. Estes termos não excluem direitos que não possam ser legalmente excluídos.'],
    ['8. Contato', 'Dúvidas sobre os termos: info@novvideos.online'],
  ],
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
        <p className="text-white/30 text-xs mb-10">{isPt ? "Atualizado em agosto de 2026" : "Last updated August 2026"}</p>
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
