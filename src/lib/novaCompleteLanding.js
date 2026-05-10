import {
  createLandingPageDesign,
  createZipBuffer,
  slugify,
} from "@/lib/novaLandingDesigner";
import {
  generateLandingImages,
  downloadGeneratedImages,
} from "@/lib/novaLandingImageGenerator";
import {
  LANDING_PAGE_WITH_IMAGES,
  landingPricingPublic,
  landingPricingInternal,
} from "@/lib/novaLandingPricing";
import { uploadToR2 } from "@/lib/r2";

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function imageByRole(images, role) {
  return images.find((img) => img.role === role) || images[0] || {};
}

function css() {
  return `
:root{--bg:#020303;--panel:#070707;--text:#fff;--muted:rgba(255,255,255,.62);--line:rgba(255,255,255,.12);--green:#D7FF00}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.nova-wrap{width:min(1180px,calc(100% - 32px));margin:0 auto}.nova-page{overflow:hidden}
.nova-hero{padding:86px 0 64px;background:radial-gradient(circle at 18% 20%,rgba(215,255,0,.18),transparent 34%),#020303}
.nova-hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:34px;align-items:center}.nova-eyebrow{color:var(--green);text-transform:uppercase;letter-spacing:.22em;font-size:12px;font-weight:900}
.nova-title{max-width:880px;margin:18px 0;font-size:clamp(44px,8vw,104px);line-height:.86;letter-spacing:-.08em;text-transform:uppercase}
.nova-subtitle{max-width:680px;color:var(--muted);font-size:18px;line-height:1.7}.nova-cta{display:inline-flex;margin-top:28px;padding:16px 24px;border-radius:16px;background:var(--green);color:#000;font-size:12px;font-weight:900;letter-spacing:.14em;text-decoration:none;text-transform:uppercase}
.nova-img{width:100%;border-radius:32px;border:1px solid rgba(215,255,0,.25);box-shadow:0 30px 100px rgba(215,255,0,.12);object-fit:cover;background:#050505}.nova-hero-img{aspect-ratio:16/10}.nova-square{aspect-ratio:1/1}
.nova-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:64px 0}.nova-card{border:1px solid var(--line);background:rgba(255,255,255,.035);border-radius:28px;padding:28px;min-height:210px}
.nova-card h3{margin:0 0 14px;letter-spacing:-.04em}.nova-card p,.nova-card li{color:var(--muted);line-height:1.65}
.nova-section{padding:72px 0;border-top:1px solid var(--line)}.nova-two{display:grid;grid-template-columns:.9fr 1.1fr;gap:34px;align-items:center}.nova-section h2{margin:0 0 18px;font-size:clamp(34px,5vw,64px);line-height:.95;letter-spacing:-.06em;text-transform:uppercase}.nova-footer-cta{padding:80px 0;text-align:center;border-top:1px solid var(--line)}
@media(max-width:820px){.nova-hero{padding:64px 0 42px}.nova-hero-grid,.nova-two,.nova-grid{grid-template-columns:1fr}.nova-grid{padding:42px 0}.nova-card{min-height:auto}.nova-title{font-size:clamp(42px,14vw,72px)}}
`.trim();
}

function html(design, images) {
  const hero = imageByRole(images, "hero").zipPath || "assets/nova-hero.png";
  const product = imageByRole(images, "product").zipPath || "assets/nova-product-showcase.png";
  const lifestyle = imageByRole(images, "lifestyle").zipPath || "assets/nova-lifestyle.png";
  const benefits = design.sections.find((s) => s.id === "benefits")?.items || [];

  return `<!doctype html>
<html lang="${esc(design.language || "en")}">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(design.product)} | ${esc(design.brandName)}</title><link rel="stylesheet" href="./style.css"/></head>
<body>
<main class="nova-page">
  <section class="nova-hero"><div class="nova-wrap nova-hero-grid"><div><div class="nova-eyebrow">${esc(design.brandName)}</div><h1 class="nova-title">${esc(design.headline)}</h1><p class="nova-subtitle">${esc(design.subheadline)}</p><a class="nova-cta" href="#buy">${esc(design.cta)}</a></div><img class="nova-img nova-hero-img" src="./${esc(hero)}" alt="${esc(design.product)} hero"/></div></section>
  <section class="nova-wrap nova-grid">${benefits.map((b) => `<div class="nova-card"><h3>${esc(b)}</h3><p>${esc(design.goal)}</p></div>`).join("")}</section>
  <section class="nova-section"><div class="nova-wrap nova-two"><img class="nova-img nova-square" src="./${esc(product)}" alt="${esc(design.product)} product"/><div><h2>${esc(design.sections.find((s) => s.id === "product-showcase")?.title || "Product Showcase")}</h2><p class="nova-subtitle">${esc(design.sections.find((s) => s.id === "product-showcase")?.body || "")}</p></div></div></section>
  <section class="nova-section"><div class="nova-wrap nova-two"><div><h2>${esc(design.sections.find((s) => s.id === "social-proof")?.title || "Trust before the click")}</h2><p class="nova-subtitle">${esc(design.audience)}</p></div><img class="nova-img nova-square" src="./${esc(lifestyle)}" alt="${esc(design.product)} lifestyle"/></div></section>
  <section id="buy" class="nova-footer-cta"><div class="nova-wrap"><div class="nova-eyebrow">${esc(design.product)}</div><h2 class="nova-title">${esc(design.sections.find((s) => s.id === "final-cta")?.title || "Ready?")}</h2><a class="nova-cta" href="#">${esc(design.cta)}</a></div></section>
</main>
</body></html>`;
}

