const CLOUDFLARE_AI_BASE = "https://api.cloudflare.com/client/v4/accounts";

// Server-only fallback. The browser and public NOVA API never receive the engine id.
// Production may override this with NOVA_IMAGE_FREE_ENGINE_MODEL at any time.
if (!process.env.NOVA_IMAGE_FREE_ENGINE_MODEL) {
  process.env.NOVA_IMAGE_FREE_ENGINE_MODEL = Buffer.from(
    "QGNmL2JsYWNrLWZvcmVzdC1sYWJzL2ZsdXgtMS1zY2huZWxs",
    "base64"
  ).toString("utf8");
}

function credentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return null;
  return { accountId, apiToken };
}

export function canUseCloudflareWorkersAI() {
  return Boolean(credentials());
}

export async function runCloudflareImage({ model, prompt, steps = 4, seed } = {}) {
  const creds = credentials();
  if (!creds) throw new Error("Cloudflare Workers AI credentials are not configured");
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
