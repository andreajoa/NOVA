/**
 * 5 e-mails de abandoned checkout — bilíngue (PT/EN).
 *
 * Metodologia:
 *   Hormozi — lead com valor, cost of inaction, offer stack, breakup.
 *   Gary Vee — jab/hook rhythm, value-first, authentic voice.
 *
 * Ritmo: hook · hook · jab · hook · hook
 * Mais pesado em hooks que a sequência de nurture porque o usuário
 * já mostrou intenção de compra. O jab no e-mail 2 quebra o padrão
 * e entrega valor genuíno (a fórmula de prompt).
 *
 * {{plan}} e {{planUpper}} são substituídos no render pelo plano real.
 */

export const ABANDONED_EMAILS = [
  // ── 0: Soft reminder (imediato após expire) ─────────────────────────────
  {
    id: "ab-00-one-click",
    ask: "hook",
    en: {
      subject: "You were one click away",
      preheader: "Your {{plan}} plan is still waiting",
      headline: "You were one click away",
      body: [
        "You started setting up your {{plan}} plan and didn't finish.",
        "If something went wrong with the payment page, I get it — it happens. Your plan is still available at the same price.",
        "If you just got pulled away, that's fine too. Nothing expired.",
      ],
      cta: "Complete your {{plan}} setup",
      href: "/pricing",
    },
    pt: {
      subject: "Faltou um clique",
      preheader: "Seu plano {{plan}} ainda esta esperando",
      headline: "Faltou um clique",
      body: [
        "Voce comecou a configurar o plano {{plan}} e nao terminou.",
        "Se deu algum problema na pagina de pagamento, entendo — acontece. Seu plano continua disponivel pelo mesmo preco.",
        "Se voce so foi interrompido, tudo bem tambem. Nada expirou.",
      ],
      cta: "Finalizar o plano {{plan}}",
      href: "/pricing",
    },
  },

  // ── 1: Cost of inaction (+24h) ──────────────────────────────────────────
  {
    id: "ab-01-cost-of-nothing",
    ask: "hook",
    en: {
      subject: "What not having video actually costs you",
      preheader: "The math most sellers ignore",
      headline: "The hidden cost of not having video",
      body: [
        "Every day without product video, you're leaving money on the table.",
        "Shopify stores with video on product pages convert 80% more. TikTok Shop listings with video get 3x the views. Amazon A+ video content reduces returns by 25%.",
        "That's not marketing copy. That's data from the platforms themselves.",
        "The question isn't whether video works. It's how much you're losing every week without it.",
      ],
      cta: "Stop leaving money on the table",
      href: "/pricing",
    },
    pt: {
      subject: "O que realmente custa nao ter video",
      preheader: "A conta que a maioria dos vendedores ignora",
      headline: "O custo invisivel de nao ter video",
      body: [
        "Cada dia sem video de produto, voce esta deixando dinheiro na mesa.",
        "Lojas Shopify com video na pagina de produto convertem 80% mais. Listings do TikTok Shop com video recebem 3x mais views. Conteudo A+ com video na Amazon reduz devolucoes em 25%.",
        "Isso nao e texto de marketing. Sao dados das proprias plataformas.",
        "A pergunta nao e se video funciona. E quanto voce esta perdendo a cada semana sem ele.",
      ],
      cta: "Pare de deixar dinheiro na mesa",
      href: "/pricing",
    },
  },

  // ── 2: Value jab — the prompt formula (+48h) ───────────────────────────
  {
    id: "ab-02-prompt-formula",
    ask: "jab",
    en: {
      subject: "The 3-line prompt that sells anything",
      preheader: "Copy this. Use it anywhere.",
      headline: "The prompt formula that actually converts",
      body: [
        "Forget long, complicated prompts. The best product videos come from three lines.",
        "I'm giving you the exact formula. Use it anywhere — NOVA, Runway, Pika, whatever you have.",
        "Seriously. This works regardless of which tool you use. That's how confident I am it'll bring you back.",
      ],
      cta: "Try it now on NOVA",
      href: "/dashboard/generate",
    },
    pt: {
      subject: "O prompt de 3 linhas que vende qualquer coisa",
      preheader: "Copie. Use em qualquer lugar.",
      headline: "A formula de prompt que realmente converte",
      body: [
        "Esqueca prompts longos e complicados. Os melhores videos de produto vem de tres linhas.",
        "Vou te dar a formula exata. Use em qualquer lugar — NOVA, Runway, Pika, o que voce tiver.",
        "Serio. Funciona independente da ferramenta. E por isso que tenho certeza que vai te trazer de volta.",
      ],
      cta: "Experimentar na NOVA",
      href: "/dashboard/generate",
    },
  },

  // ── 3: Offer stack (+72h) ──────────────────────────────────────────────
  {
    id: "ab-03-offer-stack",
    ask: "hook",
    en: {
      subject: "Everything inside your {{plan}} plan",
      preheader: "More than you think",
      headline: "Here's what {{plan}} actually gives you",
      body: [
        "When you were on the checkout page, you saw the price. But here's what you might have missed — the full stack.",
        "Most people look at the price and compare it to zero. That's the wrong comparison.",
        "Compare it to what you'd pay to get the same output any other way.",
      ],
      cta: "Activate {{plan}} now",
      href: "/pricing",
    },
    pt: {
      subject: "Tudo que esta dentro do plano {{plan}}",
      preheader: "Mais do que voce imagina",
      headline: "O que o {{plan}} realmente te da",
      body: [
        "Quando voce estava na pagina de checkout, viu o preco. Mas aqui esta o que pode ter passado despercebido — o pacote completo.",
        "A maioria das pessoas olha o preco e compara com zero. Essa e a comparacao errada.",
        "Compare com o que voce pagaria para ter o mesmo resultado de qualquer outra forma.",
      ],
      cta: "Ativar {{plan}} agora",
      href: "/pricing",
    },
  },

  // ── 4: Breakup (+7 dias) ──────────────────────────────────────────────
  {
    id: "ab-04-last-one",
    ask: "hook",
    en: {
      subject: "Last email about this",
      preheader: "Then I'll stop",
      headline: "This is the last one",
      body: [
        "I've sent you a few emails since you started your {{plan}} checkout.",
        "I'm not going to keep going. This is the last one.",
        "If the timing isn't right, no hard feelings. Your account is free forever — you can generate images and explore every feature.",
        "If the timing IS right, your {{plan}} plan is one click away. Same page, same price, nothing changed.",
      ],
      cta: "Last chance for {{plan}}",
      href: "/pricing",
    },
    pt: {
      subject: "Ultimo email sobre isso",
      preheader: "Depois eu paro",
      headline: "Esse e o ultimo",
      body: [
        "Mandei alguns emails desde que voce comecou o checkout do plano {{plan}}.",
        "Nao vou continuar. Esse e o ultimo.",
        "Se o momento nao e certo, sem ressentimentos. Sua conta e gratuita pra sempre — voce pode gerar imagens e explorar todas as funcionalidades.",
        "Se o momento E certo, seu plano {{plan}} esta a um clique. Mesma pagina, mesmo preco, nada mudou.",
      ],
      cta: "Ultima chance pro {{plan}}",
      href: "/pricing",
    },
  },
];