function react(design, images) {
  const hero = "/" + (imageByRole(images, "hero").zipPath || "assets/nova-hero.png");
  const product = "/" + (imageByRole(images, "product").zipPath || "assets/nova-product-showcase.png");
  const benefits = design.sections.find((s) => s.id === "benefits")?.items || [];

  return `export default function NovaLandingPage(){
  return <main className="min-h-screen overflow-hidden bg-[#020303] text-white">
    <section className="px-6 py-20 md:px-12 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2">
        <div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">${design.brandName}</p><h1 className="mt-5 text-5xl font-black uppercase leading-[0.86] tracking-[-0.08em] md:text-8xl">${design.headline}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">${design.subheadline}</p><a className="mt-8 inline-flex rounded-2xl bg-[#D7FF00] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-black no-underline" href="#buy">${design.cta}</a></div>
        <img className="aspect-[16/10] w-full rounded-[2rem] border border-[#D7FF00]/25 object-cover" src="${hero}" alt="${design.product}"/>
      </div>
    </section>
    <section className="mx-auto grid max-w-6xl gap-4 px-6 py-14 md:grid-cols-3 md:px-12">${benefits.map((b) => `<div className="rounded-[1.7rem] border border-white/10 bg-white/[.035] p-7"><h3 className="text-xl font-black">${b}</h3><p className="mt-3 text-sm leading-7 text-white/55">${design.goal}</p></div>`).join("")}</section>
    <section className="border-t border-white/10 px-6 py-20 md:px-12"><div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2"><img className="aspect-square w-full rounded-[2rem] object-cover" src="${product}" alt="${design.product}"/><div><h2 className="text-4xl font-black uppercase leading-[.92] tracking-[-.06em] md:text-6xl">${design.sections.find((s) => s.id === "product-showcase")?.title || "Product Showcase"}</h2><p className="mt-5 text-lg leading-8 text-white/55">${design.sections.find((s) => s.id === "product-showcase")?.body || ""}</p></div></div></section>
    <section id="buy" className="px-6 py-24 text-center md:px-12"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7FF00]">${design.product}</p><h2 className="mx-auto mt-5 max-w-4xl text-5xl font-black uppercase leading-[.86] tracking-[-.08em] md:text-7xl">Ready to start?</h2><a className="mt-8 inline-flex rounded-2xl bg-[#D7FF00] px-6 py-4 text-xs font-black uppercase tracking-[.14em] text-black no-underline" href="#">${design.cta}</a></section>
  </main>
}`;
}

function shopifySection(design, images) {
  const hero = imageByRole(images, "hero").fileName || "nova-hero.png";
  return `{{ 'nova-landing.css' | asset_url | stylesheet_tag }}
<section class="nova-page"><div class="nova-hero"><div class="nova-wrap nova-hero-grid"><div><div class="nova-eyebrow">{{ section.settings.eyebrow }}</div><h1 class="nova-title">{{ section.settings.headline }}</h1><p class="nova-subtitle">{{ section.settings.subheadline }}</p><a class="nova-cta" href="{{ section.settings.cta_url }}">{{ section.settings.cta_text }}</a></div><img class="nova-img nova-hero-img" src="{{ '${hero}' | asset_url }}" alt="{{ section.settings.headline }}"/></div></div></section>
{% schema %}
{"name":"NOVA Landing Page","settings":[{"type":"text","id":"eyebrow","label":"Eyebrow","default":"${esc(design.brandName)}"},{"type":"text","id":"headline","label":"Headline","default":"${esc(design.headline)}"},{"type":"textarea","id":"subheadline","label":"Subheadline","default":"${esc(design.subheadline)}"},{"type":"text","id":"cta_text","label":"CTA text","default":"${esc(design.cta)}"},{"type":"url","id":"cta_url","label":"CTA URL"}],"presets":[{"name":"NOVA Landing Page"}]}
{% endschema %}`;
}

