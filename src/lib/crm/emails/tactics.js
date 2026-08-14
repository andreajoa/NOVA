/**
 * Camada de conversão dos e-mails — separada de content.js de propósito.
 *
 * content.js  = a mensagem (assunto, headline, corpo)
 * tactics.js  = o que faz ela vender (Hormozi + Gary Vee)
 *
 * Manter separado deixa o RITMO visível num arquivo só: dá pra bater o olho e
 * ver se a proporção jab/hook está certa sem ler 60 e-mails.
 *
 *   tactic — o bloco que ENSINA algo aplicável hoje, de graça, sem pagar nada.
 *            Hormozi: "give away the secrets, sell the implementation".
 *            É o que faz o e-mail ser guardado em vez de deletado.
 *   proof  — número concreto. Especificidade vende, adjetivo não.
 *   ps     — segunda linha mais lida do e-mail depois do assunto. Nunca desperdiçar.
 *   ask    — 'jab' (valor puro, CTA discreto) · 'hook' (o pedido, botão sólido)
 *
 * RITMO (Gary Vee, jab jab jab right hook): ~3 jabs para cada hook.
 * Arco 5 é o único que concentra hooks — é o arco de oferta, ele existe pra pedir.
 */

export const TACTICS = {
  // ─── ARCO 1 — ATIVAÇÃO ───────────────────────────────────────────────────
  "a1-01-welcome": {
    ask: "jab",
    en: {
      tactic: { label: "Do this in 60 seconds", text: "Type your product name, add \"on black background, slow camera push-in, dramatic side lighting\", pick Wan 2.2, hit generate. That single sentence is already a better prompt than 90% of what people write." },
      ps: "The first video you make will be your worst one. Make it today so you can stop dreading it.",
    },
    pt: {
      tactic: { label: "Faça isso em 60 segundos", text: "Escreva o nome do seu produto, acrescente \"fundo preto, câmera se aproximando lentamente, luz lateral dramática\", escolha Wan 2.2 e gere. Essa frase sozinha já é um prompt melhor que 90% do que as pessoas escrevem." },
      ps: "O primeiro vídeo que você fizer vai ser o pior. Faça hoje pra parar de ter medo dele.",
    },
  },
  "a1-02-prompt-anatomy": {
    ask: "jab",
    en: {
      tactic: { label: "Copy this formula", text: "[subject] + [what it's doing] + [camera move] + [lighting] + [background]. Fill those five slots and you never write a bad prompt again. Missing the camera and lighting is what makes output look amateur." },
      ps: "Save this email. You'll use that formula more than anything else in NOVA.",
    },
    pt: {
      tactic: { label: "Copie esta fórmula", text: "[sujeito] + [o que ele faz] + [movimento de câmera] + [luz] + [fundo]. Preencha esses cinco campos e você nunca mais escreve um prompt ruim. Faltar câmera e luz é o que deixa o resultado com cara de amador." },
      ps: "Guarde este e-mail. Você vai usar essa fórmula mais do que qualquer outra coisa na NOVA.",
    },
  },
  "a1-03-image-first": {
    ask: "jab",
    en: {
      tactic: { label: "The cheap workflow", text: "Generate 4 images of the same product with different backgrounds. Pick the one that looks most expensive. Only then send it to image-to-video. You'll spend a fraction of the credits and get a better result." },
      proof: { stat: "1/10", caption: "what an image costs compared to a video generation" },
      ps: "Prototyping in images is the single biggest credit-saver in the whole platform.",
    },
    pt: {
      tactic: { label: "O fluxo barato", text: "Gere 4 imagens do mesmo produto com fundos diferentes. Escolha a que parece mais cara. Só então mande pro imagem-pra-vídeo. Você gasta uma fração dos créditos e chega num resultado melhor." },
      proof: { stat: "1/10", caption: "é o que uma imagem custa comparada a uma geração de vídeo" },
      ps: "Prototipar em imagem é a maior economia de créditos da plataforma inteira.",
    },
  },
  "a1-04-model-picker": {
    ask: "hook",
    en: {
      tactic: { label: "The two-pass method", text: "Pass one: run your idea 5 times on the cheapest model until the framing is right. Pass two: take the winning prompt and run it once on the premium model. Same result as 5 premium runs, at a fraction of the cost." },
      ps: "Nobody generates their final cut on the first try. Budget for the iterations, not the masterpiece.",
    },
    pt: {
      tactic: { label: "O método das duas passadas", text: "Primeira passada: rode a ideia 5 vezes no modelo mais barato até o enquadramento ficar certo. Segunda: pegue o prompt vencedor e rode uma vez no premium. Mesmo resultado de 5 rodadas premium, por uma fração do custo." },
      ps: "Ninguém gera o corte final na primeira tentativa. Faça orçamento pras iterações, não pra obra-prima.",
    },
  },
  "a1-05-format": {
    ask: "jab",
    en: {
      tactic: { label: "Frame for the thumb", text: "In 9:16, put the product in the top two-thirds of the frame. The bottom third gets covered by captions, usernames and the UI on every single platform. Most people lose their hero to a caption bar." },
      ps: "Generate vertical first, always. You can crop vertical to square. You can't crop horizontal to vertical.",
    },
    pt: {
      tactic: { label: "Enquadre pro dedão", text: "No 9:16, coloque o produto nos dois terços de cima. O terço de baixo é coberto por legenda, @ e interface em toda plataforma. A maioria perde o produto atrás da barra de legenda." },
      ps: "Gere vertical primeiro, sempre. Dá pra cortar vertical em quadrado. Não dá pra cortar horizontal em vertical.",
    },
  },
  "a1-06-first-product-ad": {
    ask: "jab",
    en: {
      tactic: { label: "Steal this shot list", text: "Every product ad that works has the same three shots: the hero (product alone, dramatic light), the context (product in use), the detail (macro of the texture or finish). Generate those three and you have a complete ad." },
      ps: "Three shots. That's the entire structure of a commercial that cost someone $50,000.",
    },
    pt: {
      tactic: { label: "Roube esta lista de planos", text: "Todo anúncio de produto que funciona tem os mesmos três planos: o hero (produto sozinho, luz dramática), o contexto (produto em uso) e o detalhe (macro da textura ou do acabamento). Gere esses três e você tem um anúncio completo." },
      ps: "Três planos. É a estrutura inteira de um comercial que custou R$ 250 mil pra alguém.",
    },
  },
  "a1-07-templates": {
    ask: "hook",
    en: {
      tactic: { label: "Which template to start with", text: "If you sell a physical product, start with \"UGC Product Demo\". If you sell anything else, start with \"Add Hook to Image\". Those two cover most of what actually converts on cold traffic." },
      ps: "The templates aren't training wheels. Half our heaviest users never write a prompt at all.",
    },
    pt: {
      tactic: { label: "Por qual template começar", text: "Se você vende produto físico, comece pelo \"UGC Product Demo\". Se vende qualquer outra coisa, comece pelo \"Add Hook to Image\". Esses dois cobrem a maior parte do que converte em tráfego frio." },
      ps: "Os templates não são rodinha de bicicleta. Metade dos nossos usuários pesados nunca escreve um prompt.",
    },
  },
  "a1-08-mistake": {
    ask: "jab",
    en: {
      tactic: { label: "Change one variable", text: "When a generation misses, don't rewrite the prompt. Change exactly one thing — the lighting, or the camera move, or the background — and run again. You'll find the problem in 3 tries instead of 30." },
      proof: { stat: "3 vs 30", caption: "tries to get a usable shot, with and without this habit" },
      ps: "This is the difference between people who think AI video works and people who think it doesn't.",
    },
    pt: {
      tactic: { label: "Mude uma variável", text: "Quando a geração erra, não reescreva o prompt. Mude exatamente uma coisa — a luz, ou o movimento de câmera, ou o fundo — e rode de novo. Você acha o problema em 3 tentativas em vez de 30." },
      proof: { stat: "3 vs 30", caption: "tentativas até um resultado usável, com e sem esse hábito" },
      ps: "É essa a diferença entre quem acha que vídeo por IA funciona e quem acha que não funciona.",
    },
  },
  "a1-09-photo-to-video": {
    ask: "jab",
    en: {
      tactic: { label: "Shoot it right on your phone", text: "Put the product near a window, not under a ceiling light. Use a plain wall or a sheet of paper as backdrop. Shoot slightly above eye level. That's a usable product photo, taken in 30 seconds, for free." },
      ps: "The better your input photo, the less work the model has to do — and the more it looks like your actual product.",
    },
    pt: {
      tactic: { label: "Fotografe certo no celular", text: "Coloque o produto perto de uma janela, não embaixo da luz do teto. Use uma parede lisa ou uma folha de papel como fundo. Fotografe um pouco acima da altura dos olhos. Isso é uma foto de produto usável, feita em 30 segundos, de graça." },
      ps: "Quanto melhor a foto de entrada, menos trabalho o modelo tem — e mais parece o seu produto de verdade.",
    },
  },
  "a1-10-checklist": {
    ask: "hook",
    en: {
      tactic: { label: "The 10-minute unblock", text: "Open the dashboard. Pick any template. Upload any photo from your phone. Generate. Don't judge the result, don't optimize it, don't post it. The only goal is to stop being someone who hasn't tried." },
      ps: "Most accounts that never generate anything in week one never generate anything at all. Don't be that number.",
    },
    pt: {
      tactic: { label: "O desbloqueio de 10 minutos", text: "Abra o painel. Escolha qualquer template. Suba qualquer foto do celular. Gere. Não julgue o resultado, não otimize, não poste. O único objetivo é deixar de ser alguém que nunca tentou." },
      ps: "A maioria das contas que não gera nada na primeira semana nunca gera nada. Não seja esse número.",
    },
  },

  // ─── ARCO 2 — FEATURES ───────────────────────────────────────────────────
  "a2-11-seedance": {
    ask: "jab",
    en: {
      tactic: { label: "Lock your character's face", text: "Use reference-to-video with the same portrait every time and your presenter keeps the same face across every clip. That's how you build a recognizable brand character without hiring anyone." },
      ps: "Consistent character across 30 videos is worth more than 30 beautiful unrelated ones.",
    },
    pt: {
      tactic: { label: "Trave o rosto do seu personagem", text: "Use referência-pra-vídeo com o mesmo retrato sempre e seu apresentador mantém o mesmo rosto em todos os clipes. É assim que se constrói um personagem de marca reconhecível sem contratar ninguém." },
      ps: "Personagem consistente em 30 vídeos vale mais que 30 vídeos lindos sem relação entre si.",
    },
  },
  "a2-12-veo": {
    ask: "jab",
    en: {
      tactic: { label: "Describe the sound too", text: "Veo generates audio from your prompt, so write it. \"Rain on a window, distant traffic, no music\" gives you an atmosphere. Leave it out and you get whatever the model guesses." },
      ps: "Save Veo for the one cut you'll actually run ads with. Test everything else on Wan.",
    },
    pt: {
      tactic: { label: "Descreva o som também", text: "O Veo gera áudio a partir do seu prompt, então escreva o áudio. \"Chuva na janela, trânsito ao longe, sem música\" te dá uma atmosfera. Se você omitir, recebe o que o modelo adivinhar." },
      ps: "Guarde o Veo pro único corte que você vai realmente subir como anúncio. Teste o resto no Wan.",
    },
  },
  "a2-13-kling": {
    ask: "jab",
    en: {
      tactic: { label: "Where Kling earns its price", text: "Anything with physics — liquid pouring, fabric falling, hair moving, smoke. Cheaper models break exactly there. If your shot has one of those four, Kling is worth the extra credits." },
      ps: "If your shot has no motion physics in it, you're paying premium for nothing. Use Wan.",
    },
    pt: {
      tactic: { label: "Onde o Kling justifica o preço", text: "Qualquer coisa com física — líquido caindo, tecido em queda, cabelo em movimento, fumaça. Os modelos baratos quebram exatamente aí. Se a sua cena tem um desses quatro, o Kling vale os créditos extras." },
      ps: "Se a sua cena não tem física de movimento, você está pagando premium à toa. Use o Wan.",
    },
  },
  "a2-14-wan": {
    ask: "hook",
    en: {
      tactic: { label: "Your testing budget", text: "Set a rule: no idea gets a premium generation until it has survived three Wan generations. It costs almost nothing to enforce and it will roughly triple how far your credits go." },
      proof: { stat: "10x", caption: "more concepts tested for the same spend" },
      ps: "The people who complain credits run out fast are almost always testing on premium models.",
    },
    pt: {
      tactic: { label: "Seu orçamento de teste", text: "Estabeleça uma regra: nenhuma ideia ganha geração premium antes de sobreviver a três gerações no Wan. Não custa quase nada aplicar isso e faz seus créditos renderem cerca de três vezes mais." },
      proof: { stat: "10x", caption: "mais conceitos testados pelo mesmo gasto" },
      ps: "Quem reclama que os créditos acabam rápido quase sempre está testando em modelo premium.",
    },
  },
  "a2-15-ugc": {
    ask: "jab",
    en: {
      tactic: { label: "The UGC hook formula", text: "First two seconds: state the problem out loud. \"I kept ruining my hair with heat.\" Then show the product. Never open with the product — open with the pain the viewer already has." },
      ps: "Polished ads get scrolled past. Slightly imperfect ones get watched. That's not an accident.",
    },
    pt: {
      tactic: { label: "A fórmula do gancho UGC", text: "Dois primeiros segundos: diga o problema em voz alta. \"Eu vivia queimando meu cabelo com secador.\" Só então mostre o produto. Nunca abra com o produto — abra com a dor que o espectador já tem." },
      ps: "Anúncio produzido demais é rolado. O levemente imperfeito é assistido. Isso não é acidente.",
    },
  },
  "a2-16-avatar": {
    ask: "jab",
    en: {
      tactic: { label: "Script length that works", text: "Aim for 40 to 60 words for a 20-second avatar clip. Write it the way you'd say it out loud, contractions and all. Written-English scripts sound robotic no matter how good the voice model is." },
      ps: "Read your script out loud before generating. If you stumble, the avatar will too.",
    },
    pt: {
      tactic: { label: "Tamanho de roteiro que funciona", text: "Mire de 40 a 60 palavras pra um clipe de avatar de 20 segundos. Escreva do jeito que você falaria, com as contrações e tudo. Roteiro escrito em português formal soa robótico por melhor que seja a voz." },
      ps: "Leia seu roteiro em voz alta antes de gerar. Se você tropeçar, o avatar tropeça também.",
    },
  },
  "a2-17-extend": {
    ask: "jab",
    en: {
      tactic: { label: "Build a 20-second ad", text: "Generate a 5-second hero shot. Extend it with \"camera pulls back to reveal the full setup\". Extend again with \"hand enters frame and picks up the product\". Three generations, one continuous 15-second ad." },
      ps: "Write each extension prompt as a continuation, not a new scene. \"Camera continues...\" beats \"a new shot of...\".",
    },
    pt: {
      tactic: { label: "Monte um anúncio de 20 segundos", text: "Gere um hero de 5 segundos. Estenda com \"a câmera se afasta revelando o cenário completo\". Estenda de novo com \"uma mão entra em quadro e pega o produto\". Três gerações, um anúncio contínuo de 15 segundos." },
      ps: "Escreva cada prompt de extensão como continuação, não como cena nova. \"A câmera continua...\" ganha de \"um novo plano de...\".",
    },
  },
  "a2-18-story": {
    ask: "hook",
    en: {
      tactic: { label: "Order matters more than quality", text: "Hook clip first, product clip second, proof clip third, CTA clip last. A mediocre clip in the right position outperforms a beautiful one in the wrong position, every time." },
      ps: "If the first clip doesn't earn the second, nothing after it matters.",
    },
    pt: {
      tactic: { label: "A ordem importa mais que a qualidade", text: "Clipe de gancho primeiro, produto em segundo, prova em terceiro, CTA por último. Um clipe mediano na posição certa bate um clipe lindo na posição errada, sempre." },
      ps: "Se o primeiro clipe não conquista o segundo, nada depois dele importa.",
    },
  },
  "a2-19-music": {
    ask: "jab",
    en: {
      tactic: { label: "One image per line", text: "When you paste lyrics, break them so each scene covers one concrete image, not one verse. \"Driving through the city at night\" is a scene. A whole chorus is four scenes fighting each other." },
      ps: "Abstract lyrics generate abstract video. Give the model something it can point a camera at.",
    },
    pt: {
      tactic: { label: "Uma imagem por linha", text: "Ao colar a letra, quebre de forma que cada cena cubra uma imagem concreta, não um verso inteiro. \"Dirigindo pela cidade à noite\" é uma cena. Um refrão inteiro são quatro cenas brigando entre si." },
      ps: "Letra abstrata gera vídeo abstrato. Dê ao modelo algo que dê pra apontar uma câmera.",
    },
  },
  "a2-20-claude": {
    ask: "hook",
    en: {
      tactic: { label: "The prompt to paste into Claude", text: "\"Using NOVA, create 6 product ad concepts for [your product] targeting [your audience]. Generate the hero image for the best 3.\" Claude writes the prompts, picks the models and runs them for you." },
      ps: "This turns a full afternoon of creative work into one sentence and a coffee break.",
    },
    pt: {
      tactic: { label: "O prompt pra colar no Claude", text: "\"Usando a NOVA, crie 6 conceitos de anúncio pro [seu produto] mirando [seu público]. Gere a imagem hero dos 3 melhores.\" O Claude escreve os prompts, escolhe os modelos e roda tudo pra você." },
      ps: "Isso transforma uma tarde inteira de criação em uma frase e uma pausa pro café.",
    },
  },

  // ─── ARCO 3 — NICHO E PROVA SOCIAL ───────────────────────────────────────
  "a3-21-shopify": {
    ask: "jab",
    en: {
      tactic: { label: "Where to put the video", text: "Above the fold, autoplaying, muted, looping, under 8 seconds. Not in a tab. Not below the reviews. If the visitor has to click to see it, most of them never will." },
      proof: { stat: "80%", caption: "of stores in most categories still ship photo-only product pages" },
      ps: "Start with your single best-selling product. One video, one page. Measure before you scale it.",
    },
    pt: {
      tactic: { label: "Onde colocar o vídeo", text: "Acima da dobra, com autoplay, mudo, em loop, com menos de 8 segundos. Não numa aba. Não abaixo das avaliações. Se o visitante precisa clicar pra ver, a maioria nunca vai ver." },
      proof: { stat: "80%", caption: "das lojas na maioria dos nichos ainda tem página de produto só com foto" },
      ps: "Comece pelo seu produto mais vendido. Um vídeo, uma página. Meça antes de escalar.",
    },
  },
  "a3-22-tiktok": {
    ask: "jab",
    en: {
      tactic: { label: "The variation grid", text: "Take one winning concept and change only the first 2 seconds — 5 different hooks, same body. That's 5 creatives from one idea, and it isolates exactly which hook the algorithm likes." },
      ps: "Don't test 5 different videos. Test 5 different openings of the same video. That's how you learn something.",
    },
    pt: {
      tactic: { label: "A grade de variação", text: "Pegue um conceito vencedor e mude só os 2 primeiros segundos — 5 ganchos diferentes, mesmo corpo. São 5 criativos de uma ideia só, e isso isola exatamente qual gancho o algoritmo gosta." },
      ps: "Não teste 5 vídeos diferentes. Teste 5 aberturas do mesmo vídeo. É assim que se aprende alguma coisa.",
    },
  },
  "a3-23-dropshipping": {
    ask: "hook",
    en: {
      tactic: { label: "Beat the supplier footage", text: "Run the supplier's product photo through image-to-image first with \"studio lighting, clean white background, professional product photography\". Then animate that. Now your creative shares nothing with your competitors'." },
      ps: "If your ad looks identical to four other stores', you're competing on price. That's a losing game.",
    },
    pt: {
      tactic: { label: "Supere o vídeo do fornecedor", text: "Passe a foto do fornecedor primeiro no imagem-pra-imagem com \"luz de estúdio, fundo branco limpo, fotografia profissional de produto\". Depois anime essa. Agora seu criativo não tem nada em comum com o do concorrente." },
      ps: "Se o seu anúncio é idêntico ao de outras quatro lojas, você está competindo por preço. Esse jogo é perdido.",
    },
  },
  "a3-24-agency": {
    ask: "jab",
    en: {
      tactic: { label: "Change your pitch meeting", text: "Stop showing clients mood boards. Generate three actual moving concepts before the meeting and show those instead. Clients approve what they can see, and you stop paying for revision rounds on a misunderstanding." },
      proof: { stat: "3 concepts", caption: "you can now bring to a pitch for less than one hour of an editor's time" },
      ps: "The agency that shows moving concepts in the first meeting wins the account. Every time.",
    },
    pt: {
      tactic: { label: "Mude sua reunião de apresentação", text: "Pare de mostrar moodboard pro cliente. Gere três conceitos em movimento de verdade antes da reunião e mostre isso. Cliente aprova o que ele consegue ver, e você para de pagar rodada de alteração por mal-entendido." },
      proof: { stat: "3 conceitos", caption: "que você leva pra uma reunião por menos de uma hora de editor" },
      ps: "A agência que mostra conceito em movimento na primeira reunião ganha a conta. Sempre.",
    },
  },
  "a3-25-infoproduct": {
    ask: "jab",
    en: {
      tactic: { label: "Test hooks before you film", text: "Generate 8 avatar clips, each with a different opening line for your VSL. Run them as ads for a day. Then film yourself saying only the one that won. You've just skipped weeks of guessing." },
      ps: "Your face converts better than a generated one. But your time is worth more than testing with it.",
    },
    pt: {
      tactic: { label: "Teste ganchos antes de gravar", text: "Gere 8 clipes de avatar, cada um com uma abertura diferente pra sua VSL. Rode como anúncio por um dia. Depois grave você dizendo só a que ganhou. Você acabou de pular semanas de chute." },
      ps: "Seu rosto converte mais que um gerado. Mas seu tempo vale mais do que usar ele pra testar.",
    },
  },
  "a3-26-fashion": {
    ask: "jab",
    en: {
      tactic: { label: "The prompt words that matter", text: "\"Fabric flowing in slow motion\", \"garment catching backlight\", \"model turning, skirt trailing\". Fashion converts on movement of material — name the material and the movement explicitly or you'll get a mannequin." },
      ps: "Nobody ever bought a coat because of a flat-lay. They bought it because they saw it walk.",
    },
    pt: {
      tactic: { label: "As palavras de prompt que importam", text: "\"Tecido fluindo em câmera lenta\", \"peça pegando contraluz\", \"modelo girando, saia acompanhando\". Moda converte no movimento do material — nomeie o material e o movimento explicitamente ou você recebe um manequim." },
      ps: "Ninguém nunca comprou um casaco por causa de uma foto deitada. Compraram porque viram ele andar.",
    },
  },
  "a3-27-beauty": {
    ask: "hook",
    en: {
      tactic: { label: "Three shots that sell skincare", text: "The drop falling from the dropper. The cream swirling on skin. The bottle rotating with light moving across the glass. Generate those three, cut them together, and you have the standard beauty ad." },
      ps: "Beauty buyers are buying a texture and a feeling. Photos can't show either one.",
    },
    pt: {
      tactic: { label: "Três planos que vendem skincare", text: "A gota caindo do conta-gotas. O creme rodopiando na pele. O frasco girando com a luz correndo pelo vidro. Gere esses três, junte e você tem o anúncio padrão de beleza." },
      ps: "Quem compra beleza está comprando uma textura e uma sensação. Foto não mostra nenhuma das duas.",
    },
  },
  "a3-28-electronics": {
    ask: "jab",
    en: {
      tactic: { label: "The Apple lighting recipe", text: "\"Dark studio, single rim light from behind, subtle reflection on the surface, slow 45-degree rotation, deep shadows.\" That prompt is the entire visual language of tech advertising, and it works on anything with a hard edge." },
      ps: "This same recipe works on a power bank, a knife, a watch, a bottle. Anything with a defined silhouette.",
    },
    pt: {
      tactic: { label: "A receita de luz da Apple", text: "\"Estúdio escuro, uma luz de contorno vindo de trás, reflexo sutil na superfície, giro lento de 45 graus, sombras profundas.\" Esse prompt é a linguagem visual inteira da publicidade de tecnologia, e funciona em qualquer coisa com aresta." },
      ps: "Essa mesma receita funciona em power bank, faca, relógio, garrafa. Qualquer coisa com silhueta definida.",
    },
  },
  "a3-29-food": {
    ask: "jab",
    en: {
      tactic: { label: "The four food clichés", text: "The pour. The steam rising. Condensation on cold glass. The pull or the cut revealing the inside. Every food ad you've ever seen uses at least two. Generate them, don't book a food stylist." },
      ps: "Food photography is 90% moisture and light. Both of those are just words in a prompt now.",
    },
    pt: {
      tactic: { label: "Os quatro clichês de comida", text: "O líquido caindo. O vapor subindo. A condensação no copo gelado. O corte ou a puxada revelando o interior. Todo anúncio de comida que você já viu usa pelo menos dois. Gere isso, não contrate food stylist." },
      ps: "Fotografia de comida é 90% umidade e luz. Hoje as duas coisas são só palavras num prompt.",
    },
  },
  "a3-30-pet": {
    ask: "hook",
    en: {
      tactic: { label: "Why pet content travels", text: "Pet videos get shared, and shares are the only reach you don't pay for. Even if you sell something unrelated, one pet video a week feeding your account costs you nothing and buys you an audience." },
      proof: { stat: "0", caption: "what organic reach costs, compared to paid" },
      ps: "Gary Vee built an empire on this exact idea: give the platform what it wants, then sell once it's listening.",
    },
    pt: {
      tactic: { label: "Por que conteúdo de pet viaja", text: "Vídeo de pet é compartilhado, e compartilhamento é o único alcance que você não paga. Mesmo que você venda outra coisa, um vídeo de pet por semana alimentando sua conta não te custa nada e te compra audiência." },
      proof: { stat: "R$ 0", caption: "é o que custa alcance orgânico, comparado ao pago" },
      ps: "O Gary Vee construiu um império nessa ideia: dê à plataforma o que ela quer, e venda depois que ela estiver ouvindo.",
    },
  },

  // ─── ARCO 4 — OBJEÇÕES ───────────────────────────────────────────────────
  "a4-31-price": {
    ask: "jab",
    en: {
      tactic: { label: "Work out your real number", text: "Take what you'd pay for one produced video. Divide by how many creatives you actually need this quarter. That per-creative number is what you're really comparing against — and it's almost never close." },
      ps: "Price is only ever a problem in the absence of value. Run the division before you decide.",
    },
    pt: {
      tactic: { label: "Descubra seu número real", text: "Pegue o que você pagaria por um vídeo produzido. Divida pela quantidade de criativos que você realmente precisa neste trimestre. Esse valor por criativo é o que você está comparando de verdade — e quase nunca fica perto." },
      ps: "Preço só é problema na ausência de valor. Faça a divisão antes de decidir.",
    },
  },
  "a4-32-no-prompt-skill": {
    ask: "jab",
    en: {
      tactic: { label: "Never write a prompt again", text: "Open Viral Templates, pick one, upload your image, press generate. The prompt is already written and tuned. If you can send a WhatsApp message, you can operate NOVA." },
      ps: "Prompt writing is a skill worth having, not a barrier to entry. Skip it entirely until you want it.",
    },
    pt: {
      tactic: { label: "Nunca mais escreva um prompt", text: "Abra os Templates Virais, escolha um, suba sua imagem e aperte gerar. O prompt já está escrito e ajustado. Se você consegue mandar mensagem no WhatsApp, você consegue operar a NOVA." },
      ps: "Escrever prompt é habilidade que vale ter, não barreira de entrada. Pule isso até você querer aprender.",
    },
  },
  "a4-33-realism": {
    ask: "hook",
    en: {
      tactic: { label: "Judge it yourself", text: "Open the explore page and look at raw, unedited output from the current models. Don't take a marketing email's word for whether AI video is good enough. Ten seconds of looking beats any claim we could make." },
      ps: "The models improved more in the last year than in the four before it. Your opinion may be running on old data.",
    },
    pt: {
      tactic: { label: "Julgue você mesmo", text: "Abra a página de explorar e olhe resultado cru, sem edição, dos modelos atuais. Não acredite num e-mail de marketing sobre se vídeo de IA está bom o bastante. Dez segundos olhando valem mais que qualquer afirmação nossa." },
      ps: "Os modelos melhoraram mais no último ano do que nos quatro anteriores. Sua opinião pode estar rodando com dado velho.",
    },
  },
  "a4-34-no-time": {
    ask: "jab",
    en: {
      tactic: { label: "The batch habit", text: "Don't make videos when you need them. Block one hour a month, generate everything for the next 30 days in that hour, and never think about creative again until the next block." },
      ps: "Creative work done in scattered 10-minute panics is why it feels like it takes forever.",
    },
    pt: {
      tactic: { label: "O hábito do lote", text: "Não faça vídeo quando você precisa dele. Bloqueie uma hora por mês, gere tudo dos próximos 30 dias nessa hora, e não pense mais em criativo até o próximo bloco." },
      ps: "Trabalho criativo feito em pânicos espalhados de 10 minutos é o motivo de parecer que leva uma eternidade.",
    },
  },
  "a4-35-boring-product": {
    ask: "jab",
    en: {
      tactic: { label: "Sell the outcome, not the object", text: "Don't generate a video of the object. Generate the moment it solves something — the clean surface, the finished meal, the relieved face. Boring products become interesting the second you show the result." },
      ps: "Nobody wants a drill. They want a hole. Nobody wants your product. They want what happens after.",
    },
    pt: {
      tactic: { label: "Venda o resultado, não o objeto", text: "Não gere um vídeo do objeto. Gere o momento em que ele resolve algo — a superfície limpa, o prato pronto, o rosto aliviado. Produto chato fica interessante no segundo em que você mostra o resultado." },
      ps: "Ninguém quer uma furadeira. Quer um furo. Ninguém quer seu produto. Quer o que acontece depois dele.",
    },
  },
  "a4-36-have-photos": {
    ask: "hook",
    en: {
      tactic: { label: "Mine your existing assets", text: "Go through your product photos from the last two years. Every single one is an input for image-to-video. You already paid for that shoot — this is a second return on the same money." },
      ps: "You're sitting on a library of unfinished assets. Most brands have hundreds.",
    },
    pt: {
      tactic: { label: "Minere o que você já tem", text: "Vasculhe suas fotos de produto dos últimos dois anos. Cada uma delas é entrada pro imagem-pra-vídeo. Você já pagou por aquele ensaio — isso é um segundo retorno sobre o mesmo dinheiro." },
      ps: "Você está sentado numa biblioteca de material inacabado. A maioria das marcas tem centenas.",
    },
  },
  "a4-37-wont-convert": {
    ask: "jab",
    en: {
      tactic: { label: "Make being wrong cheap", text: "The goal isn't to be right on the first creative. It's to make each attempt cost so little that being wrong nine times still leaves you ahead. That's the entire economics of performance creative." },
      proof: { stat: "1 in 10", caption: "roughly how many creatives actually win, even for good marketers" },
      ps: "Everyone's hit rate is low. The winners just take more shots.",
    },
    pt: {
      tactic: { label: "Deixe o erro barato", text: "O objetivo não é acertar no primeiro criativo. É fazer cada tentativa custar tão pouco que errar nove vezes ainda te deixa no lucro. É essa a economia inteira do criativo de performance." },
      proof: { stat: "1 em 10", caption: "mais ou menos quantos criativos realmente ganham, mesmo pra bons profissionais" },
      ps: "A taxa de acerto de todo mundo é baixa. Os vencedores só tentam mais vezes.",
    },
  },
  "a4-38-brand-control": {
    ask: "jab",
    en: {
      tactic: { label: "Build your prompt preset", text: "Write one paragraph describing your brand's look — palette, lighting, mood, surfaces — and paste it at the end of every prompt. That single habit gives you visual consistency across hundreds of generations." },
      ps: "Configure it once in Brand Kit and you stop having to remember it at all.",
    },
    pt: {
      tactic: { label: "Monte seu preset de prompt", text: "Escreva um parágrafo descrevendo o visual da sua marca — paleta, luz, clima, superfícies — e cole no fim de todo prompt. Esse único hábito te dá consistência visual em centenas de gerações." },
      ps: "Configure uma vez no Brand Kit e você para de precisar lembrar disso.",
    },
  },
  "a4-39-hire-editor": {
    ask: "jab",
    en: {
      tactic: { label: "Split the job correctly", text: "Machine does exploration — 20 concepts, fast, disposable. Human does the finish — pacing, sound design, the final 10% that makes it feel intentional. Paying a human for exploration is where budgets die." },
      ps: "Your editor will thank you for arriving with a chosen direction instead of a maybe.",
    },
    pt: {
      tactic: { label: "Divida o trabalho direito", text: "A máquina faz a exploração — 20 conceitos, rápido, descartável. O humano faz o acabamento — ritmo, som, os últimos 10% que fazem parecer intencional. Pagar humano pra explorar é onde o orçamento morre." },
      ps: "Seu editor vai te agradecer por chegar com uma direção escolhida em vez de um talvez.",
    },
  },
  "a4-40-wait": {
    ask: "hook",
    en: {
      tactic: { label: "The only thing that expires", text: "The models will keep improving whether you use them or not. What won't wait is the window where your competitors haven't figured this out yet. That window is the actual asset." },
      ps: "Everyone who says \"I'll wait for it to get better\" is describing a tool that already got better while they waited.",
    },
    pt: {
      tactic: { label: "A única coisa que expira", text: "Os modelos vão continuar melhorando, você usando ou não. O que não espera é a janela em que seus concorrentes ainda não sacaram isso. Essa janela é o ativo de verdade." },
      ps: "Todo mundo que diz \"vou esperar melhorar\" está descrevendo uma ferramenta que já melhorou enquanto esperava.",
    },
  },

  // ─── ARCO 5 — OFERTA (concentração de hooks) ─────────────────────────────
  "a5-41-cost-of-nothing": {
    ask: "hook",
    en: {
      tactic: { label: "Calculate the invisible bill", text: "Multiply your monthly product page visitors by your conversion rate. Now add half a percent to that rate. That difference, in revenue, is what a video on the page is worth to you every month." },
      ps: "The cost of doing nothing never shows up on an invoice. That's exactly why it's the expensive option.",
    },
    pt: {
      tactic: { label: "Calcule a conta invisível", text: "Multiplique seus visitantes mensais na página de produto pela sua taxa de conversão. Agora some meio ponto percentual nessa taxa. Essa diferença, em faturamento, é quanto um vídeo na página vale pra você por mês." },
      ps: "O custo de não fazer nada nunca aparece numa fatura. É exatamente por isso que é a opção cara.",
    },
  },
  "a5-42-vs-agency": {
    ask: "hook",
    en: {
      tactic: { label: "The comparison that matters", text: "Don't compare NOVA's price to zero. Compare it to what you'd spend getting the same number of usable creatives any other way — including your own hours, which are not free." },
      ps: "Free is never free. It's just a cost that shows up in your calendar instead of your card statement.",
    },
    pt: {
      tactic: { label: "A comparação que importa", text: "Não compare o preço da NOVA com zero. Compare com o que você gastaria pra obter a mesma quantidade de criativos usáveis de qualquer outra forma — incluindo suas próprias horas, que não são de graça." },
      ps: "De graça nunca é de graça. É só um custo que aparece na sua agenda em vez de na fatura do cartão.",
    },
  },
  "a5-43-plan-compare": {
    ask: "hook",
    en: {
      tactic: { label: "Pick by output, not by price", text: "Count how many creatives you'll publish per month. Multiply by three, because most of what you generate is a test you'll discard. That number is your plan." },
      ps: "Buying the biggest plan you can afford is as wrong as buying the smallest. Match it to output.",
    },
    pt: {
      tactic: { label: "Escolha pela produção, não pelo preço", text: "Conte quantos criativos você vai publicar por mês. Multiplique por três, porque a maior parte do que você gera é teste que vai ser descartado. Esse número é o seu plano." },
      ps: "Comprar o maior plano que cabe no bolso é tão errado quanto comprar o menor. Case com a produção.",
    },
  },
  "a5-44-annual": {
    ask: "hook",
    en: {
      tactic: { label: "The honest rule", text: "If you're confident you'll still be making video in four months, annual is simply cheaper for the same thing. If you're not confident, stay monthly — paying more for optionality is a legitimate choice." },
      ps: "We'd rather you pick right than pick big. Wrong-sized plans get cancelled.",
    },
    pt: {
      tactic: { label: "A regra honesta", text: "Se você tem confiança de que ainda vai estar fazendo vídeo daqui a quatro meses, o anual é simplesmente mais barato pela mesma coisa. Se não tem, fique no mensal — pagar mais por flexibilidade é escolha legítima." },
      ps: "A gente prefere que você escolha certo do que escolha grande. Plano do tamanho errado é cancelado.",
    },
  },
  "a5-45-right-volume": {
    ask: "hook",
    en: {
      tactic: { label: "Your monthly number", text: "Posting 3x a week on one channel: about 12 published creatives, so 35 generated. Running paid traffic seriously: 3 to 5x that. Write your number down before you look at any pricing page." },
      ps: "Decide what you need before you see what things cost. It's the only way to not be sold to.",
    },
    pt: {
      tactic: { label: "Seu número mensal", text: "Postando 3x por semana num canal: cerca de 12 criativos publicados, ou seja 35 gerados. Rodando tráfego pago pra valer: de 3 a 5 vezes isso. Anote seu número antes de olhar qualquer página de preço." },
      ps: "Decida o que você precisa antes de ver quanto custa. É o único jeito de não ser vendido.",
    },
  },
  "a5-46-credits": {
    ask: "jab",
    en: {
      tactic: { label: "Make credits last", text: "Prototype in images. Test on the cheap model. Only spend premium credits on something you've already validated. Those three rules will roughly triple the output you get from the same balance." },
      ps: "Nothing gets charged without showing you the price first. Check the estimate before every premium run.",
    },
    pt: {
      tactic: { label: "Faça os créditos renderem", text: "Prototipe em imagem. Teste no modelo barato. Só gaste crédito premium em algo que você já validou. Essas três regras triplicam mais ou menos o que você tira do mesmo saldo." },
      ps: "Nada é cobrado sem te mostrar o preço antes. Confira a estimativa antes de toda rodada premium.",
    },
  },
  "a5-47-api": {
    ask: "hook",
    en: {
      tactic: { label: "Automate the boring part", text: "Export your catalog to CSV. Loop it through the NOVA API with one prompt template. Come back to a video for every product you sell. That's a script you write once and run forever." },
      ps: "This is how the stores with 400 SKUs get video on every page. Not by working harder.",
    },
    pt: {
      tactic: { label: "Automatize a parte chata", text: "Exporte seu catálogo pra CSV. Passe num loop pela API da NOVA com um template de prompt. Volte e tenha um vídeo pra cada produto que você vende. É um script que você escreve uma vez e roda pra sempre." },
      ps: "É assim que lojas com 400 SKUs têm vídeo em toda página. Não é trabalhando mais.",
    },
  },
  "a5-48-batch-day": {
    ask: "hook",
    en: {
      tactic: { label: "The exact afternoon plan", text: "Hour 1: generate 15 images, 3 directions for 5 products. Hour 2: animate the best 10. Hour 3: crop to 9:16 and 1:1, name the files, upload. Done — a month of creative, in one sitting." },
      proof: { stat: "30", caption: "publishable assets from a single afternoon" },
      ps: "Block it in your calendar as a recurring event. The people who do this stop having a content problem.",
    },
    pt: {
      tactic: { label: "O plano exato da tarde", text: "Hora 1: gere 15 imagens, 3 direções pra 5 produtos. Hora 2: anime as 10 melhores. Hora 3: corte em 9:16 e 1:1, nomeie os arquivos, suba. Pronto — um mês de criativo, numa sentada." },
      proof: { stat: "30", caption: "peças publicáveis a partir de uma única tarde" },
      ps: "Marque como evento recorrente na agenda. Quem faz isso para de ter problema de conteúdo.",
    },
  },
  "a5-49-offer": {
    ask: "hook",
    en: {
      tactic: { label: "Before you decide", text: "Go generate one more video first. Decide on the product, not on the email. If what comes out isn't worth the price to you, don't buy — and tell us why, because that's useful to us either way." },
      ps: "An offer is only good if the thing behind it is. Test the thing.",
    },
    pt: {
      tactic: { label: "Antes de decidir", text: "Vá gerar mais um vídeo primeiro. Decida pelo produto, não pelo e-mail. Se o que sair não valer o preço pra você, não compre — e nos diga por quê, porque isso é útil pra gente de qualquer forma." },
      ps: "Uma oferta só é boa se a coisa por trás dela for. Teste a coisa.",
    },
  },
  "a5-50-last-call": {
    ask: "hook",
    en: {
      tactic: { label: "A clean decision", text: "Either this is worth a monthly cost to your business or it isn't. Both answers are fine. What isn't useful is leaving the tab open for another three months without deciding." },
      ps: "If the answer is no, hit unsubscribe below — genuinely, no hard feelings. We'd rather have a clean list.",
    },
    pt: {
      tactic: { label: "Uma decisão limpa", text: "Ou isso vale um custo mensal pro seu negócio ou não vale. As duas respostas estão certas. O que não serve é deixar a aba aberta por mais três meses sem decidir." },
      ps: "Se a resposta for não, clique em descadastrar aqui embaixo — sério, sem mágoa. A gente prefere uma lista limpa.",
    },
  },

  // ─── ARCO 6 — WIN-BACK ───────────────────────────────────────────────────
  "a6-51-miss-you": {
    ask: "jab",
    en: {
      tactic: { label: "Pick up where you left", text: "Everything you generated is still in Projects. Open it, find the best thing you made, and just make one more like it. Restarting is always easier than starting." },
      ps: "You don't need a new plan. You need one more generation.",
    },
    pt: {
      tactic: { label: "Retome de onde parou", text: "Tudo que você gerou continua em Projetos. Abra, ache a melhor coisa que você fez e faça só mais uma parecida. Recomeçar é sempre mais fácil que começar." },
      ps: "Você não precisa de um plano novo. Precisa de mais uma geração.",
    },
  },
  "a6-52-whats-new": {
    ask: "jab",
    en: {
      tactic: { label: "Worth 5 minutes", text: "Log in and look at three things you've never opened: Viral Templates, Story Studio, and the Claude connector. All three exist to remove work you were doing manually." },
      ps: "Most people use about 20% of what their account already includes.",
    },
    pt: {
      tactic: { label: "Vale 5 minutos", text: "Entre e olhe três coisas que você nunca abriu: Templates Virais, Story Studio e o conector do Claude. Os três existem pra tirar trabalho que você estava fazendo na mão." },
      ps: "A maioria das pessoas usa uns 20% do que a conta delas já inclui.",
    },
  },
  "a6-53-new-models": {
    ask: "jab",
    en: {
      tactic: { label: "Re-run your worst prompt", text: "Find the generation that disappointed you most. Run the exact same prompt on the current models. This is the fastest, most honest test of whether anything actually improved." },
      ps: "Same prompt, new model. If it's still bad, we deserve to lose you.",
    },
    pt: {
      tactic: { label: "Rode de novo seu pior prompt", text: "Ache a geração que mais te decepcionou. Rode exatamente o mesmo prompt nos modelos atuais. É o teste mais rápido e mais honesto de se alguma coisa realmente melhorou." },
      ps: "Mesmo prompt, modelo novo. Se ainda estiver ruim, a gente merece te perder.",
    },
  },
  "a6-54-free-one": {
    ask: "hook",
    en: {
      tactic: { label: "Spend it well", text: "Use it on your best-selling product, in 9:16, with the Seedance image-to-video mode. That's the combination most likely to produce something you'd actually publish." },
      ps: "One good video is enough to change your mind about the whole category. That's the bet we're making.",
    },
    pt: {
      tactic: { label: "Gaste bem", text: "Use no seu produto mais vendido, em 9:16, com o modo imagem-pra-vídeo do Seedance. É a combinação com mais chance de produzir algo que você publicaria de verdade." },
      ps: "Um vídeo bom basta pra mudar sua opinião sobre a categoria inteira. É essa a aposta que a gente está fazendo.",
    },
  },
  "a6-55-what-was-missing": {
    ask: "jab",
    en: {
      tactic: { label: "One sentence is enough", text: "You don't need to write an essay. \"Too expensive\", \"results weren't good enough\", \"I forgot\", \"I don't need video\" — any of those, in four words, genuinely helps us." },
      ps: "Replies to this address go to a person, not a ticket queue.",
    },
    pt: {
      tactic: { label: "Uma frase basta", text: "Você não precisa escrever um texto. \"Caro demais\", \"resultado não era bom\", \"esqueci\", \"não preciso de vídeo\" — qualquer uma dessas, em quatro palavras, ajuda a gente de verdade." },
      ps: "Resposta neste endereço cai pra uma pessoa, não pra uma fila de chamado.",
    },
  },
  "a6-56-common-blocker": {
    ask: "jab",
    en: {
      tactic: { label: "The fix, specifically", text: "Take the prompt that disappointed you and add exactly two things: a camera move and a lighting description. \"Slow push-in\" and \"dramatic side lighting\" fix more failed generations than any other change." },
      ps: "This is genuinely the fix for most \"AI video doesn't work\" complaints we hear.",
    },
    pt: {
      tactic: { label: "A correção, especificamente", text: "Pegue o prompt que te decepcionou e acrescente exatamente duas coisas: um movimento de câmera e uma descrição de luz. \"Aproximação lenta\" e \"luz lateral dramática\" consertam mais gerações fracassadas que qualquer outra mudança." },
      ps: "Essa é sinceramente a correção pra maioria das reclamações de \"vídeo de IA não funciona\" que a gente ouve.",
    },
  },
  "a6-57-quick-case": {
    ask: "jab",
    en: {
      tactic: { label: "Audit your own first 2 seconds", text: "Open your last three ads. Mute them. Watch only the first two seconds of each. If you can't tell what's being sold or why you'd care, that's your conversion problem — not your targeting." },
      ps: "The first two seconds decide whether the other twenty-eight get watched at all.",
    },
    pt: {
      tactic: { label: "Audite seus próprios 2 segundos", text: "Abra seus últimos três anúncios. Tire o som. Assista só os dois primeiros segundos de cada. Se você não consegue dizer o que está sendo vendido nem por que se importaria, esse é o seu problema de conversão — não a segmentação." },
      ps: "Os dois primeiros segundos decidem se os outros vinte e oito vão ser assistidos.",
    },
  },
  "a6-58-discount": {
    ask: "hook",
    en: {
      tactic: { label: "Decide with a number", text: "If one extra sale per month covers the plan, it's a rounding error in your P&L. If it doesn't, it's genuinely not for you right now — and that's a real answer, not a failure." },
      ps: "We'd rather you say no clearly than stay subscribed to emails you never open.",
    },
    pt: {
      tactic: { label: "Decida com um número", text: "Se uma venda a mais por mês paga o plano, isso é arredondamento no seu resultado. Se não paga, sinceramente não é pra você agora — e isso é uma resposta de verdade, não um fracasso." },
      ps: "A gente prefere que você diga não claramente do que continuar numa lista de e-mails que nunca abre.",
    },
  },
  "a6-59-before-you-go": {
    ask: "hook",
    en: {
      tactic: { label: "Ten minutes, one last time", text: "Best-selling product. One photo. One template. One generation. If that doesn't convince you, nothing in another twenty emails would have, and we'd rather stop." },
      ps: "This is the second-to-last email. After the next one, we're done.",
    },
    pt: {
      tactic: { label: "Dez minutos, uma última vez", text: "Produto mais vendido. Uma foto. Um template. Uma geração. Se isso não te convencer, mais vinte e-mails também não convenceriam, e a gente prefere parar." },
      ps: "Este é o penúltimo e-mail. Depois do próximo, a gente encerra.",
    },
  },
  "a6-60-goodbye": {
    ask: "jab",
    en: {
      tactic: { label: "Keep this one thing", text: "Even if you never open NOVA again: [subject] + [action] + [camera move] + [lighting] + [background]. That formula works in every AI video tool that exists. It's yours regardless." },
      ps: "Genuinely, thank you for reading. That's rarer than you'd think.",
    },
    pt: {
      tactic: { label: "Guarde só isso", text: "Mesmo que você nunca mais abra a NOVA: [sujeito] + [ação] + [movimento de câmera] + [luz] + [fundo]. Essa fórmula funciona em qualquer ferramenta de vídeo por IA que existe. É sua de qualquer jeito." },
      ps: "Sinceramente, obrigado por ler. Isso é mais raro do que parece.",
    },
  },
};

/** Proporção jab/hook — usado pelo painel para mostrar o ritmo da sequência. */
export function askRatio() {
  const values = Object.values(TACTICS);
  const hooks = values.filter((item) => item.ask === "hook").length;
  return { total: values.length, hooks, jabs: values.length - hooks };
}
