import { randomUUID } from "node:crypto";
import { getPresignedUploadUrl } from "@/lib/r2";
import { createFreeVideoJob, markFreeVideoJobFailed } from "@/lib/freeVideoJobs";

function normalizeUrl(value) {
  const raw = String(value || "").trim().replace(/\/$/, "");
  return /^https:\/\//i.test(raw) ? raw : "";
}

function workerConfigs() {
  const workers = [
    {
      id: "modal",
      url: normalizeUrl(process.env.NOVA_MODAL_VIDEO_URL),
      secret: String(process.env.NOVA_MODAL_VIDEO_SECRET || process.env.NOVA_ZERO_COST_VIDEO_SECRET || "").trim(),
    },
    {
      id: "lightning",
      url: normalizeUrl(process.env.NOVA_LIGHTNING_VIDEO_URL),
      secret: String(process.env.NOVA_LIGHTNING_VIDEO_SECRET || process.env.NOVA_ZERO_COST_VIDEO_SECRET || "").trim(),
    },
  ].filter((worker) => worker.url);

  const seen = new Set();
  return workers.filter((worker) => {
    if (seen.has(worker.url)) return false;
    seen.add(worker.url);
    return true;
  });
}

export function hasPrivateGpuVideoPool() {
  return workerConfigs().length > 0;
}

function callbackBase(origin) {
  const candidate = String(origin || process.env.NOVA_APP_URL || "https://www.novvideos.online").replace(/\/$/, "");
  if (!/^https:\/\//i.test(candidate) && !/^http:\/\/localhost(?::\d+)?$/i.test(candidate)) {
    throw new Error("Invalid NOVA callback origin");
  }
  return candidate;
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
  const key = `nova-included/video/${date}/${task}-${randomUUID()}.mp4`;
  const target = await getPresignedUploadUrl(key, "video/mp4");
  return {
    upload_url: target.uploadUrl,
    public_url: target.publicUrl,
    content_type: "video/mp4",
  };
}

async function workerHealthy(worker) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${worker.url}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: worker.secret ? { Authorization: `Bearer ${worker.secret}` } : undefined,
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

export async function isPrivateGpuVideoPoolHealthy() {
  const workers = workerConfigs();
  if (!workers.length) return false;
  for (const worker of workers) {
    if (await workerHealthy(worker)) return true;
  }
  return false;
}

async function submitWorker(worker, input = {}, context = {}) {
  const outputTarget = await createOutputTarget(input);
  const job = await createFreeVideoJob({
    userId: context.userId,
    publicUrl: outputTarget.public_url,
    quotaDebited: Boolean(context.quotaDebited),
  });
  const callbackUrl = `${callbackBase(context.origin)}/api/internal/free-video-callback?job=${encodeURIComponent(job.id)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(worker.url, {
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

    const text = await response.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }

    if (!response.ok || (payload?.accepted !== true && payload?.status !== "processing")) {
      await markFreeVideoJobFailed(job.id, `SUBMIT_${worker.id.toUpperCase()}_${response.status || 0}`).catch(() => {});
      const error = new Error(`NOVA ${worker.id} video worker rejected the job (${response.status || 0})`);
      error.status = response.status || 0;
      throw error;
    }

    return {
      processing: true,
      jobId: job.id,
      engine: worker.id,
      video: { url: outputTarget.public_url },
    };
  } catch (error) {
    await markFreeVideoJobFailed(job.id, `SUBMIT_${worker.id.toUpperCase()}_FAILED`).catch(() => {});
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function runPrivateGpuVideoPool(input = {}, context = {}) {
  if (!context.userId) throw new Error("NOVA private GPU video job requires a user");

  const workers = workerConfigs();
  if (!workers.length) throw new Error("NOVA private GPU video pool is not configured");

  const failures = [];
  for (const worker of workers) {
    const healthy = await workerHealthy(worker);
    if (!healthy) {
      failures.push(`${worker.id}:health`);
      continue;
    }

    try {
      return await submitWorker(worker, input, context);
    } catch (error) {
      failures.push(`${worker.id}:${error?.message || String(error)}`);
      console.warn("[NOVA_VIDEO] private GPU worker failed; trying next provider", {
        engine: worker.id,
        message: String(error?.message || error).slice(0, 500),
      });
    }
  }

  const error = new Error(`NOVA private GPU pool unavailable: ${failures.join(" | ").slice(0, 1000)}`);
  error.code = "NOVA_PRIVATE_GPU_POOL_UNAVAILABLE";
  throw error;
}
