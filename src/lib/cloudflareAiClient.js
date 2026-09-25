const CLOUDFLARE_AI_BASE = "https://api.cloudflare.com/client/v4/accounts";
// FLUX.2 [klein] 4B (Apache-2.0): chosen for NOVA IMAGEM FREE after a
// same-prompt benchmark against FLUX.1 schnell — clearly more realistic people
// and scenes, equal text quality, ~104 neurons per 1024px image on the free
// Workers AI allocation. FLUX.1 schnell stays as the first fallback.
const DEFAULT_NOVA_IMAGE_MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
const SCHNELL_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const HF_IMAGE_BASE = "https://stabilityai-stable-diffusion-3-5-large.hf.space";
const HF_IMAGE_API = "infer";

if (!process.env.NOVA_IMAGE_FREE_ENGINE_MODEL) {
  process.env.NOVA_IMAGE_FREE_ENGINE_MODEL = DEFAULT_NOVA_IMAGE_MODEL;
}

function credentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return null;
  return { accountId, apiToken };
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, timer };
}

function findImageUrl(value) {
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value) && /\.(png|jpe?g|webp|avif)(\?|#|$)/i.test(value)) return value;
    if (value.startsWith("/") && /\.(png|jpe?g|webp|avif)(\?|#|$)/i.test(value)) {
      return `${HF_IMAGE_BASE}${value}`;
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageUrl(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const key of ["url", "path", "image", "value"]) {
      if (key in value) {
        const found = findImageUrl(value[key]);
        if (found) return found;
      }
    }
    for (const item of Object.values(value)) {
      const found = findImageUrl(item);
      if (found) return found;
    }
  }
  return null;
}

async function runVerifiedFreeImage({ prompt, seed } = {}) {
  const actualSeed = Number.isFinite(Number(seed)) ? Number(seed) : Math.floor(Math.random() * 2_000_000_000);
  const submitUrl = `${HF_IMAGE_BASE}/gradio_api/call/${HF_IMAGE_API}`;
  const { controller, timer } = withTimeout(45000);
  let submitResponse;
  try {
    submitResponse = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "NOVA-free-image/2.1",
      },
      body: JSON.stringify({
        data: [
          String(prompt || "").slice(0, 1800),
          "",
          actualSeed,
          false,
          1024,
          1024,
          4.5,
          20,
        ],
      }),
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const submitText = await submitResponse.text();
  let submitPayload = {};
  try {
    submitPayload = submitText ? JSON.parse(submitText) : {};
  } catch {
    submitPayload = {};
  }

  if (!submitResponse.ok || !submitPayload?.event_id) {
    throw new Error(`NOVA free image queue rejected the job (${submitResponse.status})`);
  }

  const resultUrl = `${submitUrl}/${encodeURIComponent(submitPayload.event_id)}`;
  const resultTimeout = withTimeout(70000);
  let resultResponse;
  try {
    resultResponse = await fetch(resultUrl, {
      method: "GET",
      cache: "no-store",
      signal: resultTimeout.controller.signal,
      headers: {
        Accept: "text/event-stream, application/json",
        "User-Agent": "NOVA-free-image/2.1",
      },
    });
  } finally {
    clearTimeout(resultTimeout.timer);
  }

  if (!resultResponse.ok) {
    throw new Error(`NOVA free image queue failed (${resultResponse.status})`);
  }

  const text = await resultResponse.text();
  if (text.includes("event: error")) {
    throw new Error("NOVA free image runtime reported a generation error");
  }

  const blocks = text.replace(/\r\n/g, "\n").split("\n\n");
  let completedData = null;
  for (const block of blocks) {
    if (!block.includes("event: complete")) continue;
    const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
    if (!dataLine) continue;
    try {
      completedData = JSON.parse(dataLine.slice(6));
    } catch {
      completedData = null;
    }
    if (completedData) break;
  }

  const imageUrl = findImageUrl(completedData);
  if (!imageUrl) throw new Error("NOVA free image runtime returned no image URL");

  return {
    images: [
      {
        url: imageUrl,
        content_type: imageUrl.includes(".png") ? "image/png" : imageUrl.includes(".jpg") || imageUrl.includes(".jpeg") ? "image/jpeg" : "image/webp",
      },
    ],
  };
}

export function canUseCloudflareWorkersAI() {
  return Boolean(credentials());
}

const IMAGE_HEALTH_CACHE_MS = 30_000;
let imageHealthCache = { checkedAt: 0, available: false };

export async function isFreeImageRuntimeHealthy() {
  const now = Date.now();
  if (now - imageHealthCache.checkedAt < IMAGE_HEALTH_CACHE_MS) {
    return imageHealthCache.available;
  }

  const probe = withTimeout(4000);
  let fallbackAvailable = false;
  try {
    const response = await fetch(`${HF_IMAGE_BASE}/config`, {
      method: "GET",
      cache: "no-store",
      signal: probe.controller.signal,
      headers: { "User-Agent": "NOVA-free-image-health/1.0" },
    });
    fallbackAvailable = response.ok;
  } catch {
    fallbackAvailable = false;
  } finally {
    clearTimeout(probe.timer);
  }

  const available = fallbackAvailable || Boolean(credentials());
  imageHealthCache = { checkedAt: now, available };
  return available;
}

function imageMime(base64) {
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

function clampSide(value, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(256, Math.min(1920, Math.round(n / 16) * 16));
}

async function runPrimaryCloudflareImage({ model, prompt, steps = 4, seed, width, height } = {}) {
  const creds = credentials();
  if (!creds) throw new Error("Cloudflare Workers AI credentials are not configured");
  if (!model || !String(model).startsWith("@cf/")) {
    throw new Error("Invalid Cloudflare-hosted model");
  }

  const url = `${CLOUDFLARE_AI_BASE}/${creds.accountId}/ai/run/${model}`;
  const text2048 = String(prompt || "").slice(0, 2048);
  // FLUX.2 models take multipart form data (steps are fixed by the model);
  // FLUX.1 schnell takes JSON.
  const multipart = String(model).includes("/flux-2");
  let body;
  const headers = { Authorization: `Bearer ${creds.apiToken}` };
  if (multipart) {
    body = new FormData();
    body.append("prompt", text2048);
    body.append("width", String(clampSide(width, 1024)));
    body.append("height", String(clampSide(height, 1024)));
  } else {
    const input = {
      prompt: text2048,
      steps: Math.max(1, Math.min(8, Number(steps) || 4)),
    };
    if (Number.isFinite(Number(seed))) input.seed = Number(seed);
    body = JSON.stringify(input);
    headers["Content-Type"] = "application/json";
  }

  const { controller, timer } = withTimeout(30000);
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

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
    throw error;
  }

  const result = json?.result ?? json;
  const base64 = result?.image;
  if (!base64 || typeof base64 !== "string") {
    throw new Error("Cloudflare Workers AI returned no image");
  }

  const mime = imageMime(base64);
  return {
    images: [
      {
        url: `data:${mime};base64,${base64}`,
        content_type: mime,
      },
    ],
  };
}

export async function runCloudflareImage({ model, prompt, steps = 4, seed, width, height } = {}) {
  const chain = [model, SCHNELL_MODEL].filter((item, index, list) => item && list.indexOf(item) === index);
  for (const candidate of chain) {
    try {
      return await runPrimaryCloudflareImage({ model: candidate, prompt, steps, seed, width, height });
    } catch (engineError) {
      console.error("[NOVA_IMAGE] engine failed; trying the next one", {
        engine: candidate === SCHNELL_MODEL ? "fallback-1" : "primary",
        message: engineError?.message || String(engineError),
        status: engineError?.status || null,
      });
    }
  }
  return runVerifiedFreeImage({ prompt, seed });
}
