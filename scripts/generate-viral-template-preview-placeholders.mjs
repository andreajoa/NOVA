import fs from "node:fs/promises";
import path from "node:path";

const libPath = path.join(process.cwd(), "src/lib/viralTemplates.js");
const outDir = path.join(process.cwd(), "public/nova/template-previews");

function getValue(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*"([^"]*)"`, "m"));
  return match?.[1] || "";
}

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapText(text, max = 28) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;

    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function iconForCategory(category) {
  if (/pet|animal/i.test(category)) return "🐾";
  if (/mini/i.test(category)) return "👥";
  if (/anime/i.test(category)) return "✦";
  if (/product/i.test(category)) return "▣";
  if (/ugc/i.test(category)) return "◉";
  if (/editor/i.test(category)) return "✎";
  if (/story/i.test(category)) return "◎";
  if (/dance/i.test(category)) return "♪";
  return "✦";
}

function accentForCategory(category) {
  if (/pet|animal/i.test(category)) return "#7CFF6B";
  if (/mini/i.test(category)) return "#D7FF00";
  if (/anime/i.test(category)) return "#B6FF00";
  if (/product/i.test(category)) return "#D7FF00";
  if (/ugc/i.test(category)) return "#C8FF4D";
  if (/editor/i.test(category)) return "#D7FF00";
  if (/story/i.test(category)) return "#D7FF00";
  if (/dance/i.test(category)) return "#D7FF00";
  return "#D7FF00";
}

function svgForTemplate(template) {
  const accent = accentForCategory(template.category);
  const icon = iconForCategory(template.category);
  const titleLines = wrapText(template.name, 20);
  const descLines = wrapText(template.title || template.description, 34);

  const titleSvg = titleLines
    .map((line, index) => {
      return `<tspan x="70" y="${330 + index * 58}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  const descSvg = descLines
    .map((line, index) => {
      return `<tspan x="74" y="${505 + index * 34}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g1" cx="20%" cy="18%" r="70%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.34"/>
      <stop offset="42%" stop-color="${accent}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111111"/>
      <stop offset="45%" stop-color="#050505"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="1280" height="720" fill="url(#g2)"/>
  <rect width="1280" height="720" fill="url(#g1)"/>

  <circle cx="1010" cy="165" r="230" fill="${accent}" opacity="0.08"/>
  <circle cx="1045" cy="198" r="132" fill="${accent}" opacity="0.16" filter="url(#glow)"/>
  <circle cx="1045" cy="198" r="86" fill="#000000" opacity="0.78"/>
  <text x="1045" y="226" text-anchor="middle" font-size="112" font-family="Arial, Helvetica, sans-serif" fill="${accent}" font-weight="900">${icon}</text>

  <rect x="70" y="70" width="260" height="44" rx="22" fill="${accent}" opacity="0.95"/>
  <text x="200" y="99" text-anchor="middle" font-size="18" font-family="Arial, Helvetica, sans-serif" fill="#000" font-weight="900" letter-spacing="3">${escapeXml(template.category.toUpperCase())}</text>

  <rect x="70" y="138" width="210" height="38" rx="19" fill="#ffffff" opacity="0.08"/>
  <text x="175" y="163" text-anchor="middle" font-size="15" font-family="Arial, Helvetica, sans-serif" fill="#ffffff" opacity="0.62" font-weight="900" letter-spacing="2">${escapeXml((template.badge || "NOVA").toUpperCase())}</text>

  <text font-size="58" font-family="Arial Black, Arial, Helvetica, sans-serif" fill="#ffffff" font-weight="900" letter-spacing="-3">
    ${titleSvg}
  </text>

  <text font-size="24" font-family="Arial, Helvetica, sans-serif" fill="#ffffff" opacity="0.58" font-weight="700">
    ${descSvg}
  </text>

  <g opacity="0.28">
    <rect x="760" y="420" width="390" height="170" rx="38" fill="#ffffff" opacity="0.08"/>
    <rect x="790" y="450" width="132" height="110" rx="24" fill="${accent}" opacity="0.18"/>
    <rect x="948" y="450" width="172" height="28" rx="14" fill="#ffffff" opacity="0.22"/>
    <rect x="948" y="498" width="122" height="24" rx="12" fill="#ffffff" opacity="0.14"/>
    <rect x="948" y="540" width="158" height="24" rx="12" fill="${accent}" opacity="0.22"/>
  </g>

  <text x="70" y="662" font-size="18" font-family="Arial, Helvetica, sans-serif" fill="${accent}" font-weight="900" letter-spacing="4">NOVA AI VIDEO STUDIO</text>
</svg>`;
}

const source = await fs.readFile(libPath, "utf8");
await fs.mkdir(outDir, { recursive: true });

const blocks = [...source.matchAll(/\{\s*id:\s*"([^"]+)"([\s\S]*?)(?=,\n\s*\{|\n\];)/g)];

if (!blocks.length) {
  throw new Error("No templates found in src/lib/viralTemplates.js");
}

for (const match of blocks) {
  const id = match[1];
  const block = match[0];

  const template = {
    id,
    name: getValue(block, "name") || id,
    category: getValue(block, "category") || "NOVA",
    badge: getValue(block, "badge") || "Template",
    title: getValue(block, "title"),
    description: getValue(block, "description"),
  };

  const svg = svgForTemplate(template);
  await fs.writeFile(path.join(outDir, `${id}.svg`), svg, "utf8");
  console.log(`created ${id}.svg`);
}

console.log(`Done. Created ${blocks.length} template previews.`);
