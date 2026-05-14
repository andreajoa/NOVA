import fs from "node:fs/promises";
import path from "node:path";
import { fal } from "@fal-ai/client";

const envPath = path.join(process.cwd(), ".env.local");

async function loadEnvFile() {
  try {
    const text = await fs.readFile(envPath, "utf8");

    for (const line of text.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
      const [key, ...rest] = line.split("=");
      if (!process.env[key]) process.env[key] = rest.join("=");
    }
  } catch {}
}

function getValue(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*"([^"]*)"`, "m"));
  return match?.[1] || "";
}

function extractFirstUrl(payload) {
  const urls = [];

  function walk(value) {
    if (!value) return;

    if (typeof value === "string") {
      const matches = value.match(/https?:\/\/[^\s"'<>\\]+/g) || [];
      urls.push(...(matches.length ? matches : [value]).filter((url) => /^https?:\/\//.test(url)));
      return;
    }

    if (Array.isArray(value)) return value.forEach(walk);
    if (typeof value === "object") Object.values(value).forEach(walk);
  }

  walk(payload);
  return [...new Set(urls)][0] || "";
}

function aiPrompt(template) {
  return `
Create a premium 16:9 visual preview image for a website template card.

Template name: ${template.name}
Category: ${template.category}
Template purpose: ${template.title || template.description}

The image should visually demonstrate the expected result of this NOVA template.
Style: ultra premium AI creative platform, black and neon lime green brand palette, cinematic lighting, modern social media ad aesthetic, high contrast, clean composition.
No readable text, no logos, no watermark, no UI screenshots.
Make it look like an example output users would want to generate.
`.trim();
}

await loadEnvFile();

if (!process.env.FAL_KEY) {
  throw new Error("Missing FAL_KEY in environment or .env.local");
}

fal.config({
  credentials: process.env.FAL_KEY,
});

const source = await fs.readFile(path.join(process.cwd(), "src/lib/viralTemplates.js"), "utf8");
const outDir = path.join(process.cwd(), "public/nova/template-previews");
await fs.mkdir(outDir, { recursive: true });

const blocks = [...source.matchAll(/\{\s*id:\s*"([^"]+)"([\s\S]*?)(?=,\n\s*\{|\n\];)/g)];

for (const match of blocks) {
  const id = match[1];
  const block = match[0];
  const outPath = path.join(outDir, `${id}.png`);

  const alreadyExists = await fs
    .access(outPath)
    .then(() => true)
    .catch(() => false);

  if (alreadyExists && !process.argv.includes("--force")) {
    console.log(`skip existing ${id}.png`);
    continue;
  }

  const template = {
    id,
    name: getValue(block, "name") || id,
    category: getValue(block, "category") || "NOVA",
    title: getValue(block, "title"),
    description: getValue(block, "description"),
  };

  console.log(`generating ${id}...`);

  const result = await fal.subscribe("openai/gpt-image-2", {
    input: {
      prompt: aiPrompt(template),
    },
    logs: true,
  });

  const url = extractFirstUrl(result);

  if (!url) {
    console.warn(`no image URL returned for ${id}`);
    continue;
  }

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`could not download ${id}: HTTP ${response.status}`);
    continue;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outPath, buffer);
  console.log(`saved ${outPath}`);
}

console.log("AI preview generation finished.");
