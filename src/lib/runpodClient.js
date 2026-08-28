import { buildFluxSchnellWorkflow, freeImageDimensions } from "@/lib/openModelWorkflows";

const RUNPOD_API_BASE = "https://api.runpod.ai/v2";

const TARGETS = {
  "flux-schnell": {
    envVar: "RUNPOD_ENDPOINT_FLUX_SCHNELL",
    type: "image",
    sync: true,
    inputKind: "comfy-flux-schnell",
  },
  "flux-schnell-free": {
    envVar: "RUNPOD_ENDPOINT_FLUX_SCHNELL",
    type: "image",
    sync: true,
    inputKind: "comfy-flux-schnell",
  },
  "fal-ai/flux/schnell": {
    envVar: "RUNPOD_ENDPOINT_FLUX_SCHNELL",
    type: "image",
    sync: true,
    inputKind: "comfy-flux-schnell",
  },
  "fal-ai/flux/dev": {
    envVar: "RUNPOD_ENDPOINT_FLUX_DEV",
    type: "image",
    sync: true,
    inputKind: "generic-image",
  },
  "fal-ai/flux/dev/image-to-image": {
    envVar: "RUNPOD_ENDPOINT_FLUX_DEV",
    type: "image",
    sync: true,
    inputKind: "generic-image",
  },
  "z-image-turbo": {
    envVar: "RUNPOD_ENDPOINT_Z_IMAGE",
    type: "image",
    sync: true,
    inputKind: "generic-image",
  },
  "wan21-free": {
    envVar: "RUNPOD_ENDPOINT_WAN21",
    type: "video",
    sync: false,
    inputKind: "generic-video",
  },
  "fal-ai/wan/v2.2-a14b/text-to-video": {
    envVar: "RUNPOD_ENDPOINT_WAN",
    type: "video",
    sync: false,
    inputKind: "generic-video",
  },
  "fal-ai/wan/v2.2-a14b/image-to-video": {
    envVar: "RUNPOD_ENDPOINT_WAN",
    type: "video",
    sync: false,
    inputKind: "generic-video",
  },
  "fal-ai/hunyuan-video": {
    envVar: "RUNPOD_ENDPOINT_HUNYUAN",
    type: "video",
    sync: false,
    inputKind: "generic-video",
  },
};

function getConfig(target) {
  return TARGETS[target] || null;
}

function getEndpointId(target) {
  const config = getConfig(target);
  if (!config || !process.env.RUNPOD_API_KEY) return null;
  return process.env[config.envVar] || null;
}

export function shouldUseRunPod(target) {
  return Boolean(getEndpointId(target));
}

function dimensionsFromInput(input = {}) {
  if (input?.image_size && typeof input.image_size === "object") {
    return {
      width: Number(input.image_size.width) || 1024,
      height: Number(input.image_size.height) || 1024,
    };
  }
  if (input.width || input.height) {
    return {
      width: Number(input.width) || 1024,
      height: Number(input.height) || 1024,
    };
  }
  return freeImageDimensions(input.aspect_ratio || "1:1");
}

function transformInput(target, input = {}) {
  const config = getConfig(target);

  if (config?.inputKind === "comfy-flux-schnell") {
    const { width, height } = dimensionsFromInput(input);
    return {
      workflow: buildFluxSchnellWorkflow({
        prompt: input.prompt,
        width,
        height,
        seed: input.seed,
      }),
    };
  }

  if (config?.inputKind === "generic-image") {
    const { width, height } = dimensionsFromInput(input);
    return {
      model: target,
      task: input.image_url ? "image-to-image" : "text-to-image",
      prompt: input.prompt,
      negative_prompt: input.negative_prompt,
      width,
      height,
      num_outputs: Math.max(1, Math.min(1, Number(input.num_images || input.num_outputs || 1))),
      num_inference_steps: input.num_inference_steps,
      guidance_scale: input.guidance_scale,
      seed: input.seed,
      image_url: input.image_url,
      strength: input.strength,
    };
  }

  if (config?.inputKind === "generic-video") {
    return {
      model: target,
      task: input.image_url ? "image-to-video" : "text-to-video",
      prompt: input.prompt,
      negative_prompt: input.negative_prompt,
      image_url: input.image_url,
      duration: input.duration,
      resolution: input.resolution,
      aspect_ratio: input.aspect_ratio,
      num_frames: input.num_frames,
      frames_per_second: input.frames_per_second || input.fps,
      num_inference_steps: input.num_inference_steps,
      turbo_mode: input.turbo_mode,
      seed: input.seed,
    };
  }

  return input;
}

