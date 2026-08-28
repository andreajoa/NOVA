import { getPresignedUploadUrl } from "@/lib/r2";
import { createFreeVideoJob } from "@/lib/freeVideoJobs";

const FALLBACK_GRADIO_BASE = Buffer.from(
  "aHR0cHM6Ly9saWdodHJpY2tzLWx0eC0yLTMuaGYuc3BhY2U=",
  "base64"
).toString("utf8");
const FALLBACK_API_NAME = "generate_video";

function privateWorkerConfig() {
  const url = process.env.NOVA_ZERO_COST_VIDEO_URL;
  if (!url) return null;
  return {
    url: String(url).replace(/\/$/, ""),
    secret: process.env.NOVA_ZERO_COST_VIDEO_SECRET || "",
  };
}

export function canUseZeroCostVideoWorker() {
  // NOVA prefers its private worker when configured, but has a server-side
  // zero-cost public runtime fallback so the product does not become a dead UI.
  return true;
}

export async function isZeroCostVideoWorkerHealthy() {
  const worker = privateWorkerConfig();
  if (!worker) {
    // The public fallback is queue-based and can cold-start. Treat it as
    // available here and let the actual submit return a precise failure if the
    // upstream queue is temporarily unavailable.
    return true;
  }

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

function safeSegment(value, fallback = "video") {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || fallback;
}

async function createOutputTarget(input = {}) {
  if (!process.env.R2_BUCKET || !process.env.R2_PUBLIC_URL) {
    throw new Error("NOVA video output storage is not configured");
  }

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

function callbackBase(origin) {
  const candidate = String(origin || process.env.NOVA_APP_URL || "https://www.novvideos.online").replace(/\/$/, "");
  if (!/^https:\/\//i.test(candidate) && !/^http:\/\/localhost(?::\d+)?$/i.test(candidate)) {
    throw new Error("Invalid NOVA callback origin");
  }
  return candidate;
}

function dimensionsForAspect(aspect) {
  if (aspect === "9:16") return { height: 768, width: 512 };
  if (aspect === "1:1") return { height: 512, width: 512 };
  return { height: 512, width: 768 };
}

async function uploadGradioImage(imageUrl) {
  const sourceController = new AbortController();
  const sourceTimer = setTimeout(() => sourceController.abort(), 15000);
  let source;
  try {
    source = await fetch(imageUrl, {
      method: "GET",
      cache: "no-store",
      signal: sourceController.signal,
    });
  } finally {
    clearTimeout(sourceTimer);
  }

  if (!source?.ok) throw new Error("NOVA could not read the reference image");
  const contentType = source.headers.get("content-type") || "image/jpeg";
  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new Error("NOVA reference is not an image");
  }

  const bytes = await source.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 12_000_000) {
    throw new Error("NOVA reference image is empty or too large");
  }

  const form = new FormData();
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  form.append("files", new Blob([bytes], { type: contentType }), `nova-reference.${extension}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  let response;
  try {
    response = await fetch(`${FALLBACK_GRADIO_BASE}/gradio_api/upload`, {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": "NOVA-free-video/1.0" },
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) throw new Error(`NOVA reference upload failed (${response.status})`);
  const paths = await response.json().catch(() => []);
  const path = Array.isArray(paths) ? paths[0] : null;
  if (!path) throw new Error("NOVA reference upload returned no file path");

  return {
    path,
    orig_name: `nova-reference.${extension}`,
    mime_type: contentType,
    meta: { _type: "gradio.FileData" },
  };
}

async function submitGradioJob(input = {}) {
  if (input.task === "continue-video") {
    throw new Error("NOVA continuation requires the dedicated video worker");
  }

  const image = input.image_url ? await uploadGradioImage(input.image_url) : null;
  const { height, width } = dimensionsForAspect(input.aspect_ratio);
  const seed = Number.isFinite(Number(input.seed)) ? Number(input.seed) : Math.floor(Math.random() * 1_000_000);
  const prompt = [
    String(input.prompt || "").trim(),
    input.negative_prompt ? `Avoid: ${String(input.negative_prompt).trim()}` : "",
  ].filter(Boolean).join("\n");

  const payload = JSON.stringify({
    data: [
      image,
      prompt,
      Number(input.duration || 5),
      false,
      seed,
      false,
      height,
      width,
    ],
  });

  const errors = [];
  for (const root of [
    `${FALLBACK_GRADIO_BASE}/gradio_api/call/${FALLBACK_API_NAME}`,
    `${FALLBACK_GRADIO_BASE}/call/${FALLBACK_API_NAME}`,
  ]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(root, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "NOVA-free-video/1.0",
        },
        body: payload,
        cache: "no-store",
        signal: controller.signal,
      });
      const text = await response.text();
      const parsed = text ? JSON.parse(text) : {};
      if (response.ok && parsed?.event_id) {
        return {
          eventId: parsed.event_id,
          pollUrl: `${root}/${encodeURIComponent(parsed.event_id)}`,
        };
      }
      errors.push(`${response.status}:${text.slice(0, 180)}`);
    } catch (error) {
      errors.push(error?.message || String(error));
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`NOVA public video queue did not accept the job: ${errors.join(" | ").slice(0, 500)}`);
}

export function isZeroCostFallbackPollUrl(value) {
  const url = String(value || "");
  return (
    url.startsWith(`${FALLBACK_GRADIO_BASE}/gradio_api/call/${FALLBACK_API_NAME}/`) ||
    url.startsWith(`${FALLBACK_GRADIO_BASE}/call/${FALLBACK_API_NAME}/`)
  );
}

function findVideo(value) {
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value) && (/\.mp4(?:\?|#|$)/i.test(value) || /file=/i.test(value))) return value;
    if (value.startsWith("/") && (/\.mp4(?:\?|#|$)/i.test(value) || /file=/i.test(value))) {
      return `${FALLBACK_GRADIO_BASE}${value}`;
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVideo(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const key of ["url", "path", "video", "value"]) {
      if (key in value) {
        const found = findVideo(value[key]);
        if (found) return found;
      }
    }
    for (const item of Object.values(value)) {
      const found = findVideo(item);
      if (found) return found;
    }
  }
  return null;
}

export async function pollZeroCostFallbackJob(pollUrl) {
  if (!isZeroCostFallbackPollUrl(pollUrl)) return { status: "not_fallback" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(pollUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/event-stream, application/json",
        "User-Agent": "NOVA-free-video/1.0",
      },
    });

    if (!response.ok) {
      if ([404, 408, 425, 429, 500, 502, 503, 504].includes(response.status)) {
        return { status: "processing" };
      }
      return { status: "failed", errorCode: `UPSTREAM_${response.status}` };
    }

    const text = await response.text();
    const blocks = text.replace(/\r\n/g, "\n").split("\n\n");
    for (const block of blocks) {
      if (block.includes("event: error")) {
        return { status: "failed", errorCode: "UPSTREAM_GENERATION_ERROR" };
      }
      if (!block.includes("event: complete")) continue;

      const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
      if (!dataLine) return { status: "failed", errorCode: "UPSTREAM_EMPTY_RESULT" };

      let data;
      try {
        data = JSON.parse(dataLine.slice(6));
      } catch {
        return { status: "failed", errorCode: "UPSTREAM_INVALID_RESULT" };
      }

      const videoUrl = findVideo(data);
      if (!videoUrl) return { status: "failed", errorCode: "UPSTREAM_NO_VIDEO" };
      return { status: "completed", videoUrl };
    }

    return { status: "processing" };
  } catch (error) {
    if (error?.name === "AbortError") return { status: "processing" };
    return { status: "processing" };
  } finally {
    clearTimeout(timer);
  }
}

async function runPrivateWorker(worker, input = {}, context = {}) {
  const outputTarget = await createOutputTarget(input);
  const job = await createFreeVideoJob({
    userId: context.userId,
    publicUrl: outputTarget.public_url,
    quotaDebited: Boolean(context.quotaDebited),
  });
  const callbackUrl = `${callbackBase(context.origin)}/api/internal/free-video-callback?job=${encodeURIComponent(job.id)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch(worker.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(worker.secret ? { Authorization: `Bearer ${worker.secret}` } : {}),
      },
      body: JSON.stringify({
        input: {
          ...input,
          nova_output: outputTarget,
          nova_callback: {
            url: callbackUrl,
            token: job.callbackToken,
          },
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

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

  if (payload?.accepted !== true && payload?.status !== "processing") {
    throw new Error("NOVA video worker did not accept the generation job");
  }

  return {
    video: { url: outputTarget.public_url },
    processing: true,
    jobId: job.id,
  };
}

async function runPublicFallback(input = {}, context = {}) {
  const submitted = await submitGradioJob(input);
  const job = await createFreeVideoJob({
    userId: context.userId,
    publicUrl: submitted.pollUrl,
    quotaDebited: Boolean(context.quotaDebited),
  });

  return {
    processing: true,
    jobId: job.id,
  };
}

export async function runZeroCostVideo(input = {}, context = {}) {
  if (!context.userId) throw new Error("NOVA video job requires a user");

  const worker = privateWorkerConfig();
  if (worker) return runPrivateWorker(worker, input, context);
  return runPublicFallback(input, context);
}
