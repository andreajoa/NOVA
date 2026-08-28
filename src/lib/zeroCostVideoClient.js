import { getPresignedUploadUrl } from "@/lib/r2";
import { createFreeVideoJob } from "@/lib/freeVideoJobs";

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

export async function runZeroCostVideo(input = {}, context = {}) {
  const worker = config();
  if (!worker) throw new Error("NOVA zero-cost video worker is not configured");
  if (!context.userId) throw new Error("NOVA video job requires a user");

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