function imageUrlFromRunPodImage(image) {
  if (!image) return null;
  if (typeof image === "string") {
    if (image.startsWith("data:")) return image;
    if (/^https?:\/\//i.test(image)) return image;
    return `data:image/png;base64,${image}`;
  }
  if (image.url) return image.url;
  if (image.s3_url) return image.s3_url;
  if (image.type === "s3_url" && image.data) return image.data;
  if (image.type === "base64" && image.data) {
    const mime = image.content_type || image.mime_type || "image/png";
    return `data:${mime};base64,${image.data}`;
  }
  if (image.data && /^https?:\/\//i.test(String(image.data))) return image.data;
  return null;
}

function normalizeOutput(target, output) {
  const config = getConfig(target);
  const out = output?.output ?? output;

  if (config?.type === "image") {
    const sourceImages = Array.isArray(out?.images)
      ? out.images
      : Array.isArray(out)
        ? out
        : [];
    const urls = sourceImages.map(imageUrlFromRunPodImage).filter(Boolean);
    if (urls.length) {
      return { images: urls.map((url) => ({ url, content_type: "image/png" })) };
    }
    const single = imageUrlFromRunPodImage(out?.image_url || out?.image);
    if (single) return { images: [{ url: single, content_type: "image/png" }] };
  }

  if (config?.type === "video") {
    if (out?.video_url) return { video: { url: out.video_url } };
    if (out?.video?.url) return { video: out.video };
    if (out?.url && /\.(mp4|webm|mov)(\?|#|$)/i.test(out.url)) return { video: { url: out.url } };
    if (Array.isArray(out) && typeof out[0] === "string") return { video: { url: out[0] } };
    if (out?.video_base64) return { video: { url: `data:video/mp4;base64,${out.video_base64}` } };
  }

  return out;
}

async function pollForResult(endpointId, jobId, maxWaitMs = 600000) {
  const apiKey = process.env.RUNPOD_API_KEY;
  const statusUrl = `${RUNPOD_API_BASE}/${endpointId}/status/${jobId}`;
  const startTime = Date.now();
  let pollInterval = 3000;

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    const res = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`RunPod status check failed: ${res.status}`);
    const data = await res.json();
    if (data.status === "COMPLETED") return data.output;
    if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(data.status)) {
      throw new Error(`RunPod job ${data.status}: ${JSON.stringify(data.error || data)}`);
    }
    pollInterval = Math.min(pollInterval + 1000, 8000);
  }

  throw new Error("RunPod job timeout after 10 minutes");
}

export async function runOnRunPod(target, input) {
  const endpointId = getEndpointId(target);
  if (!endpointId) throw new Error(`RunPod endpoint is not configured for ${target}`);

  const config = getConfig(target);
  const apiKey = process.env.RUNPOD_API_KEY;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const body = JSON.stringify({ input: transformInput(target, input) });

  if (config.sync) {
    const res = await fetch(`${RUNPOD_API_BASE}/${endpointId}/runsync`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`RunPod sync failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(data.status)) {
      throw new Error(`RunPod job ${data.status}: ${JSON.stringify(data.error || data)}`);
    }
    if (data.status && data.status !== "COMPLETED" && data.id) {
      return normalizeOutput(target, await pollForResult(endpointId, data.id));
    }
    return normalizeOutput(target, data.output);
  }

  const res = await fetch(`${RUNPOD_API_BASE}/${endpointId}/run`, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`RunPod async failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const jobId = data.id;
  if (!jobId) throw new Error("RunPod did not return a job ID");
  return normalizeOutput(target, await pollForResult(endpointId, jobId));
}
