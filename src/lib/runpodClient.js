const RUNPOD_API_BASE = "https://api.runpod.ai/v2";

const FAL_TO_RUNPOD = {
  "fal-ai/flux/schnell": { envVar: "RUNPOD_ENDPOINT_FLUX_SCHNELL", type: "image", sync: true },
  "fal-ai/flux/dev": { envVar: "RUNPOD_ENDPOINT_FLUX_DEV", type: "image", sync: true },
  "fal-ai/flux/dev/image-to-image": { envVar: "RUNPOD_ENDPOINT_FLUX_DEV", type: "image", sync: true },
  "fal-ai/wan/v2.2-a14b/text-to-video": { envVar: "RUNPOD_ENDPOINT_WAN", type: "video", sync: false },
  "fal-ai/wan/v2.2-a14b/image-to-video": { envVar: "RUNPOD_ENDPOINT_WAN", type: "video", sync: false },
  "fal-ai/hunyuan-video": { envVar: "RUNPOD_ENDPOINT_HUNYUAN", type: "video", sync: false },
};

function getConfig(falEndpoint) { return FAL_TO_RUNPOD[falEndpoint] || null; }
function getEndpointId(falEndpoint) {
  const config = getConfig(falEndpoint);
  if (!config) return null;
  return process.env[config.envVar] || null;
}

export function shouldUseRunPod(falEndpoint) { return !!getEndpointId(falEndpoint); }

function transformInput(falEndpoint, falInput) {
  const config = getConfig(falEndpoint);
  if (config?.type === "image") {
    return {
      prompt: falInput.prompt,
      negative_prompt: falInput.negative_prompt,
      width: falInput.image_size?.width || falInput.width || 1024,
      height: falInput.image_size?.height || falInput.height || 1024,
      num_outputs: falInput.num_images || falInput.num_outputs || 1,
      num_inference_steps: falInput.num_inference_steps,
      guidance_scale: falInput.guidance_scale,
      seed: falInput.seed,
      image_url: falInput.image_url,
      strength: falInput.strength,
    };
  }
  if (config?.type === "video") {
    return {
      prompt: falInput.prompt,
      negative_prompt: falInput.negative_prompt,
      image_url: falInput.image_url,
      duration: falInput.duration,
      resolution: falInput.resolution,
      aspect_ratio: falInput.aspect_ratio,
      num_frames: falInput.num_frames,
      fps: falInput.fps,
      seed: falInput.seed,
    };
  }
  return falInput;
}

function normalizeOutput(falEndpoint, out) {
  const config = getConfig(falEndpoint);
  if (config?.type === "image") {
    if (Array.isArray(out) && typeof out[0] === "string") return { images: out.map(url => ({ url, content_type: "image/png" })) };
    if (Array.isArray(out?.images)) return { images: out.images.map(img => ({ url: img?.url || img, content_type: "image/png" })) };
    if (out?.image_url) return { images: [{ url: out.image_url, content_type: "image/png" }] };
    if (out?.image) return { images: [{ url: out.image, content_type: "image/png" }] };
    if (typeof out === "string" && out.startsWith("data:")) return { images: [{ url: out, content_type: "image/png" }] };
  }
  if (config?.type === "video") {
    if (out?.video_url) return { video: { url: out.video_url } };
    if (out?.video?.url) return { video: out.video };
    if (Array.isArray(out) && typeof out[0] === "string") return { video: { url: out[0] } };
    if (out?.video_base64) return { video: { url: "data:video/mp4;base64," + out.video_base64 } };
  }
  return out;
}

async function pollForResult(endpointId, jobId, maxWaitMs = 600000) {
  const apiKey = process.env.RUNPOD_API_KEY;
  const statusUrl = RUNPOD_API_BASE + "/" + endpointId + "/status/" + jobId;
  const startTime = Date.now();
  let pollInterval = 4000;
  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(r => setTimeout(r, pollInterval));
    const res = await fetch(statusUrl, { headers: { Authorization: "Bearer " + apiKey } });
    if (!res.ok) throw new Error("RunPod status check failed: " + res.status);
    const data = await res.json();
    if (data.status === "COMPLETED") return data.output;
    if (data.status === "FAILED") throw new Error("RunPod job failed: " + JSON.stringify(data.error || data));
    pollInterval = Math.min(pollInterval + 1000, 10000);
  }
  throw new Error("RunPod job timeout apos 10 minutos");
}

export async function runOnRunPod(falEndpoint, falInput) {
  const endpointId = getEndpointId(falEndpoint);
  if (!endpointId) throw new Error("RunPod: nenhum endpoint configurado para " + falEndpoint);
  const apiKey = process.env.RUNPOD_API_KEY;
  if (!apiKey) throw new Error("RUNPOD_API_KEY nao definida");
  const config = getConfig(falEndpoint);
  const body = JSON.stringify({ input: transformInput(falEndpoint, falInput) });
  const headers = { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" };
  if (config.sync) {
    const res = await fetch(RUNPOD_API_BASE + "/" + endpointId + "/runsync", { method: "POST", headers, body });
    if (!res.ok) throw new Error("RunPod sync falhou (" + res.status + "): " + await res.text());
    const data = await res.json();
    if (data.status === "FAILED") throw new Error("RunPod job falhou: " + JSON.stringify(data.error || data));
    return normalizeOutput(falEndpoint, data.output);
  } else {
    const res = await fetch(RUNPOD_API_BASE + "/" + endpointId + "/run", { method: "POST", headers, body });
    if (!res.ok) throw new Error("RunPod async falhou (" + res.status + "): " + await res.text());
    const { id: jobId } = await res.json();
    if (!jobId) throw new Error("RunPod nao retornou job ID");
    return normalizeOutput(falEndpoint, await pollForResult(endpointId, jobId));
  }
}