/**
 * Camada de conversão: tática, prova e P.S. — separados do copy para
 * poder visualizar o ritmo inteiro sem ler 5 e-mails completos.
 */
export const ABANDONED_TACTICS = {
  "ab-00-one-click": {
    en: {
      tactic: {
        label: "QUICK DIAGNOSTIC",
        text: "Before subscribing, answer one question: do you need more than 3 product videos per month? If yes, {{plan}} pays for itself in the first batch. One agency video costs $500-2,000. One NOVA video costs the equivalent of a coffee.",
      },
      proof: {
        stat: "$847",
        caption: "average cost of a single 15s product video from a freelance editor (Upwork, 2024)",
      },
      ps: "No commitment. Cancel anytime in two clicks from Settings.",
    },
    pt: {
      tactic: {
        label: "DIAGNOSTICO RAPIDO",
        text: "Antes de assinar, responda uma pergunta: voce precisa de mais de 3 videos de produto por mes? Se sim, o {{plan}} se paga no primeiro lote. Um video de agencia custa R$ 2.500-10.000. Um video na NOVA custa o equivalente a um cafe.",
      },
      proof: {
        stat: "R$ 4.200",
        caption: "custo medio de um unico video de 15s com editor freelancer (Workana, 2024)",
      },
      ps: "Sem compromisso. Cancele a qualquer momento em dois cliques em Configuracoes.",
    },
  },

  "ab-01-cost-of-nothing": {
    en: {
      tactic: {
        label: "THE COST-OF-NOTHING FORMULA",
        text: "Take your monthly revenue. Multiply by 0.15. That's the conservative estimate of what you're leaving on the table without video content. For a store doing $5,000/month, that's $750/month — $9,000/year. Your {{plan}} plan costs a fraction of one month's lost revenue.",
      },
      proof: {
        stat: "80%",
        caption: "increase in conversion when product pages include video (Shopify, 2024)",
      },
      ps: "One seller generated 47 product videos in a single afternoon using NOVA. Her return on the first month was 23x.",
    },
    pt: {
      tactic: {
        label: "A FORMULA DO CUSTO-ZERO",
        text: "Pegue seu faturamento mensal. Multiplique por 0,15. Essa e a estimativa conservadora do que voce esta deixando na mesa sem video. Para uma loja que fatura R$ 25.000/mes, sao R$ 3.750/mes — R$ 45.000/ano. Seu plano {{plan}} custa uma fracao de um mes de receita perdida.",
      },
      proof: {
        stat: "80%",
        caption: "aumento na conversao quando paginas de produto incluem video (Shopify, 2024)",
      },
      ps: "Uma vendedora gerou 47 videos de produto numa unica tarde usando a NOVA. O retorno dela no primeiro mes foi 23x.",
    },
  },

  "ab-02-prompt-formula": {
    en: {
      tactic: {
        label: "THE 3-LINE PRODUCT VIDEO FORMULA",
        text: 'Line 1 — THE SHOT: "[Product] on [surface], [lighting]. Camera [movement]." Example: "White sneakers on marble, soft morning light. Camera slowly orbits." Line 2 — THE FEEL: "Cinematic, [mood], [speed]." Example: "Cinematic, aspirational, slow motion." Line 3 — THE SELL: "[Detail] in sharp focus, [background] softly blurred." Example: "Leather texture in sharp focus, lifestyle setting softly blurred." Three lines. Works for shoes, skincare, electronics, food, jewelry — anything physical.',
      },
      proof: {
        stat: "3 lines",
        caption: "maximum prompt length that consistently produces usable video across every model tested",
      },
      ps: "The difference between a prompt that works and one that doesn't is specificity. 'Nice product video' fails. 'White sneakers on marble, soft morning light, camera slowly orbits' succeeds. Always name the surface, the light, and the camera movement.",
    },
    pt: {
      tactic: {
        label: "A FORMULA DE 3 LINHAS PARA VIDEO DE PRODUTO",
        text: 'Linha 1 — O PLANO: "[Produto] sobre [superficie], [iluminacao]. Camera [movimento]." Exemplo: "Tenis branco sobre marmore, luz suave da manha. Camera orbita lentamente." Linha 2 — O CLIMA: "Cinematico, [mood], [velocidade]." Exemplo: "Cinematico, aspiracional, camera lenta." Linha 3 — O DETALHE: "[Detalhe] em foco nitido, [fundo] suavemente desfocado." Exemplo: "Textura do couro em foco nitido, cenario lifestyle desfocado." Tres linhas. Funciona para tenis, skincare, eletronicos, comida, joias — qualquer coisa fisica.',
      },
      proof: {
        stat: "3 linhas",
        caption: "tamanho maximo de prompt que consistentemente produz video utilizavel em todos os modelos testados",
      },
      ps: "A diferenca entre um prompt que funciona e um que nao e especificidade. 'Video bonito de produto' falha. 'Tenis branco sobre marmore, luz suave da manha, camera orbita lentamente' funciona. Sempre nomeie a superficie, a luz e o movimento da camera.",
    },
  },

  "ab-03-offer-stack": {
    en: {
      tactic: {
        label: "YOUR {{PLAN}} STACK",
        text: "9 video AI models (Seedance 2.0, Kling 3.0, Veo 3.1, PixVerse V6, and more). 13 image AI models (FLUX, GPT Image 2, Recraft V3, and more). Unlimited image generations. UGC ad templates. Talking avatar generator. Music video generator. Landing page builder with export to Shopify, Next.js, HTML. Claude AI integration. All models, all features, no per-generation fees beyond your credits.",
      },
      proof: {
        stat: "22",
        caption: "AI models available inside every paid plan — no add-ons, no tiers",
      },
      ps: "One subscription replaces a video editor ($50/hr), a stock library ($30/mo), an AI image tool ($20/mo), and a landing page builder ($25/mo). Do the math.",
    },
    pt: {
      tactic: {
        label: "SEU PACOTE {{PLAN}}",
        text: "9 modelos de video IA (Seedance 2.0, Kling 3.0, Veo 3.1, PixVerse V6 e mais). 13 modelos de imagem IA (FLUX, GPT Image 2, Recraft V3 e mais). Geracoes de imagem ilimitadas. Templates de anuncio UGC. Gerador de talking avatar. Gerador de music video. Construtor de landing page com export para Shopify, Next.js, HTML. Integracao com Claude AI. Todos os modelos, todas as features, sem cobranca por geracao alem dos creditos.",
      },
      proof: {
        stat: "22",
        caption: "modelos de IA disponiveis em todo plano pago — sem add-ons, sem tiers",
      },
      ps: "Uma assinatura substitui um editor de video (R$ 250/hr), uma biblioteca de stock (R$ 150/mes), uma ferramenta de imagem IA (R$ 100/mes) e um construtor de landing page (R$ 125/mes). Faz a conta.",
    },
  },

  "ab-04-last-one": {
    en: {
      tactic: {
        label: "HONEST TAKE",
        text: "If you're waiting for a better deal, this is it. We don't run flash sales or Black Friday discounts on plans. The price you saw is the price. And every month you wait is a month of content you didn't make — while your competitors did.",
      },
      ps: "If you do come back in 6 months, the models will be better, the templates will be more, and the price might be higher. Just saying.",
    },
    pt: {
      tactic: {
        label: "PAPO RETO",
        text: "Se voce esta esperando uma oferta melhor, essa e a oferta. Nao fazemos liquidacao relampago nem desconto de Black Friday nos planos. O preco que voce viu e o preco. E cada mes que voce espera e um mes de conteudo que voce nao fez — enquanto seus concorrentes fizeram.",
      },
      ps: "Se voce voltar daqui a 6 meses, os modelos vao estar melhores, os templates vao ser mais, e o preco pode ter subido. So dizendo.",
    },
  },
};
