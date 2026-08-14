/**
 * Conteúdo dos 60 e-mails da sequência NOVA, em inglês e português.
 *
 * Cada item vira um e-mail renderizado pelo shell de src/lib/crm/emails/shell.js.
 * `body` é uma lista de parágrafos. `href` é relativo — o renderer prefixa o
 * domínio e adiciona UTM automaticamente.
 *
 * Arcos:
 *   1 Ativação · 2 Features · 3 Nicho/prova · 4 Objeções · 5 Oferta · 6 Win-back
 */

export const EMAILS = [
  // ─── ARCO 1 — ATIVAÇÃO ───────────────────────────────────────────────────
  {
    id: "a1-01-welcome", arc: 1,
    en: {
      subject: "Your first AI video is 60 seconds away",
      preheader: "One prompt. One click. A finished video ad.",
      headline: "WELCOME TO NOVA",
      body: [
        "You now have access to the same video models the big brands pay agencies to use — Seedance 2.0, Veo 3.1, Kling, Wan. All in one place, no editing skills required.",
        "Start with something small: type what you sell, pick a model, hit generate. Your first video takes about a minute.",
      ],
      cta: "Generate my first video", href: "/dashboard/generate",
    },
    pt: {
      subject: "Seu primeiro vídeo com IA está a 60 segundos daqui",
      preheader: "Um prompt. Um clique. Um anúncio pronto.",
      headline: "BEM-VINDO À NOVA",
      body: [
        "Você acabou de ganhar acesso aos mesmos modelos de vídeo que as marcas grandes pagam agência pra usar — Seedance 2.0, Veo 3.1, Kling, Wan. Tudo num lugar só, sem precisar saber editar.",
        "Comece pequeno: escreva o que você vende, escolha um modelo e clique em gerar. O primeiro vídeo leva cerca de um minuto.",
      ],
      cta: "Gerar meu primeiro vídeo", href: "/dashboard/generate",
    },
  },
  {
    id: "a1-02-prompt-anatomy", arc: 1,
    en: {
      subject: "The 4 parts of a prompt that actually works",
      preheader: "Most people write one line. That's the problem.",
      headline: "HOW TO WRITE A PROMPT",
      body: [
        "Subject + action + camera + lighting. That's it. \"Perfume bottle\" gives you nothing. \"Glass perfume bottle on black marble, slow 360 rotation, dramatic side lighting, shallow depth of field\" gives you an ad.",
        "The model can't read your mind, but it will follow instructions exactly. Be specific about the camera move and the light — those two carry 80% of the result.",
      ],
      cta: "Try a detailed prompt", href: "/dashboard/generate",
    },
    pt: {
      subject: "As 4 partes de um prompt que realmente funciona",
      preheader: "A maioria escreve uma linha só. É aí que erra.",
      headline: "COMO ESCREVER UM PROMPT",
      body: [
        "Sujeito + ação + câmera + luz. É só isso. \"Frasco de perfume\" não te dá nada. \"Frasco de perfume de vidro sobre mármore preto, giro lento de 360°, luz lateral dramática, profundidade de campo curta\" te dá um anúncio.",
        "O modelo não adivinha o que você quer, mas segue instrução ao pé da letra. Seja específico no movimento de câmera e na luz — esses dois carregam 80% do resultado.",
      ],
      cta: "Testar um prompt detalhado", href: "/dashboard/generate",
    },
  },
  {
    id: "a1-03-image-first", arc: 1,
    en: {
      subject: "Start with the image, not the video",
      preheader: "The cheapest way to find your look.",
      headline: "IMAGE FIRST, ALWAYS",
      body: [
        "Video generations cost more than images. So find your visual direction with images first — background, lighting, angle — and only then animate the one you like.",
        "It's the difference between burning credits on ten attempts and getting it right on the second.",
      ],
      cta: "Open the image studio", href: "/dashboard/models",
    },
    pt: {
      subject: "Comece pela imagem, não pelo vídeo",
      preheader: "O jeito mais barato de achar o visual certo.",
      headline: "IMAGEM PRIMEIRO, SEMPRE",
      body: [
        "Vídeo custa mais que imagem. Então ache a direção visual com imagens primeiro — fundo, luz, ângulo — e só depois anime a que você gostou.",
        "É a diferença entre queimar créditos em dez tentativas e acertar na segunda.",
      ],
      cta: "Abrir o estúdio de imagem", href: "/dashboard/models",
    },
  },
  {
    id: "a1-04-model-picker", arc: 1,
    en: {
      subject: "Which model for which job",
      preheader: "A 30-second cheat sheet.",
      headline: "PICK THE RIGHT ENGINE",
      body: [
        "Wan 2.2 for volume and testing — cheap and fast. Seedance 2.0 for product reveals and social. Veo 3.1 when you need sound and cinematic weight. Kling when the shot has to look expensive.",
        "Test the idea on the cheap model, then re-run the winner on the premium one. That's how the pros do it.",
      ],
      cta: "Browse all models", href: "/dashboard/models",
    },
    pt: {
      subject: "Qual modelo usar pra cada coisa",
      preheader: "Uma cola de 30 segundos.",
      headline: "ESCOLHA O MOTOR CERTO",
      body: [
        "Wan 2.2 pra volume e teste — barato e rápido. Seedance 2.0 pra revelação de produto e social. Veo 3.1 quando precisa de som e peso cinematográfico. Kling quando a cena tem que parecer cara.",
        "Teste a ideia no modelo barato e rode a vencedora no premium. É assim que os profissionais fazem.",
      ],
      cta: "Ver todos os modelos", href: "/dashboard/models",
    },
  },
  {
    id: "a1-05-format", arc: 1,
    en: {
      subject: "9:16 or 16:9? It changes everything",
      preheader: "Format is a strategy decision, not a setting.",
      headline: "GET THE FORMAT RIGHT",
      body: [
        "9:16 for TikTok, Reels and Shorts — the subject fills the frame and the hook lands in the first second. 16:9 for YouTube, sites and paid display. 1:1 still wins in the feed.",
        "Generate the vertical version first. That's where the cheap attention is.",
      ],
      cta: "Generate a vertical video", href: "/dashboard/generate",
    },
    pt: {
      subject: "9:16 ou 16:9? Isso muda tudo",
      preheader: "Formato é decisão de estratégia, não de configuração.",
      headline: "ACERTE O FORMATO",
      body: [
        "9:16 pra TikTok, Reels e Shorts — o produto preenche a tela e o gancho entra no primeiro segundo. 16:9 pra YouTube, site e display pago. 1:1 ainda ganha no feed.",
        "Gere primeiro a versão vertical. É onde está a atenção barata.",
      ],
      cta: "Gerar um vídeo vertical", href: "/dashboard/generate",
    },
  },
  {
    id: "a1-06-first-product-ad", arc: 1,
    en: {
      subject: "Turn one product photo into an ad",
      preheader: "Upload. Pick a style. Done.",
      headline: "YOUR FIRST PRODUCT AD",
      body: [
        "You don't need a studio, a model or a camera. Upload the photo you already have on your store page and NOVA turns it into a moving ad with proper lighting and camera work.",
        "Same product, same photo. Completely different perceived value.",
      ],
      cta: "Make a product ad", href: "/product-ad-generator",
    },
    pt: {
      subject: "Transforme uma foto de produto em anúncio",
      preheader: "Suba. Escolha o estilo. Pronto.",
      headline: "SEU PRIMEIRO ANÚNCIO",
      body: [
        "Você não precisa de estúdio, modelo nem câmera. Suba a foto que já está na sua loja e a NOVA transforma num anúncio em movimento, com luz e câmera de verdade.",
        "Mesmo produto, mesma foto. Valor percebido completamente diferente.",
      ],
      cta: "Criar anúncio de produto", href: "/product-ad-generator",
    },
  },
  {
    id: "a1-07-templates", arc: 1,
    en: {
      subject: "Skip the blank page",
      preheader: "Templates that already know what to say.",
      headline: "VIRAL TEMPLATES",
      body: [
        "Pet dance, before/after transformation, talking photo, UGC product demo, hook overlays. Each one is a prompt that's already been tuned to work.",
        "Pick one, drop your image in, generate. No prompt writing at all.",
      ],
      cta: "Browse templates", href: "/dashboard/viral-templates",
    },
    pt: {
      subject: "Pule a página em branco",
      preheader: "Templates que já sabem o que dizer.",
      headline: "TEMPLATES VIRAIS",
      body: [
        "Pet dançando, antes/depois, foto falando, demo UGC de produto, gancho sobreposto. Cada um é um prompt já ajustado pra funcionar.",
        "Escolhe um, joga sua imagem e gera. Sem escrever prompt nenhum.",
      ],
      cta: "Ver templates", href: "/dashboard/viral-templates",
    },
  },
  {
    id: "a1-08-mistake", arc: 1,
    en: {
      subject: "The #1 mistake beginners make",
      preheader: "And it costs them every credit they have.",
      headline: "STOP DOING THIS",
      body: [
        "Writing one vague prompt, hating the result, and regenerating the exact same thing hoping for luck. The model isn't going to change its mind.",
        "Change one variable at a time — the lighting, or the camera move, or the background. You'll get where you want in three tries instead of thirty.",
      ],
      cta: "Try it properly", href: "/dashboard/generate",
    },
    pt: {
      subject: "O erro nº1 de quem está começando",
      preheader: "E ele custa todos os créditos da pessoa.",
      headline: "PARE DE FAZER ISSO",
      body: [
        "Escrever um prompt vago, odiar o resultado e gerar exatamente a mesma coisa de novo esperando sorte. O modelo não vai mudar de ideia.",
        "Mude uma variável por vez — a luz, ou o movimento de câmera, ou o fundo. Você chega onde quer em três tentativas em vez de trinta.",
      ],
      cta: "Fazer do jeito certo", href: "/dashboard/generate",
    },
  },
  {
    id: "a1-09-photo-to-video", arc: 1,
    en: {
      subject: "From phone photo to finished clip",
      preheader: "The whole workflow, in three steps.",
      headline: "PHOTO IN, VIDEO OUT",
      body: [
        "Photograph the product on any clean surface. Upload it to the image studio and fix the background and lighting. Then send that image to image-to-video.",
        "Three steps, under five minutes, and the result looks like it cost a thousand dollars.",
      ],
      cta: "Start the workflow", href: "/dashboard/models",
    },
    pt: {
      subject: "Da foto do celular ao clipe pronto",
      preheader: "O fluxo inteiro, em três passos.",
      headline: "ENTRA FOTO, SAI VÍDEO",
      body: [
        "Fotografe o produto em qualquer superfície limpa. Suba no estúdio de imagem e ajeite o fundo e a luz. Depois mande essa imagem pro image-to-video.",
        "Três passos, menos de cinco minutos, e o resultado parece que custou mil dólares.",
      ],
      cta: "Começar o fluxo", href: "/dashboard/models",
    },
  },
  {
    id: "a1-10-checklist", arc: 1,
    en: {
      subject: "Have you generated anything yet?",
      preheader: "Honest question.",
      headline: "THREE WEEKS IN",
      body: [
        "If you've already made your first video — great, the next emails will show you the tools you haven't touched yet.",
        "If you haven't, it's probably because you didn't know where to start. So start here: one product, one photo, one click.",
      ],
      cta: "Generate something now", href: "/dashboard/generate",
    },
    pt: {
      subject: "Você já gerou alguma coisa?",
      preheader: "Pergunta honesta.",
      headline: "TRÊS SEMANAS DEPOIS",
      body: [
        "Se você já fez seu primeiro vídeo — ótimo, os próximos e-mails vão te mostrar as ferramentas que você ainda não tocou.",
        "Se não fez, provavelmente é porque não soube por onde começar. Então comece aqui: um produto, uma foto, um clique.",
      ],
      cta: "Gerar alguma coisa agora", href: "/dashboard/generate",
    },
  },

  // ─── ARCO 2 — FEATURES ───────────────────────────────────────────────────
  {
    id: "a2-11-seedance", arc: 2,
    en: {
      subject: "Seedance 2.0: your workhorse",
      preheader: "ByteDance's flagship, inside NOVA.",
      headline: "SEEDANCE 2.0",
      body: [
        "This is the model behind most of what performs on TikTok right now. Text-to-video, image-to-video and reference-to-video — up to 10 seconds, up to 1080p.",
        "Reference-to-video is the hidden one: feed it a character image and it keeps the same face across every clip you generate.",
      ],
      cta: "Run Seedance", href: "/dashboard/models",
    },
    pt: {
      subject: "Seedance 2.0: seu cavalo de batalha",
      preheader: "O carro-chefe da ByteDance, dentro da NOVA.",
      headline: "SEEDANCE 2.0",
      body: [
        "É o modelo por trás de boa parte do que performa no TikTok hoje. Texto-pra-vídeo, imagem-pra-vídeo e referência-pra-vídeo — até 10 segundos, até 1080p.",
        "O referência-pra-vídeo é o escondido: você dá uma imagem de personagem e ele mantém o mesmo rosto em todos os clipes que você gerar.",
      ],
      cta: "Rodar o Seedance", href: "/dashboard/models",
    },
  },
  {
    id: "a2-12-veo", arc: 2,
    en: {
      subject: "Veo 3.1 generates sound too",
      preheader: "Most models don't. This one does.",
      headline: "VEO 3.1",
      body: [
        "Google DeepMind's model produces native audio alongside the video — ambience, foley, atmosphere. No separate soundtrack step.",
        "It's the most expensive engine here, so use it for the hero cut, not for testing.",
      ],
      cta: "Try Veo 3.1", href: "/dashboard/models",
    },
    pt: {
      subject: "O Veo 3.1 gera som também",
      preheader: "A maioria dos modelos não gera. Esse gera.",
      headline: "VEO 3.1",
      body: [
        "O modelo do Google DeepMind produz áudio nativo junto com o vídeo — ambiência, ruído, atmosfera. Sem etapa separada de trilha.",
        "É o motor mais caro daqui, então use pro corte principal, não pra testar.",
      ],
      cta: "Testar o Veo 3.1", href: "/dashboard/models",
    },
  },
  {
    id: "a2-13-kling", arc: 2,
    en: {
      subject: "When the shot has to look expensive",
      preheader: "Kling is the one you use for that.",
      headline: "KLING",
      body: [
        "Kling holds detail and physics better than almost anything else at this price — fabric moving, liquid pouring, hair in wind. The things that break in cheaper models.",
        "If your product is premium and the video has to sell that, this is the engine.",
      ],
      cta: "Generate with Kling", href: "/dashboard/models",
    },
    pt: {
      subject: "Quando a cena precisa parecer cara",
      preheader: "É pra isso que existe o Kling.",
      headline: "KLING",
      body: [
        "O Kling segura detalhe e física melhor que quase tudo nessa faixa de preço — tecido em movimento, líquido caindo, cabelo ao vento. Justamente o que quebra nos modelos baratos.",
        "Se o seu produto é premium e o vídeo precisa vender isso, é esse o motor.",
      ],
      cta: "Gerar com Kling", href: "/dashboard/models",
    },
  },
  {
    id: "a2-14-wan", arc: 2,
    en: {
      subject: "The cheap model you should use most",
      preheader: "Wan 2.2 is where your testing should live.",
      headline: "WAN 2.2",
      body: [
        "Open-source, fast, and a fraction of the cost of the premium engines. It's not the prettiest, but for finding out whether an idea works, it's perfect.",
        "Run ten concepts on Wan for the price of one on Veo. Then promote the winner.",
      ],
      cta: "Test on Wan 2.2", href: "/dashboard/models",
    },
    pt: {
      subject: "O modelo barato que você deveria usar mais",
      preheader: "É no Wan 2.2 que o seu teste tem que morar.",
      headline: "WAN 2.2",
      body: [
        "Open-source, rápido e uma fração do custo dos motores premium. Não é o mais bonito, mas pra descobrir se uma ideia funciona, é perfeito.",
        "Rode dez conceitos no Wan pelo preço de um no Veo. Depois promova o vencedor.",
      ],
      cta: "Testar no Wan 2.2", href: "/dashboard/models",
    },
  },
  {
    id: "a2-15-ugc", arc: 2,
    en: {
      subject: "UGC ads without hiring a creator",
      preheader: "The format that outperforms polished ads.",
      headline: "UGC CREATIVES",
      body: [
        "Handheld feel, natural light, real reaction. UGC beats studio ads on cold traffic almost every time, because it doesn't look like an ad.",
        "NOVA generates it from your product image — no creator fee, no shipping samples, no waiting a week.",
      ],
      cta: "Generate a UGC ad", href: "/dashboard/templates",
    },
    pt: {
      subject: "Anúncio UGC sem contratar criador",
      preheader: "O formato que bate anúncio produzido.",
      headline: "CRIATIVOS UGC",
      body: [
        "Câmera na mão, luz natural, reação real. UGC ganha de anúncio de estúdio em tráfego frio quase sempre, porque não parece anúncio.",
        "A NOVA gera isso a partir da sua imagem de produto — sem cachê de criador, sem enviar amostra, sem esperar uma semana.",
      ],
      cta: "Gerar um anúncio UGC", href: "/dashboard/templates",
    },
  },
  {
    id: "a2-16-avatar", arc: 2,
    en: {
      subject: "Turn a script into a presenter",
      preheader: "Talking Avatar, in your language.",
      headline: "TALKING AVATAR",
      body: [
        "Write what you want said. NOVA generates the voice and syncs it to a face — a real presenter delivering your script, with natural lip movement.",
        "Perfect for explainer content, product breakdowns and Shorts where someone has to talk to camera.",
      ],
      cta: "Create an avatar video", href: "/dashboard/talking-avatar",
    },
    pt: {
      subject: "Transforme um roteiro em apresentador",
      preheader: "Talking Avatar, no seu idioma.",
      headline: "TALKING AVATAR",
      body: [
        "Escreva o que quer que seja dito. A NOVA gera a voz e sincroniza com um rosto — um apresentador de verdade entregando seu roteiro, com movimento labial natural.",
        "Perfeito pra conteúdo explicativo, review de produto e Shorts onde alguém precisa falar pra câmera.",
      ],
      cta: "Criar vídeo com avatar", href: "/dashboard/talking-avatar",
    },
  },
  {
    id: "a2-17-extend", arc: 2,
    en: {
      subject: "5 seconds isn't enough? Extend it",
      preheader: "Continue any clip you've already made.",
      headline: "EXTEND VIDEO",
      body: [
        "Most models cap at 5 or 10 seconds. Extend takes the last frame of your clip and continues the motion from there, so you can build 20 or 30 seconds out of pieces.",
        "It's how you get a full ad instead of a loop.",
      ],
      cta: "Extend a video", href: "/dashboard/video-tools",
    },
    pt: {
      subject: "5 segundos não bastam? Estenda",
      preheader: "Continue qualquer clipe que você já fez.",
      headline: "EXTEND VIDEO",
      body: [
        "A maioria dos modelos trava em 5 ou 10 segundos. O Extend pega o último frame do seu clipe e continua o movimento dali, então dá pra montar 20 ou 30 segundos por pedaços.",
        "É assim que você tem um anúncio inteiro em vez de um loop.",
      ],
      cta: "Estender um vídeo", href: "/dashboard/video-tools",
    },
  },
  {
    id: "a2-18-story", arc: 2,
    en: {
      subject: "Stitch your clips into one video",
      preheader: "Story Studio does the editing for you.",
      headline: "STORY STUDIO",
      body: [
        "Generated four clips you like? Story Studio normalizes them to the same format and frame rate, joins them in order, and hands you one finished file.",
        "No editor, no timeline, no export settings to get wrong.",
      ],
      cta: "Open Story Studio", href: "/dashboard/story-studio",
    },
    pt: {
      subject: "Junte seus clipes num vídeo só",
      preheader: "O Story Studio edita por você.",
      headline: "STORY STUDIO",
      body: [
        "Gerou quatro clipes que você gostou? O Story Studio normaliza tudo no mesmo formato e frame rate, junta na ordem e te entrega um arquivo pronto.",
        "Sem editor, sem timeline, sem configuração de exportação pra errar.",
      ],
      cta: "Abrir o Story Studio", href: "/dashboard/story-studio",
    },
  },
  {
    id: "a2-19-music", arc: 2,
    en: {
      subject: "Upload a song, get a music video",
      preheader: "Scene by scene, from your lyrics.",
      headline: "MUSIC VIDEO",
      body: [
        "Paste the lyrics and NOVA builds a storyboard — one scene per section — then generates each clip and syncs the whole thing to your audio.",
        "Artists are using this to ship videos in an afternoon that used to take a crew and a budget.",
      ],
      cta: "Build a music video", href: "/dashboard/music-video",
    },
    pt: {
      subject: "Suba uma música, receba um clipe",
      preheader: "Cena por cena, a partir da sua letra.",
      headline: "MUSIC VIDEO",
      body: [
        "Cole a letra e a NOVA monta um storyboard — uma cena por trecho — depois gera cada clipe e sincroniza tudo com o seu áudio.",
        "Tem artista entregando numa tarde clipe que antes exigia equipe e orçamento.",
      ],
      cta: "Montar um clipe", href: "/dashboard/music-video",
    },
  },
  {
    id: "a2-20-claude", arc: 2,
    en: {
      subject: "Connect NOVA to Claude",
      preheader: "Generate videos by just asking.",
      headline: "NOVA + CLAUDE",
      body: [
        "NOVA runs a remote MCP server. Connect it to Claude and you can say \"make me six product ads for this perfume\" and it generates them — images, videos, campaign plan, even a full landing page.",
        "Almost nobody has this. You do.",
      ],
      cta: "Connect Claude", href: "/dashboard/claude-connect",
    },
    pt: {
      subject: "Conecte a NOVA ao Claude",
      preheader: "Gere vídeos só pedindo.",
      headline: "NOVA + CLAUDE",
      body: [
        "A NOVA roda um servidor MCP remoto. Conecte no Claude e você pode dizer \"me faz seis anúncios desse perfume\" e ele gera — imagens, vídeos, plano de campanha e até uma landing page inteira.",
        "Quase ninguém tem isso. Você tem.",
      ],
      cta: "Conectar o Claude", href: "/dashboard/claude-connect",
    },
  },

  // ─── ARCO 3 — NICHO E PROVA SOCIAL ───────────────────────────────────────
  {
    id: "a3-21-shopify", arc: 3,
    en: {
      subject: "Shopify stores: your product page is static",
      preheader: "Every competitor's is too. That's the opening.",
      headline: "FOR SHOPIFY SELLERS",
      body: [
        "A product page with a video converts measurably better than one with photos alone. Most stores in your category still have photos alone.",
        "One video per hero product. That's a weekend of work with NOVA and a permanent advantage.",
      ],
      cta: "Make product videos", href: "/product-ad-generator",
    },
    pt: {
      subject: "Lojas Shopify: sua página de produto é estática",
      preheader: "A do concorrente também. É aí que está a brecha.",
      headline: "PRA QUEM VENDE NO SHOPIFY",
      body: [
        "Página de produto com vídeo converte visivelmente melhor que só com foto. A maioria das lojas do seu nicho ainda está só com foto.",
        "Um vídeo por produto principal. Isso é um fim de semana de trabalho com a NOVA e uma vantagem permanente.",
      ],
      cta: "Fazer vídeos de produto", href: "/product-ad-generator",
    },
  },
  {
    id: "a3-22-tiktok", arc: 3,
    en: {
      subject: "TikTok Shop rewards volume",
      preheader: "The algorithm needs something to test.",
      headline: "FOR TIKTOK SELLERS",
      body: [
        "One creative won't find your audience. Twenty might. The sellers winning on TikTok Shop are shipping dozens of variations and letting the algorithm pick.",
        "That's only possible if each creative costs cents instead of hundreds.",
      ],
      cta: "Generate variations", href: "/dashboard/viral-templates",
    },
    pt: {
      subject: "TikTok Shop premia volume",
      preheader: "O algoritmo precisa de algo pra testar.",
      headline: "PRA QUEM VENDE NO TIKTOK",
      body: [
        "Um criativo não vai achar seu público. Vinte podem achar. Quem está ganhando no TikTok Shop está subindo dezenas de variações e deixando o algoritmo escolher.",
        "Isso só é possível se cada criativo custar centavos em vez de centenas.",
      ],
      cta: "Gerar variações", href: "/dashboard/viral-templates",
    },
  },
  {
    id: "a3-23-dropshipping", arc: 3,
    en: {
      subject: "You don't have the product in your hands",
      preheader: "You don't need it.",
      headline: "FOR DROPSHIPPERS",
      body: [
        "The classic dropshipping bottleneck: you can't film a product you've never touched, so you use the supplier's tired stock footage that fifty other stores are using.",
        "Take the supplier photo, run it through NOVA, and you have creative nobody else has.",
      ],
      cta: "Turn a photo into video", href: "/product-ad-generator",
    },
    pt: {
      subject: "Você não tem o produto em mãos",
      preheader: "E não precisa ter.",
      headline: "PRA QUEM FAZ DROPSHIPPING",
      body: [
        "O gargalo clássico do dropshipping: você não filma um produto que nunca tocou, então usa o vídeo genérico do fornecedor que outras cinquenta lojas também estão usando.",
        "Pegue a foto do fornecedor, passe pela NOVA e você tem criativo que mais ninguém tem.",
      ],
      cta: "Transformar foto em vídeo", href: "/product-ad-generator",
    },
  },
  {
    id: "a3-24-agency", arc: 3,
    en: {
      subject: "Agencies: your margin is in production cost",
      preheader: "Not in the retainer.",
      headline: "FOR AGENCIES",
      body: [
        "You're billing the client for creative and paying an editor for every round of revisions. That spread is where your profit lives, and it's thin.",
        "Generate the first three concepts in an hour, show the client, and only spend real production time on the one they pick.",
      ],
      cta: "See the API", href: "/dashboard/settings/api-keys",
    },
    pt: {
      subject: "Agências: a margem está no custo de produção",
      preheader: "Não está no fee.",
      headline: "PRA AGÊNCIAS",
      body: [
        "Você cobra criativo do cliente e paga editor a cada rodada de alteração. Essa diferença é onde mora seu lucro, e ela é apertada.",
        "Gere os três primeiros conceitos numa hora, mostre pro cliente, e só gaste produção de verdade no que ele escolher.",
      ],
      cta: "Ver a API", href: "/dashboard/settings/api-keys",
    },
  },
  {
    id: "a3-25-infoproduct", arc: 3,
    en: {
      subject: "Selling a course? Your ad is a talking head",
      preheader: "It doesn't have to be you.",
      headline: "FOR COURSE CREATORS",
      body: [
        "Info products live and die on the VSL. But recording yourself over and over, testing hooks, is exhausting and slow.",
        "Generate the presenter, test ten different openings, and only film yourself once you know which hook wins.",
      ],
      cta: "Try Talking Avatar", href: "/dashboard/talking-avatar",
    },
    pt: {
      subject: "Vende curso? Seu anúncio é uma cabeça falante",
      preheader: "Não precisa ser a sua.",
      headline: "PRA QUEM VENDE INFOPRODUTO",
      body: [
        "Infoproduto vive e morre na VSL. Mas gravar você mesmo repetidamente, testando ganchos, é exaustivo e lento.",
        "Gere o apresentador, teste dez aberturas diferentes, e só grave você depois de saber qual gancho ganha.",
      ],
      cta: "Testar o Talking Avatar", href: "/dashboard/talking-avatar",
    },
  },
  {
    id: "a3-26-fashion", arc: 3,
    en: {
      subject: "Fashion: movement sells the fabric",
      preheader: "A flat photo never will.",
      headline: "FOR CLOTHING BRANDS",
      body: [
        "Nobody buys a dress from a photo of it lying flat. They buy it when they see how it moves, how it catches light, how it falls.",
        "Kling in particular handles fabric physics well — that's the model to use here.",
      ],
      cta: "Animate a garment", href: "/dashboard/generate",
    },
    pt: {
      subject: "Moda: o movimento é que vende o tecido",
      preheader: "Foto parada nunca vai vender.",
      headline: "PRA MARCAS DE ROUPA",
      body: [
        "Ninguém compra um vestido vendo ele deitado numa foto. Compra quando vê como ele se move, como pega a luz, como cai.",
        "O Kling especificamente lida bem com física de tecido — é o modelo pra usar aqui.",
      ],
      cta: "Animar uma peça", href: "/dashboard/generate",
    },
  },
  {
    id: "a3-27-beauty", arc: 3,
    en: {
      subject: "Skincare: texture is the whole pitch",
      preheader: "Show the cream, not the jar.",
      headline: "FOR BEAUTY BRANDS",
      body: [
        "The serum drop, the cream swirl, the glass bottle catching light — those macro shots are what make beauty products feel worth the price.",
        "They're also expensive to film. Generate them instead.",
      ],
      cta: "Generate a beauty shot", href: "/dashboard/models",
    },
    pt: {
      subject: "Skincare: a textura é o argumento inteiro",
      preheader: "Mostre o creme, não o pote.",
      headline: "PRA MARCAS DE BELEZA",
      body: [
        "A gota do sérum, o rodopio do creme, o vidro pegando a luz — esses macros são o que fazem produto de beleza parecer valer o preço.",
        "E também são caros de filmar. Gere no lugar.",
      ],
      cta: "Gerar um macro de beleza", href: "/dashboard/models",
    },
  },
  {
    id: "a3-28-electronics", arc: 3,
    en: {
      subject: "Gadgets need the hero shot",
      preheader: "Dramatic reveal, dark background, one light.",
      headline: "FOR ELECTRONICS",
      body: [
        "Every phone launch uses the same formula: dark room, single rim light, slow rotation. It works because it makes the object look engineered.",
        "You can generate that exact look for your product in one prompt.",
      ],
      cta: "Make a hero shot", href: "/dashboard/generate",
    },
    pt: {
      subject: "Gadget precisa do hero shot",
      preheader: "Revelação dramática, fundo escuro, uma luz.",
      headline: "PRA ELETRÔNICOS",
      body: [
        "Todo lançamento de celular usa a mesma fórmula: sala escura, uma luz de contorno, giro lento. Funciona porque faz o objeto parecer projetado.",
        "Você consegue gerar esse mesmo visual pro seu produto em um prompt.",
      ],
      cta: "Fazer um hero shot", href: "/dashboard/generate",
    },
  },
  {
    id: "a3-29-food", arc: 3,
    en: {
      subject: "Food ads are 90% steam and motion",
      preheader: "Both are generatable.",
      headline: "FOR FOOD & DRINK",
      body: [
        "The pour, the steam, the condensation running down the glass, the cheese pull. Food advertising is built on a handful of motion clichés — and they work.",
        "Generate them in seconds instead of booking a food stylist.",
      ],
      cta: "Generate a food shot", href: "/dashboard/generate",
    },
    pt: {
      subject: "Anúncio de comida é 90% vapor e movimento",
      preheader: "Os dois dá pra gerar.",
      headline: "PRA COMIDA E BEBIDA",
      body: [
        "O líquido caindo, o vapor, a condensação escorrendo no copo, o queijo esticando. Publicidade de comida é feita de meia dúzia de clichês de movimento — e eles funcionam.",
        "Gere isso em segundos em vez de contratar food stylist.",
      ],
      cta: "Gerar cena de comida", href: "/dashboard/generate",
    },
  },
  {
    id: "a3-30-pet", arc: 3,
    en: {
      subject: "Pet content is the cheapest reach on the internet",
      preheader: "And you have a template for it.",
      headline: "FOR PET BRANDS",
      body: [
        "Pet videos get organic reach that paid media can't buy. The pet dance and talking animal templates exist precisely because they travel.",
        "If you sell anything pet-adjacent, this is free distribution sitting in your dashboard.",
      ],
      cta: "Try the pet templates", href: "/dashboard/viral-templates",
    },
    pt: {
      subject: "Conteúdo de pet é o alcance mais barato da internet",
      preheader: "E você tem template pronto pra isso.",
      headline: "PRA MARCAS PET",
      body: [
        "Vídeo de pet pega alcance orgânico que mídia paga não compra. Os templates de pet dançando e animal falando existem justamente porque eles viajam.",
        "Se você vende qualquer coisa ligada a pet, isso é distribuição de graça parada no seu painel.",
      ],
      cta: "Testar os templates de pet", href: "/dashboard/viral-templates",
    },
  },

  // ─── ARCO 4 — OBJEÇÕES ───────────────────────────────────────────────────
  {
    id: "a4-31-price", arc: 4,
    en: {
      subject: "\"It's too expensive\"",
      preheader: "Compared to what, exactly?",
      headline: "LET'S DO THE MATH",
      body: [
        "One product video from a production company starts around $800 and takes two weeks. One month of NOVA costs less than dinner and gives you dozens.",
        "The question isn't whether NOVA is cheap. It's whether you can afford to keep paying production prices.",
      ],
      cta: "Compare plans", href: "/pricing",
    },
    pt: {
      subject: "\"Está caro\"",
      preheader: "Caro comparado com o quê, exatamente?",
      headline: "VAMOS FAZER A CONTA",
      body: [
        "Um vídeo de produto numa produtora começa em uns R$ 4.000 e leva duas semanas. Um mês de NOVA custa menos que um jantar e te dá dezenas.",
        "A pergunta não é se a NOVA é barata. É se você aguenta continuar pagando preço de produtora.",
      ],
      cta: "Comparar planos", href: "/pricing",
    },
  },
  {
    id: "a4-32-no-prompt-skill", arc: 4,
    en: {
      subject: "\"I don't know how to write prompts\"",
      preheader: "Then don't write any.",
      headline: "YOU DON'T HAVE TO",
      body: [
        "That's exactly what the templates are for. Each one has a professionally tuned prompt already inside it. You upload an image and press a button.",
        "Prompt writing is optional in NOVA. It always was.",
      ],
      cta: "Use a template instead", href: "/dashboard/viral-templates",
    },
    pt: {
      subject: "\"Eu não sei escrever prompt\"",
      preheader: "Então não escreva nenhum.",
      headline: "VOCÊ NÃO PRECISA",
      body: [
        "É exatamente pra isso que existem os templates. Cada um já tem um prompt profissional ajustado dentro dele. Você sobe uma imagem e aperta um botão.",
        "Escrever prompt é opcional na NOVA. Sempre foi.",
      ],
      cta: "Usar um template", href: "/dashboard/viral-templates",
    },
  },
  {
    id: "a4-33-realism", arc: 4,
    en: {
      subject: "\"AI video still looks fake\"",
      preheader: "It did. Eighteen months ago.",
      headline: "GO LOOK AGAIN",
      body: [
        "If your opinion of AI video was formed by what you saw in 2024, it's out of date. Seedance 2.0, Veo 3.1 and Kling are a different generation of model entirely.",
        "Don't take our word for it — the explore page is full of real, unedited output.",
      ],
      cta: "See real output", href: "/explore",
    },
    pt: {
      subject: "\"Vídeo de IA ainda parece falso\"",
      preheader: "Parecia. Dezoito meses atrás.",
      headline: "OLHA DE NOVO",
      body: [
        "Se a sua opinião sobre vídeo de IA se formou com o que você viu em 2024, ela está desatualizada. Seedance 2.0, Veo 3.1 e Kling são outra geração de modelo.",
        "Não acredite na nossa palavra — a página de explorar está cheia de resultado real, sem edição.",
      ],
      cta: "Ver resultado real", href: "/explore",
    },
  },
  {
    id: "a4-34-no-time", arc: 4,
    en: {
      subject: "\"I don't have time for this\"",
      preheader: "It takes less time than reading this email.",
      headline: "SIXTY SECONDS",
      body: [
        "Upload photo. Pick template. Press generate. Close the tab and come back in a minute — the video is waiting in your projects.",
        "The version of you that has no time is exactly who this was built for.",
      ],
      cta: "Do it in 60 seconds", href: "/dashboard/viral-templates",
    },
    pt: {
      subject: "\"Não tenho tempo pra isso\"",
      preheader: "Leva menos tempo que ler este e-mail.",
      headline: "SESSENTA SEGUNDOS",
      body: [
        "Sobe a foto. Escolhe o template. Aperta gerar. Fecha a aba e volta daqui a um minuto — o vídeo está esperando nos seus projetos.",
        "A versão de você que não tem tempo é exatamente pra quem isso foi feito.",
      ],
      cta: "Fazer em 60 segundos", href: "/dashboard/viral-templates",
    },
  },
  {
    id: "a4-35-boring-product", arc: 4,
    en: {
      subject: "\"My product is too boring for video\"",
      preheader: "There is no boring product. Only boring framing.",
      headline: "NOTHING IS BORING",
      body: [
        "Screws, filters, phone cases, cleaning cloths — all of it has been sold in millions of units by someone who framed it well.",
        "Dramatic light and a slow camera move make anything look considered. That's the whole trick.",
      ],
      cta: "Prove it with yours", href: "/dashboard/generate",
    },
    pt: {
      subject: "\"Meu produto é chato demais pra vídeo\"",
      preheader: "Não existe produto chato. Existe enquadramento chato.",
      headline: "NADA É CHATO",
      body: [
        "Parafuso, filtro, capinha de celular, pano de limpeza — tudo isso já foi vendido aos milhões por alguém que enquadrou bem.",
        "Luz dramática e um movimento lento de câmera fazem qualquer coisa parecer pensada. É esse o truque inteiro.",
      ],
      cta: "Prove com o seu", href: "/dashboard/generate",
    },
  },
  {
    id: "a4-36-have-photos", arc: 4,
    en: {
      subject: "\"I already have good photos\"",
      preheader: "Good. Now make them move.",
      headline: "PHOTOS AREN'T ENOUGH",
      body: [
        "Your photos are the raw material, not the finish line. Image-to-video takes the shot you already paid for and gives it a second life as an ad.",
        "You're sitting on assets you haven't finished using.",
      ],
      cta: "Animate your photos", href: "/dashboard/generate",
    },
    pt: {
      subject: "\"Eu já tenho fotos boas\"",
      preheader: "Ótimo. Agora faça elas se mexerem.",
      headline: "FOTO NÃO BASTA",
      body: [
        "Suas fotos são matéria-prima, não linha de chegada. O imagem-pra-vídeo pega a foto que você já pagou e dá uma segunda vida a ela como anúncio.",
        "Você está sentado em cima de material que não terminou de usar.",
      ],
      cta: "Animar suas fotos", href: "/dashboard/generate",
    },
  },
  {
    id: "a4-37-wont-convert", arc: 4,
    en: {
      subject: "\"What if it doesn't convert?\"",
      preheader: "Then you learned that for a few dollars.",
      headline: "THAT'S THE POINT",
      body: [
        "The expensive version of being wrong is spending two weeks and a production budget on a creative that flops. The cheap version is generating five and finding out on Tuesday.",
        "NOVA doesn't guarantee conversion. It makes being wrong affordable.",
      ],
      cta: "Test five concepts", href: "/dashboard/generate",
    },
    pt: {
      subject: "\"E se não converter?\"",
      preheader: "Aí você descobriu isso por alguns reais.",
      headline: "É EXATAMENTE ESSE O PONTO",
      body: [
        "A versão cara de estar errado é gastar duas semanas e um orçamento de produção num criativo que morre. A versão barata é gerar cinco e descobrir na terça.",
        "A NOVA não garante conversão. Ela torna o erro barato.",
      ],
      cta: "Testar cinco conceitos", href: "/dashboard/generate",
    },
  },
  {
    id: "a4-38-brand-control", arc: 4,
    en: {
      subject: "\"I'd lose control of my brand look\"",
      preheader: "Brand Kit exists for exactly this.",
      headline: "YOUR RULES, ENFORCED",
      body: [
        "Load your colors, your reference images and your visual direction into Brand Kit, and every generation starts from your identity instead of a generic one.",
        "Consistency isn't something you give up. It's something you configure once.",
      ],
      cta: "Set up Brand Kit", href: "/dashboard/brandkit",
    },
    pt: {
      subject: "\"Eu perderia o controle do visual da marca\"",
      preheader: "O Brand Kit existe exatamente pra isso.",
      headline: "SUAS REGRAS, APLICADAS",
      body: [
        "Carregue suas cores, suas imagens de referência e sua direção visual no Brand Kit, e toda geração parte da sua identidade em vez de uma genérica.",
        "Consistência não é algo que você abre mão. É algo que você configura uma vez.",
      ],
      cta: "Configurar o Brand Kit", href: "/dashboard/brandkit",
    },
  },
  {
    id: "a4-39-hire-editor", arc: 4,
    en: {
      subject: "\"I'd rather hire an editor\"",
      preheader: "Then hire one — for the final 10%.",
      headline: "IT'S NOT EITHER/OR",
      body: [
        "An editor is worth paying for polish, pacing and the final cut. An editor is not worth paying to explore twenty concepts that might not work.",
        "Use NOVA for the exploration. Use your editor for the finish.",
      ],
      cta: "Explore concepts fast", href: "/dashboard/generate",
    },
    pt: {
      subject: "\"Prefiro contratar um editor\"",
      preheader: "Então contrate — pros últimos 10%.",
      headline: "NÃO É UM OU OUTRO",
      body: [
        "Editor vale o que se paga por acabamento, ritmo e corte final. Editor não vale o que se paga pra explorar vinte conceitos que talvez não funcionem.",
        "Use a NOVA pra exploração. Use seu editor pro acabamento.",
      ],
      cta: "Explorar conceitos rápido", href: "/dashboard/generate",
    },
  },
  {
    id: "a4-40-wait", arc: 4,
    en: {
      subject: "\"I'll wait until AI gets better\"",
      preheader: "Your competitor won't.",
      headline: "WAITING IS A CHOICE",
      body: [
        "AI video will keep improving — that's certain. What's also certain is that the advantage of being early disappears the moment everyone catches up.",
        "The people winning with this right now started before it was obvious.",
      ],
      cta: "Start now", href: "/dashboard/generate",
    },
    pt: {
      subject: "\"Vou esperar a IA melhorar\"",
      preheader: "Seu concorrente não vai esperar.",
      headline: "ESPERAR TAMBÉM É ESCOLHA",
      body: [
        "Vídeo por IA vai continuar melhorando — isso é certo. Também é certo que a vantagem de chegar cedo some no instante em que todo mundo alcança.",
        "Quem está ganhando com isso agora começou antes de ser óbvio.",
      ],
      cta: "Começar agora", href: "/dashboard/generate",
    },
  },

  // ─── ARCO 5 — OFERTA E URGÊNCIA ──────────────────────────────────────────
  {
    id: "a5-41-cost-of-nothing", arc: 5,
    en: {
      subject: "What it costs to have no video",
      preheader: "The invisible bill nobody adds up.",
      headline: "THE COST OF STANDING STILL",
      body: [
        "Every visitor who leaves your product page without buying because there was nothing to hold their attention is a cost. You just never see the invoice.",
        "That number is almost always bigger than a subscription.",
      ],
      cta: "See plans", href: "/pricing",
    },
    pt: {
      subject: "O que custa não ter vídeo",
      preheader: "A conta invisível que ninguém soma.",
      headline: "O CUSTO DE FICAR PARADO",
      body: [
        "Cada visitante que sai da sua página de produto sem comprar porque não teve nada que segurasse a atenção é um custo. Você só nunca vê a fatura.",
        "Esse número quase sempre é maior que uma assinatura.",
      ],
      cta: "Ver planos", href: "/pricing",
    },
  },
  {
    id: "a5-42-vs-agency", arc: 5,
    en: {
      subject: "One agency video vs one year of NOVA",
      preheader: "Side by side.",
      headline: "RUN THE NUMBERS",
      body: [
        "A single 15-second product spot from a studio: four figures, two to three weeks, one deliverable, revisions billed extra.",
        "A year of NOVA: less than that one video, available today, unlimited revisions because regenerating is the revision.",
      ],
      cta: "Compare plans", href: "/pricing",
    },
    pt: {
      subject: "Um vídeo de agência vs um ano de NOVA",
      preheader: "Lado a lado.",
      headline: "FAÇA A CONTA",
      body: [
        "Um único spot de produto de 15 segundos numa produtora: quatro dígitos, duas a três semanas, uma entrega, alteração cobrada à parte.",
        "Um ano de NOVA: menos que aquele único vídeo, disponível hoje, alteração ilimitada porque regerar é a alteração.",
      ],
      cta: "Comparar planos", href: "/pricing",
    },
  },
  {
    id: "a5-43-plan-compare", arc: 5,
    en: {
      subject: "Which NOVA plan is actually yours",
      preheader: "Honest breakdown, no upsell.",
      headline: "PICK YOUR TIER",
      body: [
        "Testing the water and posting occasionally? The entry plan is enough. Running paid traffic and needing fresh creative weekly? You need the volume tier.",
        "Buying more than you'll use is as wasteful as buying too little. Match it to your actual output.",
      ],
      cta: "Find your plan", href: "/pricing",
    },
    pt: {
      subject: "Qual plano da NOVA é realmente o seu",
      preheader: "Comparação honesta, sem empurrar.",
      headline: "ESCOLHA SEU NÍVEL",
      body: [
        "Testando o terreno e postando de vez em quando? O plano de entrada dá conta. Rodando tráfego pago e precisando de criativo novo toda semana? Você precisa do plano de volume.",
        "Comprar mais do que vai usar desperdiça tanto quanto comprar de menos. Case com a sua produção real.",
      ],
      cta: "Achar meu plano", href: "/pricing",
    },
  },
  {
    id: "a5-44-annual", arc: 5,
    en: {
      subject: "Annual costs less. Here's the actual difference",
      preheader: "No trick, just the math.",
      headline: "MONTHLY VS ANNUAL",
      body: [
        "Annual billing is meaningfully cheaper per month than paying month to month. If you already know you'll use NOVA past the next quarter, monthly is just a more expensive way to buy the same thing.",
        "If you're not sure yet, stay monthly. That's fine too.",
      ],
      cta: "See both prices", href: "/pricing",
    },
    pt: {
      subject: "O anual sai mais barato. Essa é a diferença real",
      preheader: "Sem pegadinha, só a conta.",
      headline: "MENSAL VS ANUAL",
      body: [
        "O anual sai sensivelmente mais barato por mês que pagar mês a mês. Se você já sabe que vai usar a NOVA além do próximo trimestre, o mensal é só um jeito mais caro de comprar a mesma coisa.",
        "Se ainda não tem certeza, fique no mensal. Também está tudo bem.",
      ],
      cta: "Ver os dois preços", href: "/pricing",
    },
  },
  {
    id: "a5-45-right-volume", arc: 5,
    en: {
      subject: "How many videos do you actually need a month?",
      preheader: "Answer that and the plan picks itself.",
      headline: "START FROM OUTPUT",
      body: [
        "Two or three posts a week means roughly a dozen creatives a month. Running paid traffic properly means several times that, because most of them are tests you'll kill.",
        "Count backwards from how often you publish, not from the price.",
      ],
      cta: "Match a plan", href: "/pricing",
    },
    pt: {
      subject: "Quantos vídeos você precisa por mês, de verdade?",
      preheader: "Responda isso e o plano se escolhe sozinho.",
      headline: "COMECE PELA PRODUÇÃO",
      body: [
        "Dois ou três posts por semana dão uma dúzia de criativos por mês. Rodar tráfego pago direito dá várias vezes isso, porque a maioria é teste que você vai matar.",
        "Conte de trás pra frente a partir da sua frequência de publicação, não do preço.",
      ],
      cta: "Casar com um plano", href: "/pricing",
    },
  },
  {
    id: "a5-46-credits", arc: 5,
    en: {
      subject: "How credits actually work",
      preheader: "So there are no surprises.",
      headline: "CREDITS, EXPLAINED",
      body: [
        "Video costs credits based on length and model — cheap engines cost a fraction of premium ones. Images are far cheaper than video, which is why we keep telling you to prototype with images.",
        "Your balance is always visible in the dashboard, and nothing is charged without showing you the price first.",
      ],
      cta: "Check your balance", href: "/dashboard",
    },
    pt: {
      subject: "Como os créditos funcionam de verdade",
      preheader: "Pra não ter surpresa.",
      headline: "CRÉDITOS, EXPLICADO",
      body: [
        "Vídeo custa créditos conforme a duração e o modelo — motor barato custa uma fração do premium. Imagem é muito mais barata que vídeo, e é por isso que insistimos em prototipar com imagem.",
        "Seu saldo fica sempre visível no painel, e nada é cobrado sem te mostrar o preço antes.",
      ],
      cta: "Ver meu saldo", href: "/dashboard",
    },
  },
  {
    id: "a5-47-api", arc: 5,
    en: {
      subject: "Generate at scale with the API",
      preheader: "For when the dashboard isn't fast enough.",
      headline: "NOVA API",
      body: [
        "Create an API key and drive NOVA from your own scripts, your backend, or from Claude directly. Batch a hundred product videos from a CSV while you sleep.",
        "This is how agencies and larger stores use NOVA.",
      ],
      cta: "Get an API key", href: "/dashboard/settings/api-keys",
    },
    pt: {
      subject: "Gere em escala com a API",
      preheader: "Pra quando o painel não é rápido o bastante.",
      headline: "API DA NOVA",
      body: [
        "Crie uma API key e comande a NOVA pelos seus próprios scripts, seu backend ou direto do Claude. Gere cem vídeos de produto a partir de um CSV enquanto você dorme.",
        "É assim que agências e lojas maiores usam a NOVA.",
      ],
      cta: "Pegar uma API key", href: "/dashboard/settings/api-keys",
    },
  },
  {
    id: "a5-48-batch-day", arc: 5,
    en: {
      subject: "30 creatives in one afternoon",
      preheader: "A workflow you can copy exactly.",
      headline: "THE BATCH DAY",
      body: [
        "Pick five products. Generate three image directions each. Animate the two best per product. Cut them into 9:16 and 1:1. That's 30 assets and it fits in an afternoon.",
        "Then you don't think about creative again for a month.",
      ],
      cta: "Start your batch day", href: "/dashboard/generate",
    },
    pt: {
      subject: "30 criativos numa tarde",
      preheader: "Um fluxo que você pode copiar igual.",
      headline: "O DIA DE LOTE",
      body: [
        "Escolha cinco produtos. Gere três direções de imagem pra cada. Anime as duas melhores por produto. Corte em 9:16 e 1:1. São 30 peças e cabe numa tarde.",
        "Aí você não pensa em criativo de novo por um mês.",
      ],
      cta: "Começar meu dia de lote", href: "/dashboard/generate",
    },
  },
  {
    id: "a5-49-offer", arc: 5,
    en: {
      subject: "A better price, for a short window",
      preheader: "Details inside.",
      headline: "LIMITED WINDOW",
      body: [
        "We're opening a better rate on the annual plans for a short period. Same models, same features, lower monthly cost locked for the year.",
        "If you've been on the fence since email one, this is the cheapest this gets.",
      ],
      cta: "See the offer", href: "/pricing",
    },
    pt: {
      subject: "Um preço melhor, por uma janela curta",
      preheader: "Detalhes aqui dentro.",
      headline: "JANELA LIMITADA",
      body: [
        "Estamos abrindo uma condição melhor nos planos anuais por um período curto. Mesmos modelos, mesmos recursos, custo mensal mais baixo travado pelo ano.",
        "Se você está em cima do muro desde o primeiro e-mail, é o mais barato que isso fica.",
      ],
      cta: "Ver a condição", href: "/pricing",
    },
  },
  {
    id: "a5-50-last-call", arc: 5,
    en: {
      subject: "Last call on that rate",
      preheader: "Closing soon.",
      headline: "LAST CALL",
      body: [
        "The annual rate we opened is closing. After that it goes back to standard pricing and stays there.",
        "No pressure tactics beyond this: it's simply cheaper now than it will be next week.",
      ],
      cta: "Lock the rate", href: "/pricing",
    },
    pt: {
      subject: "Última chamada dessa condição",
      preheader: "Fecha em breve.",
      headline: "ÚLTIMA CHAMADA",
      body: [
        "A condição anual que abrimos está fechando. Depois disso volta pro preço padrão e fica lá.",
        "Sem tática de pressão além disso: simplesmente está mais barato agora do que estará semana que vem.",
      ],
      cta: "Travar a condição", href: "/pricing",
    },
  },

  // ─── ARCO 6 — WIN-BACK ───────────────────────────────────────────────────
  {
    id: "a6-51-miss-you", arc: 6,
    en: {
      subject: "Your account is still here",
      preheader: "Nothing was deleted.",
      headline: "STILL YOURS",
      body: [
        "Your NOVA account, your projects and anything you generated are exactly where you left them.",
        "If life got busy, that's fair. The door's open whenever you want to pick it back up.",
      ],
      cta: "Open my dashboard", href: "/dashboard",
    },
    pt: {
      subject: "Sua conta continua aqui",
      preheader: "Nada foi apagado.",
      headline: "AINDA É SUA",
      body: [
        "Sua conta na NOVA, seus projetos e tudo que você gerou estão exatamente onde você deixou.",
        "Se a vida apertou, tudo bem. A porta fica aberta pra quando você quiser retomar.",
      ],
      cta: "Abrir meu painel", href: "/dashboard",
    },
  },
  {
    id: "a6-52-whats-new", arc: 6,
    en: {
      subject: "What changed since you last logged in",
      preheader: "Quite a lot, actually.",
      headline: "WHAT'S NEW",
      body: [
        "New models, faster generation, better templates, and tools that didn't exist when you signed up — Story Studio, Music Video, the Claude connector.",
        "The NOVA you tried and the NOVA that exists now aren't the same product.",
      ],
      cta: "See what's new", href: "/dashboard",
    },
    pt: {
      subject: "O que mudou desde seu último acesso",
      preheader: "Bastante coisa, na verdade.",
      headline: "O QUE É NOVO",
      body: [
        "Modelos novos, geração mais rápida, templates melhores e ferramentas que nem existiam quando você se cadastrou — Story Studio, Music Video, o conector do Claude.",
        "A NOVA que você testou e a NOVA que existe hoje não são o mesmo produto.",
      ],
      cta: "Ver as novidades", href: "/dashboard",
    },
  },
  {
    id: "a6-53-new-models", arc: 6,
    en: {
      subject: "The models got dramatically better",
      preheader: "This is the part worth coming back for.",
      headline: "NEW ENGINES",
      body: [
        "Seedance 2.0, Veo 3.1 and Kling have all shipped major versions recently. Motion is steadier, faces hold, and text inside images finally renders correctly.",
        "Whatever disappointed you before is probably fixed.",
      ],
      cta: "Try the new models", href: "/dashboard/models",
    },
    pt: {
      subject: "Os modelos melhoraram muito",
      preheader: "Essa é a parte que vale a volta.",
      headline: "MOTORES NOVOS",
      body: [
        "Seedance 2.0, Veo 3.1 e Kling lançaram versões grandes recentemente. O movimento está mais estável, o rosto se mantém, e texto dentro de imagem finalmente sai correto.",
        "O que te decepcionou antes provavelmente já foi resolvido.",
      ],
      cta: "Testar os modelos novos", href: "/dashboard/models",
    },
  },
  {
    id: "a6-54-free-one", arc: 6,
    en: {
      subject: "One on us, to see the difference",
      preheader: "No strings.",
      headline: "ON THE HOUSE",
      body: [
        "Come back and generate one video on us. We think seeing the current output quality will do more than any email we could write.",
        "If it's still not for you after that, we'll stop.",
      ],
      cta: "Claim it", href: "/dashboard/generate",
    },
    pt: {
      subject: "Um por nossa conta, pra você ver a diferença",
      preheader: "Sem pegadinha.",
      headline: "POR NOSSA CONTA",
      body: [
        "Volte e gere um vídeo por nossa conta. A gente acha que ver a qualidade atual vale mais que qualquer e-mail que a gente escreva.",
        "Se depois disso ainda não for pra você, a gente para.",
      ],
      cta: "Resgatar", href: "/dashboard/generate",
    },
  },
  {
    id: "a6-55-what-was-missing", arc: 6,
    en: {
      subject: "What was missing for you?",
      preheader: "Genuinely asking. Just reply.",
      headline: "TELL US",
      body: [
        "You signed up, which means something about this looked useful. Then you stopped, which means something didn't deliver.",
        "Reply to this email and tell us which. A person reads these.",
      ],
      cta: "Or talk to us here", href: "/contact",
    },
    pt: {
      subject: "O que faltou pra você?",
      preheader: "Pergunta sincera. É só responder.",
      headline: "NOS CONTA",
      body: [
        "Você se cadastrou, o que significa que algo aqui pareceu útil. Depois parou, o que significa que algo não entregou.",
        "Responda este e-mail e diga qual das duas coisas. Tem gente lendo.",
      ],
      cta: "Ou fale com a gente aqui", href: "/contact",
    },
  },
  {
    id: "a6-56-common-blocker", arc: 6,
    en: {
      subject: "It was probably this",
      preheader: "The most common reason people stop.",
      headline: "WE'VE SEEN THIS BEFORE",
      body: [
        "Almost everyone who stops does it at the same point: the first generation didn't look like what was in their head, and they assumed the tool couldn't do it.",
        "It usually could. The prompt just needed the camera and the lighting spelled out.",
      ],
      cta: "Try one more time", href: "/dashboard/generate",
    },
    pt: {
      subject: "Provavelmente foi isso",
      preheader: "O motivo mais comum de as pessoas pararem.",
      headline: "A GENTE JÁ VIU ISSO",
      body: [
        "Quase todo mundo que para, para no mesmo ponto: a primeira geração não saiu igual ao que estava na cabeça, e a pessoa concluiu que a ferramenta não dava conta.",
        "Geralmente dava. Só faltava no prompt dizer a câmera e a luz.",
      ],
      cta: "Tentar mais uma vez", href: "/dashboard/generate",
    },
  },
  {
    id: "a6-57-quick-case", arc: 6,
    en: {
      subject: "Same product, two creatives",
      preheader: "One converted 4x better.",
      headline: "IT'S THE CREATIVE",
      body: [
        "The difference between an ad that works and one that doesn't is almost never the product or the targeting. It's the first two seconds of the creative.",
        "Which means the only way to find the winner is to make more of them.",
      ],
      cta: "Make more creatives", href: "/dashboard/viral-templates",
    },
    pt: {
      subject: "Mesmo produto, dois criativos",
      preheader: "Um converteu 4x melhor.",
      headline: "É O CRIATIVO",
      body: [
        "A diferença entre um anúncio que funciona e um que não funciona quase nunca é o produto ou a segmentação. São os dois primeiros segundos do criativo.",
        "O que significa que o único jeito de achar o vencedor é fazer mais deles.",
      ],
      cta: "Fazer mais criativos", href: "/dashboard/viral-templates",
    },
  },
  {
    id: "a6-58-discount", arc: 6,
    en: {
      subject: "Come back at a lower price",
      preheader: "A returning-user rate.",
      headline: "WELCOME BACK RATE",
      body: [
        "We'd rather have you back at a discount than not have you at all. There's a returning-user price waiting on your account.",
        "Same models, same everything. Just cheaper.",
      ],
      cta: "See the rate", href: "/pricing",
    },
    pt: {
      subject: "Volte por um preço menor",
      preheader: "Uma condição de retorno.",
      headline: "CONDIÇÃO DE VOLTA",
      body: [
        "A gente prefere você de volta com desconto do que não ter você. Tem uma condição de retorno esperando na sua conta.",
        "Mesmos modelos, mesma coisa toda. Só mais barato.",
      ],
      cta: "Ver a condição", href: "/pricing",
    },
  },
  {
    id: "a6-59-before-you-go", arc: 6,
    en: {
      subject: "Before you go",
      preheader: "We're winding these emails down.",
      headline: "ONE MORE THING",
      body: [
        "This sequence is nearly over — you won't be hearing from us like this much longer.",
        "If you were ever going to try NOVA properly, now's a good moment. Everything is still exactly where you left it.",
      ],
      cta: "Give it one shot", href: "/dashboard/generate",
    },
    pt: {
      subject: "Antes de você ir",
      preheader: "A gente está encerrando esses e-mails.",
      headline: "MAIS UMA COISA",
      body: [
        "Essa sequência está quase no fim — você não vai mais ouvir da gente assim por muito tempo.",
        "Se em algum momento você ia testar a NOVA de verdade, agora é uma boa hora. Está tudo exatamente onde você deixou.",
      ],
      cta: "Dar uma chance", href: "/dashboard/generate",
    },
  },
  {
    id: "a6-60-goodbye", arc: 6,
    en: {
      subject: "That's the last one",
      preheader: "Thanks for the time either way.",
      headline: "SIGNING OFF",
      body: [
        "This is the final email in this sequence. We won't keep filling your inbox — your account stays open and free to use whenever you want it.",
        "If you ever need product video, you know where we are. Thanks for reading this far.",
      ],
      cta: "Visit NOVA", href: "/dashboard",
    },
    pt: {
      subject: "Esse é o último",
      preheader: "Obrigado pelo tempo, de qualquer forma.",
      headline: "NOS DESPEDINDO",
      body: [
        "Este é o último e-mail desta sequência. A gente não vai continuar enchendo sua caixa — sua conta continua aberta e livre pra usar quando quiser.",
        "Se um dia você precisar de vídeo de produto, você sabe onde a gente está. Obrigado por ler até aqui.",
      ],
      cta: "Visitar a NOVA", href: "/dashboard",
    },
  },
];

export const TOTAL_EMAILS = EMAILS.length;
