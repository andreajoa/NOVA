import { prepareFreeVideoJobRetry } from "@/lib/freeVideoJobs";

const FALLBACK_GRADIO_BASE = Buffer.from(
  "aHR0cHM6Ly9saWdodHJpY2tzLWx0eC0yLTMuaGYuc3BhY2U=",
  "base64"
).toString("utf8");
const FALLBACK_API_NAME = "generate_video";

function dimensionsForAspect(aspect) {
  if (aspect === "9:16") return { height: 768, width: 512 };
  if (aspect === "1:1") return { height: 512, width: 512 };
  return { height: 512, width: 768 };
}

async function uploadImage(imageUrl) {
  if (!imageUrl) return null;
  const sourceController = new AbortController();
  const sourceTimer = setTimeout(() => sourceController.abort(), 15_000);
  let source;
  try {
    source = await fetch(imageUrl, { method: "GET", cache: "no-store", signal: sourceController.signal });
  } finally {
    clearTimeout(sourceTimer);
  }
  if (!source?.ok) throw new Error("NOVA public fallback could not read the reference image");
  const contentType = source.headers.get("content-type") || "image/jpeg";
  const bytes = await source.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 12_000_000) {
    throw new Error("NOVA public fallback reference image is invalid");
  }

  const form = new FormData();
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  form.append("files", new Blob([bytes], { type: contentType }), `nova-reference.${extension}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  let response;
  try {
    response = await fetch(`${FALLBACK_GRADIO_BASE}/gradio_api/upload`, {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": "NOVA-video-failover/1.0" },
    });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new Error(`NOVA public fallback image upload failed (${response.status})`);
  const paths = await response.json().catch(() => []);
  const path = Array.isArray(paths) ? paths[0] : null;
  if (!path) throw new Error("NOVA public fallback image upload returned no path");
  return { path, orig_name: `nova-reference.${extension}`, mime_type: contentType, meta: { _type: "gradio.FileData" } };
}

async function submitPublicJob(input) {
  const task = String(input?.task || "");
  if (!["text-to-video", "image-to-video"].includes(task)) {
    throw new Error(`Public fallback does not support ${task}`);
  }

  const image = task === "image-to-video" ? await uploadImage(input.image_url) : null;
  const { height, width } = dimensionsForAspect(input.aspect_ratio);
  const seed = Number.isFinite(Number(input.seed)) ? Number(input.seed) : Math.floor(Math.random() * 1_000_000);
  const prompt = [
    String(input.prompt || "").trim(),
    input.negative_prompt ? `Avoid: ${String(input.negative_prompt).trim()}` : "",
  ].filter(Boolean).join("\n");

  const payload = JSON.stringify({
    data: [image, prompt, Number(input.duration || 5), false, seed, false, height, width],
  });

  const failures = [];
  for (const root of [
    `${FALLBACK_GRADIO_BASE}/gradio_api/call/${FALLBACK_API_NAME}`,
    `${FALLBACK_GRADIO_BASE}/call/${FALLBACK_API_NAME}`,
  ]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(root, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "NOVA-video-failover/1.0" },
        body: payload,
        cache: "no-store",
        signal: controller.signal,
      });
      const text = await response.text();
      let parsed = {};
      try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = {}; }
      if (response.ok && parsed?.event_id) {
        return `${root}/${encodeURIComponent(parsed.event_id)}`;
      }
      failures.push(`${response.status}:${text.slice(0, 160)}`);
    } catch (error) {
      failures.push(error?.message || String(error));
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`NOVA public fallback rejected retry: ${failures.join(" | ").slice(0, 700)}`);
}

export async function retryFreeVideoJobOnPublicFallback({ job, callbackToken }) {
  if (!job?.id || !job?.input || !callbackToken) {
    throw new Error("NOVA public fallback retry context is incomplete");
  }
  const pollUrl = await submitPublicJob(job.input);
  const prepared = await prepareFreeVideoJobRetry({
    jobId: job.id,
    callbackToken,
    publicUrl: pollUrl,
    engine: "public-hf",
  });
  if (!prepared) throw new Error("NOVA could not move the video job to the public fallback");
  return { processing: true, jobId: job.id, engine: "public-hf" };
}
