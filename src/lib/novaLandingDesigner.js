function text(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

export function slugify(value = "nova-landing") {
  return String(value || "nova-landing")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "nova-landing";
}

export function createLandingPageDesign(input = {}) {
  const product = text(input.product, "Premium Product");
  const brandName = text(input.brandName || input.brand, "NOVA Brand");
  const audience = text(input.audience, "high-intent buyers");
  const goal = text(input.goal, "generate desire, trust and sales");
  const style = text(input.style, "premium black and neon green futuristic commercial design");
  const language = text(input.language, "en");
  const platform = text(input.platform, "html");
  const cta = text(input.cta, "Shop Now");

  const isPt = language.toLowerCase().startsWith("pt");

  const headline = text(
    input.headline,
    isPt
      ? `${product} com presença premium que vende no primeiro olhar.`
      : `${product} with a premium presence that sells at first sight.`
  );

  const subheadline = text(
    input.subheadline,
    isPt
      ? `Uma landing page criada para transformar atenção em desejo, desejo em confiança e confiança em compra.`
      : `A landing page built to turn attention into desire, desire into trust and trust into purchase.`
  );

  const sections = [
    {
      id: "hero",
      type: "hero",
      title: headline,
      body: subheadline,
      cta,
      visual: `Hero product render for ${product}, ${style}, dramatic lighting, clean premium composition.`,
    },
    {
      id: "benefits",
      type: "benefits",
      title: isPt ? "Por que isso vende" : "Why it converts",
      items: [
        isPt ? "Mensagem clara acima da dobra" : "Clear above-the-fold message",
        isPt ? "Visual premium com foco no produto" : "Premium product-first visual system",
        isPt ? "CTA direto para compra" : "Direct purchase-focused CTA",
      ],
    },
    {
      id: "product-showcase",
      type: "showcase",
      title: isPt ? "Produto em destaque" : "Product showcase",
      body: isPt
        ? `${product} apresentado com estética de campanha, detalhes visuais e prova de valor.`
        : `${product} presented with campaign-grade visuals, strong details and value proof.`,
    },
    {
      id: "social-proof",
      type: "proof",
      title: isPt ? "Confiança antes do clique" : "Trust before the click",
      items: [
        isPt ? "Avaliações e depoimentos" : "Reviews and testimonials",
        isPt ? "Garantia ou segurança de compra" : "Guarantee or purchase confidence",
        isPt ? "Diferenciais do produto" : "Product differentiators",
      ],
    },
    {
      id: "faq",
      type: "faq",
      title: "FAQ",
      items: [
        {
          q: isPt ? "Para quem é essa oferta?" : "Who is this offer for?",
          a: isPt ? `Para ${audience}.` : `For ${audience}.`,
        },
        {
          q: isPt ? "Qual é o objetivo da página?" : "What is the goal of this page?",
          a: goal,
        },
      ],
    },
    {
      id: "final-cta",
      type: "cta",
      title: isPt ? "Pronto para começar?" : "Ready to start?",
      body: isPt ? "Clique agora e avance para a compra." : "Click now and continue to purchase.",
      cta,
    },
  ];

  const imagePrompts = [
    `Hero image for ${product}, ${style}, black background, neon green accents, premium ecommerce campaign, no text, no watermark.`,
    `Product detail image for ${product}, luxury close-up, reflective surface, cinematic lighting, high-end ad photography.`,
    `Lifestyle banner for ${product}, aspirational customer moment, clean composition, premium black and green color system.`,
  ];

  const videoPrompts = [
    `Short video ad for ${product}, dramatic product reveal, black background, neon green glow, premium camera movement, social-ready composition.`,
    `UGC style video for ${product}, creator holds product, explains one main benefit, authentic but premium, direct CTA.`,
  ];

  return {
    version: "1.0",
    type: "landing_page_design",
    product,
    brandName,
    platform,
    language,
    audience,
    goal,
    style,
    cta,
    headline,
    subheadline,
    sections,
    assets: {
      imagePrompts,
      videoPrompts,
      suggestedFiles: [
        "hero-product.png",
        "product-showcase.png",
        "mobile-hero.png",
      ],
    },
    exportsAvailable: [
      "html",
      "react",
      "nextjs",
      "hydrogen",
      "shopify-theme",
    ],
    notes: [
      "Shopify Theme ZIP is for traditional Shopify themes/Liquid.",
      "Hydrogen/Oxygen export is React/headless code and should be added to a Hydrogen project, then deployed through GitHub/Oxygen.",
      "Next.js export is a React/Tailwind-style page scaffold.",
    ],
  };
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderCss() {
  return `
:root {
  --nova-bg: #020303;
  --nova-panel: #070707;
  --nova-text: #ffffff;
  --nova-muted: rgba(255,255,255,.62);
  --nova-line: rgba(255,255,255,.12);
  --nova-green: #D7FF00;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--nova-bg);
  color: var(--nova-text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.nova-page { overflow: hidden; }
.nova-wrap { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
.nova-hero {
  position: relative;
  padding: 96px 0 72px;
  background:
    radial-gradient(circle at 20% 20%, rgba(215,255,0,.16), transparent 34%),
    radial-gradient(circle at 85% 15%, rgba(255,255,255,.08), transparent 25%),
    #020303;
}
.nova-eyebrow {
  color: var(--nova-green);
  text-transform: uppercase;
  letter-spacing: .22em;
  font-size: 12px;
  font-weight: 900;
}
.nova-title {
  max-width: 880px;
  margin: 18px 0;
  font-size: clamp(46px, 9vw, 112px);
  line-height: .86;
  letter-spacing: -.08em;
  text-transform: uppercase;
}
.nova-subtitle {
  max-width: 680px;
  color: var(--nova-muted);
  font-size: 18px;
  line-height: 1.75;
}
.nova-cta {
  display: inline-flex;
  margin-top: 28px;
  padding: 16px 24px;
  border-radius: 16px;
  background: var(--nova-green);
  color: #000;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .14em;
  text-decoration: none;
  text-transform: uppercase;
}
.nova-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  padding: 64px 0;
}
.nova-card {
  border: 1px solid var(--nova-line);
  background: rgba(255,255,255,.035);
  border-radius: 28px;
  padding: 28px;
  min-height: 210px;
}
.nova-card h2, .nova-card h3 { margin: 0 0 14px; letter-spacing: -.04em; }
.nova-card p, .nova-card li { color: var(--nova-muted); line-height: 1.65; }
.nova-section {
  padding: 72px 0;
  border-top: 1px solid var(--nova-line);
}
.nova-section h2 {
  margin: 0 0 18px;
  font-size: clamp(34px, 5vw, 64px);
  line-height: .95;
  letter-spacing: -.06em;
  text-transform: uppercase;
}
.nova-footer-cta {
  padding: 80px 0;
  text-align: center;
}
@media (max-width: 820px) {
  .nova-hero { padding: 72px 0 48px; }
  .nova-grid { grid-template-columns: 1fr; padding: 42px 0; }
  .nova-card { min-height: auto; }
}
`.trim();
}

function placeholderSvg(title, subtitle = "") {
  return `
<svg width="1400" height="900" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
  <rect width="1400" height="900" fill="#020303"/>
  <circle cx="260" cy="230" r="280" fill="#D7FF00" opacity=".16"/>
  <circle cx="1050" cy="190" r="220" fill="#ffffff" opacity=".06"/>
  <rect x="120" y="120" width="1160" height="660" rx="54" fill="#070707" stroke="#D7FF00" stroke-opacity=".35"/>
  <text x="170" y="420" fill="#D7FF00" font-family="Arial" font-size="54" font-weight="900">${escapeHtml(title)}</text>
  <text x="170" y="490" fill="#ffffff" opacity=".72" font-family="Arial" font-size="30">${escapeHtml(subtitle)}</text>
</svg>
`.trim();
}

export function renderHtmlLanding(design) {
  const cards = design.sections
    .filter((s) => ["benefits", "proof"].includes(s.type))
    .flatMap((s) => s.items || [])
    .map((item) => `<div class="nova-card"><h3>${escapeHtml(typeof item === "string" ? item : item.q)}</h3><p>${escapeHtml(typeof item === "string" ? design.goal : item.a)}</p></div>`)
    .join("\n");

  return `
<!doctype html>
<html lang="${escapeHtml(design.language || "en")}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(design.product)} | ${escapeHtml(design.brandName)}</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <main class="nova-page">
    <section class="nova-hero">
      <div class="nova-wrap">
        <div class="nova-eyebrow">${escapeHtml(design.brandName)}</div>
        <h1 class="nova-title">${escapeHtml(design.headline)}</h1>
        <p class="nova-subtitle">${escapeHtml(design.subheadline)}</p>
        <a class="nova-cta" href="#buy">${escapeHtml(design.cta)}</a>
      </div>
    </section>

    <section class="nova-wrap nova-grid">
      ${cards}
    </section>

    <section class="nova-section">
      <div class="nova-wrap">
        <h2>${escapeHtml(design.sections.find((s) => s.id === "product-showcase")?.title || "Product Showcase")}</h2>
        <p class="nova-subtitle">${escapeHtml(design.sections.find((s) => s.id === "product-showcase")?.body || "")}</p>
      </div>
    </section>

    <section id="buy" class="nova-footer-cta">
      <div class="nova-wrap">
        <div class="nova-eyebrow">${escapeHtml(design.product)}</div>
        <h2 class="nova-title">${escapeHtml(design.sections.find((s) => s.id === "final-cta")?.title || "Ready?")}</h2>
        <a class="nova-cta" href="#">${escapeHtml(design.cta)}</a>
      </div>
    </section>
  </main>
</body>
</html>
`.trim();
}

export function renderReactComponent(design) {
  return `
export default function NovaLandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020303] text-white">
      <section className="relative px-6 py-24 md:px-12 md:py-32">
        <div className="absolute left-[-10%] top-0 h-96 w-96 rounded-full bg-[#D7FF00]/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">${design.brandName}</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-black uppercase leading-[0.86] tracking-[-0.08em] md:text-8xl">${design.headline}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/60 md:text-lg">${design.subheadline}</p>
          <a href="#buy" className="mt-8 inline-flex rounded-2xl bg-[#D7FF00] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-black no-underline">${design.cta}</a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-14 md:grid-cols-3 md:px-12">
        ${(design.sections.find((s) => s.id === "benefits")?.items || []).map((item) => `
        <div className="rounded-[1.7rem] border border-white/10 bg-white/[.035] p-7">
          <h3 className="text-xl font-black">${item}</h3>
          <p className="mt-3 text-sm leading-7 text-white/55">${design.goal}</p>
        </div>`).join("")}
      </section>

      <section className="border-t border-white/10 px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-3xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-6xl">${design.sections.find((s) => s.id === "product-showcase")?.title || "Product Showcase"}</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/55">${design.sections.find((s) => s.id === "product-showcase")?.body || ""}</p>
        </div>
      </section>

      <section id="buy" className="px-6 py-24 text-center md:px-12">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7FF00]">${design.product}</p>
        <h2 className="mx-auto mt-5 max-w-4xl text-5xl font-black uppercase leading-[0.86] tracking-[-0.08em] md:text-7xl">${design.sections.find((s) => s.id === "final-cta")?.title || "Ready?"}</h2>
        <a href="#" className="mt-8 inline-flex rounded-2xl bg-[#D7FF00] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-black no-underline">${design.cta}</a>
      </section>
    </main>
  );
}
`.trim();
}

function renderShopifySection(design) {
  return `
{{ 'nova-landing.css' | asset_url | stylesheet_tag }}

<section class="nova-page">
  <div class="nova-hero">
    <div class="nova-wrap">
      <div class="nova-eyebrow">{{ section.settings.eyebrow }}</div>
      <h1 class="nova-title">{{ section.settings.headline }}</h1>
      <p class="nova-subtitle">{{ section.settings.subheadline }}</p>
      <a class="nova-cta" href="{{ section.settings.cta_url }}">{{ section.settings.cta_text }}</a>
    </div>
  </div>

  <div class="nova-wrap nova-grid">
    {% for block in section.blocks %}
      <div class="nova-card" {{ block.shopify_attributes }}>
        <h3>{{ block.settings.title }}</h3>
        <p>{{ block.settings.text }}</p>
      </div>
    {% endfor %}
  </div>
</section>

{% schema %}
{
  "name": "NOVA Landing Page",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "${escapeHtml(design.brandName)}" },
    { "type": "text", "id": "headline", "label": "Headline", "default": "${escapeHtml(design.headline)}" },
    { "type": "textarea", "id": "subheadline", "label": "Subheadline", "default": "${escapeHtml(design.subheadline)}" },
    { "type": "text", "id": "cta_text", "label": "CTA text", "default": "${escapeHtml(design.cta)}" },
    { "type": "url", "id": "cta_url", "label": "CTA URL" }
  ],
  "blocks": [
    {
      "type": "benefit",
      "name": "Benefit",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Benefit" },
        { "type": "textarea", "id": "text", "label": "Text", "default": "Describe the value of this product." }
      ]
    }
  ],
  "presets": [
    {
      "name": "NOVA Landing Page",
      "blocks": [
        ${JSON.stringify((design.sections.find((s) => s.id === "benefits")?.items || []).map((item) => ({ type: "benefit", settings: { title: item, text: design.goal } }))).slice(1, -1)}
      ]
    }
  ]
}
{% endschema %}
`.trim();
}

function renderShopifyTemplate() {
  return JSON.stringify(
    {
      sections: {
        main: {
          type: "nova-landing-page",
        },
      },
      order: ["main"],
    },
    null,
    2
  );
}

function renderSettingsSchema(design) {
  return JSON.stringify(
    [
      {
        name: "theme_info",
        theme_name: `NOVA ${design.product} Landing`,
        theme_version: "1.0.0",
        theme_author: "NOVA",
        theme_documentation_url: "https://www.novvideos.online/claude",
        theme_support_url: "https://www.novvideos.online/contact",
      },
    ],
    null,
    2
  );
}

function renderReadme(design, platform) {
  return `
# NOVA Landing Export

Product: ${design.product}
Brand: ${design.brandName}
Platform: ${platform}

## What is included

This package was generated by NOVA.

## Platform notes

- HTML: open index.html or upload the files to any static host.
- React: import NovaLandingPage.jsx into your React/Vite project.
- Next.js: copy the app/landing/page.jsx and components into your Next.js app.
- Hydrogen/Oxygen: copy the Hydrogen route/components into your Hydrogen project, commit to GitHub and deploy through Oxygen/GitHub.
- Shopify Theme: upload the ZIP as a draft theme or copy the section/template files into your existing theme.

## Asset prompts

${design.assets.imagePrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}

## Video prompts

${design.assets.videoPrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}
`.trim();
}

export function createLandingExportFiles(design, platform = "html") {
  const css = renderCss();
  const slug = slugify(design.product);
  const svg = placeholderSvg(design.product, design.brandName);

  if (platform === "react") {
    return [
      { path: "react/NovaLandingPage.jsx", content: renderReactComponent(design) },
      { path: "react/README.md", content: renderReadme(design, platform) },
      { path: "assets/nova-hero.svg", content: svg },
      { path: "design/layout.json", content: JSON.stringify(design, null, 2) },
    ];
  }

  if (platform === "nextjs") {
    return [
      { path: "nextjs/app/landing/page.jsx", content: renderReactComponent(design) },
      { path: "nextjs/README.md", content: renderReadme(design, platform) },
      { path: "nextjs/public/assets/nova-hero.svg", content: svg },
      { path: "design/layout.json", content: JSON.stringify(design, null, 2) },
    ];
  }

  if (platform === "hydrogen") {
    return [
      { path: `hydrogen/app/routes/($locale).${slug}.jsx`, content: renderReactComponent(design) },
      { path: "hydrogen/app/styles/nova-landing.css", content: css },
      { path: "hydrogen/public/assets/nova-hero.svg", content: svg },
      { path: "hydrogen/README.md", content: renderReadme(design, platform) },
      { path: "design/layout.json", content: JSON.stringify(design, null, 2) },
    ];
  }

  if (platform === "shopify-theme") {
    return [
      { path: "layout/theme.liquid", content: '<!doctype html><html><head>{{ content_for_header }}</head><body>{{ content_for_layout }}</body></html>' },
      { path: "templates/page.nova-landing.json", content: renderShopifyTemplate() },
      { path: "templates/index.json", content: renderShopifyTemplate() },
      { path: "sections/nova-landing-page.liquid", content: renderShopifySection(design) },
      { path: "assets/nova-landing.css", content: css },
      { path: "assets/nova-hero.svg", content: svg },
      { path: "config/settings_schema.json", content: renderSettingsSchema(design) },
      { path: "README.md", content: renderReadme(design, platform) },
      { path: "design/layout.json", content: JSON.stringify(design, null, 2) },
    ];
  }

  return [
    { path: "html/index.html", content: renderHtmlLanding(design) },
    { path: "html/style.css", content: css },
    { path: "html/assets/nova-hero.svg", content: svg },
    { path: "README.md", content: renderReadme(design, "html") },
    { path: "design/layout.json", content: JSON.stringify(design, null, 2) },
  ];
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function dosTimeDate(date = new Date()) {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);

  const dosDate =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();

  return { time, dosDate };
}

export function createZipBuffer(files = []) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { time, dosDate } = dosTimeDate();

  for (const file of files) {
    const nameBuffer = Buffer.from(file.path, "utf8");
    const contentBuffer = Buffer.isBuffer(file.content)
      ? file.content
      : Buffer.from(String(file.content || ""), "utf8");

    const crc = crc32(contentBuffer);
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(contentBuffer.length, 18);
    localHeader.writeUInt32LE(contentBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, contentBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(contentBuffer.length, 20);
    centralHeader.writeUInt32LE(contentBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + contentBuffer.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localDirectory = Buffer.concat(localParts);
  const end = Buffer.alloc(22);

  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localDirectory.length, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([localDirectory, centralDirectory, end]);
}
