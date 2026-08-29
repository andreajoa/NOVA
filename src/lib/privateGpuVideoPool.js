import { randomUUID } from "node:crypto";
import { getPresignedUploadUrl } from "@/lib/r2";
import {
  createFreeVideoJob,
  markFreeVideoJobFailed,
  prepareFreeVideoJobRetry,
} from "@/lib/freeVideoJobs";

function normalizeUrl(value) {
  const raw = String(value || "").trim().replace(/\/$/, "");
  return /^https:\/\//i.test(raw) ? raw : "";
}

function workerConfigs() {
  const entries = [
    {
      id: "modal",
      url: normalizeUrl(process.env.NOVA_MODAL_VIDEO_URL || process.env.NOVA_ZERO_COST_VIDEO_URL),
      secret: String(process.env.NOVA_MODAL_VIDEO_SECRET || process.env.NOVA_ZERO_COST_VIDEO_SECRET || "").trim(),
      declaredTasks: new Set(["text-to-video", "image-to-video", "continue-video"]),
    },
    {
      id: "modal-speech",
      url: normalizeUrl(process.env.NOVA_MODAL_SPEECH_VIDEO_URL || process.env.NOVA_MODAL_VIDEO_URL || process.env.NOVA_ZERO_COST_VIDEO_URL),
      secret: String(process.env.NOVA_MODAL_VIDEO_SECRET || process.env.NOVA_ZERO_COST_VIDEO_SECRET || "").trim(),
      declaredTasks: new Set(["speech-video"]),
    },
    {
      id: "lightning",
      url: normalizeUrl(process.env.NOVA_LIGHTNING_VIDEO_URL),
      secret: String(process.env.NOVA_LIGHTNING_VIDEO_SECRET || process.env.NOVA_ZERO_COST_VIDEO_SECRET || "").trim(),
      declaredTasks: new Set(["text-to-video", "image-to-video", "continue-video"]),
    },
    {
      id: "lightning-speech",
      url: normalizeUrl(process.env.NOVA_LIGHTNING_SPEECH_VIDEO_URL),
      secret: String(process.env.NOVA_LIGHTNING_VIDEO_SECRET || process.env.NOVA_ZERO_COST_VIDEO_SECRET || "").trim(),
      declaredTasks: new Set(["speech-video"]),
    },
  ].filter((worker) => worker.url);

  const seen = new Set();
  return entries.filter((worker) => {
    const key = `${worker.id}:${worker.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function workersForTask(task) {
  return workerConfigs().filter((worker) => worker.declaredTasks.has(task));
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

async function workerHealth(worker) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(`${worker.url}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: worker.secret ? { Authorization: `Bearer ${worker.secret}` } : undefined,
    });
    if (!response.ok) return { ok: false, tasks: new Set() };
    const payload = await response.json().catch(() => ({}));
    if (payload?.ok !== true) return { ok: false, tasks: new Set() };
    const reported = Array.isArray(payload?.tasks)
      ? payload.tasks.map((item) => String(item || ""))
      : [];
    return {
      ok: true,
      tasks: new Set(reported.length ? reported : [...worker.declaredTasks]),
    };
  } catch {
    return { ok: false, tasks: new Set() };
  } finally {
    clearTimeout(timer);
  }
}

export async function getPrivateGpuVideoCapabilities() {
  const capabilities = {
    available: false,
    textToVideo: false,
    imageToVideo: false,
    continueVideo: false,
    speechVideo: false,
    providers: [],
  };

  const providerSeen = new Set();
  for (const worker of workerConfigs()) {
    const health = await workerHealth(worker);
    if (!health.ok) continue;
    capabilities.available = true;
    const provider = worker.id.replace("-speech", "");
    if (!providerSeen.has(provider)) {
      providerSeen.add(provider);
      capabilities.providers.push(provider);
    }
    if (health.tasks.has("text-to-video")) capabilities.textToVideo = true;
    if (health.tasks.has("image-to-video")) capabilities.imageToVideo = true;
    if (health.tasks.has("continue-video")) capabilities.continueVideo = true;
    if (health.tasks.has("speech-video")) capabilities.speechVideo = true;
  }

  return capabilities;
}

