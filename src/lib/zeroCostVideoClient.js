import { getPresignedUploadUrl } from "@/lib/r2";

function config() {
  const url = process.env.NOVA_ZERO_COST_VIDEO_URL;
  if (!url) return null;
  return {
    url: String(url).replace(/\/$/, ""),
    secret: process.env.NOVA_ZERO_COST_VIDEO_SECRET || "",
  };
}

export function canUseZeroCostVideoWorker() {
  return Boolean(config());
}

export async function isZeroCostVideoWorkerHealthy() {
  const worker = config();
  if (!worker) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${worker.url}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const payload = await response.json().catch(() => ({}));
    return payload?.ok === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeVideoOutput(payload) {
  const out = payload?.output ?? payload?.result ?? payload;
  const url =
    out?.video?.url ||
    out?.video_url ||
    out?.videoUrl ||
    out?.url ||
    (Array.isArray(out?.videos) ? out.videos[0]?.url || out.videos[0] : null);

  if (typeof url === "string" && (/^https?:\/\//i.test(url) || /^data:video\//i.test(url))) {
    return { video: { url } };
  }

  if (out?.video_base64) {
    return { video: { url: `data:video/mp4;base64,${out.video_base64}` } };
  }

  throw new Error("NOVA zero-cost video worker returned no video");
}

function safeSegment(value, fallback = "video") {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || fallback;
}

async function createOutputTarget(input = {}) {
  if (!process.env.R2_BUCKET || !process.env.R2_PUBLIC_URL) return null;

  const date = new Date().toISOString().slice(0, 10);
  const task = safeSegment(input.task, "video");
  const random = crypto.randomUUID();
  const key = `nova-included/video/${date}/${task}-${random}.mp4`;
  const target = await getPresignedUploadUrl(key, "video/mp4");
  return {
    upload_url: target.uploadUrl,
    public_url: target.publicUrl,
    content_type: "video/mp4",
  };
}

export async function runZeroCostVideo(input = {}) {
  const worker = config();
  if (!worker) throw new Error("NOVA zero-cost video worker is not configured");

  const outputTarget = await createOutputTarget(input).catch((error) => {
    console.warn("[NOVA_VIDEO] could not prepare direct R2 output target", error?.message || error);
    return null;
  });

  const response = await fetch(worker.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(worker.secret ? { Authorization: `Bearer ${worker.secret}` } : {}),
    },
    body: JSON.stringify({
      input: {
        ...input,
        ...(outputTarget && { nova_output: outputTarget }),
      },
    }),
    cache: "no-store",
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`NOVA zero-cost video worker failed (${response.status})`);
  }

  // When the worker uploads directly to the pre-signed R2 target it may return
  // only a success flag. In that case NOVA can safely use the private public URL
  // it generated before dispatching the job.
  try {
    return normalizeVideoOutput(payload);
  } catch (error) {
    if (outputTarget?.public_url && (payload?.success === true || payload?.uploaded === true)) {
      return { video: { url: outputTarget.public_url } };
    }
    throw error;
  }
}
