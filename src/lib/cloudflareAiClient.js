const CLOUDFLARE_AI_BASE = "https://api.cloudflare.com/client/v4/accounts";
const DEFAULT_NOVA_IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const LEGACY_FREE_IMAGE_BASE = "https://image.pollinations.ai/prompt";

// Keep the NOVA included image route usable even when a dedicated Cloudflare
// Workers AI account has not been attached to this deployment yet. The route
// reads this env var after importing this module, so a safe default keeps the
// server-side NOVA alias configured without exposing an engine to the browser.
if (!process.env.NOVA_IMAGE_FREE_ENGINE_MODEL) {
  process.env.NOVA_IMAGE_FREE_ENGINE_MODEL = DEFAULT_NOVA_IMAGE_MODEL;
}

function credentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return null;
  return { accountId, apiToken };
}

function fallbackImageUrl({ prompt, seed }) {
  const query = new URLSearchParams({
    width: "1024",
    height: "1024",
    nologo: "true",
    enhance: "true",
    safe: "true",
  });
  if (Number.isFinite(Number(seed))) query.set("seed", String(Number(seed)));
  return `${LEGACY_FREE_IMAGE_BASE}/${encodeURIComponent(String(prompt || "").slice(0, 1800))}?${query.toString()}`;
}

async function runAnonymousFreeImage({ prompt, seed } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);
  try {
    const response = await fetch(fallbackImageUrl({ prompt, seed }), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
        "User-Agent": "NOVA-free-image/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`NOVA fallback image engine failed (${response.status})`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.toLowerCase().startsWith("image/")) {
      throw new Error("NOVA fallback image engine returned a non-image response");
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) throw new Error("NOVA fallback image engine returned an empty image");
    if (bytes.length > 4_000_000) throw new Error("NOVA fallback image output is too large");

    return {
      images: [
        {
          url: `data:${contentType.split(";")[0]};base64,${bytes.toString("base64")}`,
          content_type: contentType.split(";")[0],
        },
      ],
    };
  } finally {
    clearTimeout(timer);
  }
}

export function canUseCloudflareWorkersAI() {
  // A dedicated Workers AI account is preferred, but the server-side anonymous
  // fallback keeps NOVA IMAGEM FREE operational on deployments without it.
  return true;
}

export async function runCloudflareImage({ model, prompt, steps = 4, seed } = {}) {
  const creds = credentials();

  if (!creds) {
    return runAnonymousFreeImage({ prompt, seed });
  }

  if (!model || !String(model).startsWith("@cf/")) {
    throw new Error("Invalid Cloudflare-hosted model");
  }

  const url = `${CLOUDFLARE_AI_BASE}/${creds.accountId}/ai/run/${model}`;
  const input = {
    prompt: String(prompt || "").slice(0, 2048),
    steps: Math.max(1, Math.min(8, Number(steps) || 4)),
  };
  if (Number.isFinite(Number(seed))) input.seed = Number(seed);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok || json?.success === false) {
    const details = json?.errors?.[0]?.message || json?.messages?.[0]?.message || text || `HTTP ${response.status}`;
    const error = new Error(`Cloudflare Workers AI failed: ${details}`);
    error.status = response.status;
    error.cloudflare = json;
    throw error;
  }

  const result = json?.result ?? json;
  const base64 = result?.image;
  if (!base64 || typeof base64 !== "string") {
    throw new Error("Cloudflare Workers AI returned no image");
  }

  return {
    images: [
      {
        url: `data:image/jpeg;base64,${base64}`,
        content_type: "image/jpeg",
      },
    ],
  };
}