async function submitWorker(worker, input = {}, context = {}, existingJob = null) {
  const outputTarget = await createOutputTarget(input);
  let job = existingJob;

  if (job) {
    const prepared = await prepareFreeVideoJobRetry({
      jobId: job.id,
      callbackToken: job.callbackToken,
      publicUrl: outputTarget.public_url,
      engine: worker.id,
    });
    if (!prepared) throw new Error("NOVA could not prepare the existing video job for retry");
    job = { ...job, publicUrl: outputTarget.public_url, engine: worker.id };
  } else {
    job = await createFreeVideoJob({
      userId: context.userId,
      publicUrl: outputTarget.public_url,
      quotaDebited: Boolean(context.quotaDebited),
      input,
      engine: worker.id,
    });
  }

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
          nova_callback: { url: callbackUrl, token: job.callbackToken },
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
      const error = new Error(`NOVA ${worker.id} video worker rejected the job (${response.status || 0})`);
      error.status = response.status || 0;
      error.novaJob = job;
      throw error;
    }

    return {
      processing: true,
      jobId: job.id,
      callbackToken: job.callbackToken,
      engine: worker.id,
      video: { url: outputTarget.public_url },
    };
  } catch (error) {
    error.novaJob ||= job;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function runWorkers(input, context, workers, existingJob = null) {
  const failures = [];
  let activeJob = existingJob;

  for (const worker of workers) {
    const health = await workerHealth(worker);
    if (!health.ok || !health.tasks.has(String(input.task || ""))) {
      failures.push(`${worker.id}:health`);
      continue;
    }

    try {
      return await submitWorker(worker, input, context, activeJob);
    } catch (error) {
      activeJob = error?.novaJob || activeJob;
      failures.push(`${worker.id}:${error?.message || String(error)}`);
      console.warn("[NOVA_VIDEO] private GPU worker failed; trying next provider", {
        engine: worker.id,
        task: input.task,
        message: String(error?.message || error).slice(0, 500),
      });
    }
  }

  if (activeJob?.id && !existingJob) {
    await markFreeVideoJobFailed(activeJob.id, "PRIVATE_GPU_SUBMIT_FAILED").catch(() => {});
  }

  const error = new Error(`NOVA private GPU pool unavailable for ${input.task}: ${failures.join(" | ").slice(0, 1000)}`);
  error.code = "NOVA_PRIVATE_GPU_POOL_UNAVAILABLE";
  error.novaJob = activeJob;
  throw error;
}

export async function runPrivateGpuVideoPool(input = {}, context = {}) {
  if (!context.userId) throw new Error("NOVA private GPU video job requires a user");

  const task = String(input.task || "text-to-video");
  const workers = workersForTask(task);
  if (!workers.length) {
    const error = new Error(`NOVA private GPU pool has no worker configured for ${task}`);
    error.code = "NOVA_PRIVATE_GPU_TASK_UNAVAILABLE";
    throw error;
  }

  return runWorkers(input, context, workers);
}

export async function retryPrivateGpuVideoJob({ job, callbackToken, origin }) {
  if (!job?.id || !job?.userId || !job?.input || !callbackToken) {
    const error = new Error("NOVA retry context is incomplete");
    error.code = "NOVA_PRIVATE_GPU_RETRY_UNAVAILABLE";
    throw error;
  }

  const task = String(job.input.task || "");
  const workers = workersForTask(task);
  const currentIndex = workers.findIndex((worker) => worker.id === job.engine);
  const remaining = currentIndex >= 0 ? workers.slice(currentIndex + 1) : workers;

  if (!remaining.length) {
    const error = new Error(`No private GPU fallback remains after ${job.engine || "unknown"}`);
    error.code = "NOVA_PRIVATE_GPU_RETRY_EXHAUSTED";
    throw error;
  }

  return runWorkers(
    job.input,
    { userId: job.userId, quotaDebited: false, origin },
    remaining,
    {
      id: job.id,
      callbackToken,
      publicUrl: job.publicUrl,
      engine: job.engine,
    }
  );
}