function readme(design, platform, images) {
  return `# NOVA Complete Landing Page

Product: ${design.product}
Brand: ${design.brandName}
Platform: ${platform}

## Included

- Layout and copy
- 4 AI-generated images
- Export package
- Cost charged: ${LANDING_PAGE_WITH_IMAGES.novaCreditsRequired} NOVA API credits

## Generated images

${images.map((img, i) => `${i + 1}. ${img.role}: ${img.zipPath}`).join("\n")}

## Install notes

Shopify Theme ZIP: upload as draft theme or copy sections/templates/assets into your theme.
Hydrogen/Oxygen: copy files into your Hydrogen project, commit and deploy through Oxygen/GitHub.
Next.js: copy page/components/assets into your app.
React: import the component.
HTML: open html/index.html or upload folder to any host.
`;
}

export function buildCompleteLandingFiles(design, platform, generatedImages, downloadedImageFiles) {
  const files = [
    { path: "design/layout.json", content: JSON.stringify(design, null, 2) },
    { path: "design/generated-images.json", content: JSON.stringify(generatedImages, null, 2) },
    { path: "pricing/landing-pricing.json", content: JSON.stringify(landingPricingPublic(), null, 2) },
    ...downloadedImageFiles,
  ];

  if (platform === "react") {
    files.push({ path: "react/NovaLandingPage.jsx", content: react(design, generatedImages) });
    files.push({ path: "react/README.md", content: readme(design, platform, generatedImages) });
    return files;
  }

  if (platform === "nextjs") {
    files.push({ path: "nextjs/app/landing/page.jsx", content: react(design, generatedImages) });
    files.push({ path: "nextjs/public/README-assets.md", content: "Copy /assets images into your public folder." });
    files.push({ path: "nextjs/README.md", content: readme(design, platform, generatedImages) });
    return files;
  }

  if (platform === "hydrogen") {
    const slug = slugify(design.product || "nova-landing");
    files.push({ path: `hydrogen/app/routes/($locale).${slug}.jsx`, content: react(design, generatedImages) });
    files.push({ path: "hydrogen/app/styles/nova-landing.css", content: css() });
    files.push({ path: "hydrogen/README.md", content: readme(design, platform, generatedImages) });
    return files;
  }

  if (platform === "shopify-theme") {
    files.push({ path: "layout/theme.liquid", content: "<!doctype html><html><head>{{ content_for_header }}</head><body>{{ content_for_layout }}</body></html>" });
    files.push({ path: "templates/page.nova-landing.json", content: JSON.stringify({ sections: { main: { type: "nova-landing-page" } }, order: ["main"] }, null, 2) });
    files.push({ path: "templates/index.json", content: JSON.stringify({ sections: { main: { type: "nova-landing-page" } }, order: ["main"] }, null, 2) });
    files.push({ path: "sections/nova-landing-page.liquid", content: shopifySection(design, generatedImages) });
    files.push({ path: "assets/nova-landing.css", content: css() });
    files.push({ path: "config/settings_schema.json", content: JSON.stringify([{ name: "theme_info", theme_name: "NOVA Landing", theme_version: "1.0.0", theme_author: "NOVA" }], null, 2) });
    files.push({ path: "README.md", content: readme(design, platform, generatedImages) });
    return files;
  }

  files.push({ path: "html/index.html", content: html(design, generatedImages) });
  files.push({ path: "html/style.css", content: css() });
  files.push({ path: "README.md", content: readme(design, "html", generatedImages) });
  return files;
}

export async function generateCompleteLandingPackage({ body, gate }) {
  const platform = ["html", "react", "nextjs", "hydrogen", "shopify-theme"].includes(body.platform)
    ? body.platform
    : "html";

  const design = createLandingPageDesign({
    ...body,
    platform,
  });

  const generatedImages = await generateLandingImages(design);
  const imageFiles = await downloadGeneratedImages(generatedImages);

  const files = buildCompleteLandingFiles(design, platform, generatedImages, imageFiles);

  const zip = createZipBuffer(files);
  const slug = slugify(design.product || "nova-landing");
  const userId = gate?.identity?.userId || "api";
  const key = `users/${userId}/exports/landing/${Date.now()}-${slug}-${platform}-complete.zip`;

  const downloadUrl = await uploadToR2(key, zip, "application/zip");

  return {
    type: "complete_landing_page_with_images",
    platform,
    fileName: `${slug}-${platform}-complete.zip`,
    downloadUrl,
    design,
    generatedImages,
    files: files.map((f) => f.path),
    pricing: landingPricingPublic(),
    internalPricingEstimate: landingPricingInternal().internal,
    installNotes: {
      "shopify-theme": "Upload as a draft theme ZIP or copy sections/templates/assets into an existing Shopify theme.",
      hydrogen: "Copy files into your Hydrogen project, commit to GitHub and deploy through Oxygen/GitHub.",
      nextjs: "Copy files into your Next.js app folder and adjust routes/assets.",
      react: "Import the React component into your React/Vite project.",
      html: "Open html/index.html or upload the html folder to any static host.",
    }[platform],
  };
}
