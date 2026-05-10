import { fal } from "@fal-ai/client";
import { LANDING_PAGE_WITH_IMAGES } from "@/lib/novaLandingPricing";

function falKey() {
  return (
    process.env.FAL_KEY ||
    process.env.FAL_API_KEY ||
    process.env.FAL_AI_KEY ||
    ""
  );
}

function clean(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

export function buildLandingImageSpecs(design = {}) {
  const product = clean(design.product, "premium product");
  const brand = clean(design.brandName, "NOVA Brand");
  const style = clean(
    design.style,
    "premium black and neon green ecommerce campaign"
  );

  const prompts = Array.isArray(design?.assets?.imagePrompts)
    ? design.assets.imagePrompts
    : [];

  return [
    {
      role: "hero",
      fileName: "nova-hero.png",
      imageSize: "landscape_16_9",
      prompt:
        prompts[0] ||
        `Hero image for ${product} by ${brand}, ${style}, black background, neon green highlights, premium ecommerce lighting, no text, no watermark.`,
    },
    {
      role: "product",
      fileName: "nova-product-showcase.png",
      imageSize: "square_hd",
      prompt:
        prompts[1] ||
        `Premium product showcase image for ${product}, ${style}, luxury close-up, clean composition, no text, no watermark.`,
    },
    {
      role: "lifestyle",
      fileName: "nova-lifestyle.png",
      imageSize: "square_hd",
      prompt:
        prompts[2] ||
        `Lifestyle ecommerce campaign image for ${product}, ${style}, aspirational customer moment, no text, no watermark.`,
    },
    {
      role: "mobile",
      fileName: "nova-mobile-hero.png",
      imageSize: "portrait_16_9",
      prompt: `Mobile hero image for ${product}, ${style}, vertical composition, dramatic product focus, no text, no watermark.`,
    },
  ];
}

export async function generateLandingImages(design = {}) {
  const key = falKey();

  if (!key) {
    throw new Error("FAL_KEY is missing. Add FAL_KEY to Vercel environment variables.");
  }

  fal.config({ credentials: key });

  const specs = buildLandingImageSpecs(design);

  const results = [];

  for (const spec of specs) {
    const result = await fal.subscribe(LANDING_PAGE_WITH_IMAGES.imageModel, {
      input: {
        prompt: spec.prompt,
        image_size: spec.imageSize,
        num_images: 1,
        output_format: "png",
        enable_safety_checker: true,
      },
      logs: false,
    });

    const image =
      result?.data?.images?.[0] ||
      result?.images?.[0] ||
      result?.data?.image ||
      null;

    const url = image?.url || image;

    if (!url || typeof url !== "string") {
      throw new Error(`fal.ai did not return an image URL for ${spec.role}.`);
    }

    results.push({
      role: spec.role,
      fileName: spec.fileName,
      zipPath: `assets/${spec.fileName}`,
      url,
      prompt: spec.prompt,
      model: LANDING_PAGE_WITH_IMAGES.imageModel,
      imageSize: spec.imageSize,
    });
  }

  return results;
}

export async function downloadGeneratedImages(generatedImages = []) {
  const files = [];

  for (const image of generatedImages) {
    try {
      const res = await fetch(image.url, { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`Could not download image: ${res.status}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());

      files.push({
        path: image.zipPath,
        content: buffer,
      });
    } catch {
      files.push({
        path: image.zipPath.replace(/\.png$/i, ".svg"),
        content: fallbackSvg(image.role, image.prompt),
      });
    }
  }

  return files;
}

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fallbackSvg(role, prompt) {
  return `<svg width="1400" height="900" viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
  <rect width="1400" height="900" fill="#020303"/>
  <circle cx="280" cy="250" r="260" fill="#D7FF00" opacity=".18"/>
  <rect x="120" y="120" width="1160" height="660" rx="54" fill="#070707" stroke="#D7FF00" stroke-opacity=".4"/>
  <text x="170" y="410" fill="#D7FF00" font-family="Arial" font-size="54" font-weight="900">NOVA ${escapeXml(role)}</text>
  <text x="170" y="480" fill="#ffffff" opacity=".72" font-family="Arial" font-size="24">${escapeXml(prompt).slice(0, 100)}</text>
</svg>`;
}
