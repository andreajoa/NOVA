function clamp64(value, min = 256, max = 1024) {
  const n = Math.max(min, Math.min(max, Number(value) || 1024));
  return Math.max(64, Math.round(n / 64) * 64);
}

export function freeImageDimensions(aspectRatio = "1:1") {
  switch (String(aspectRatio)) {
    case "16:9": return { width: 1024, height: 576 };
    case "9:16": return { width: 576, height: 1024 };
    case "4:5": return { width: 768, height: 960 };
    default: return { width: 1024, height: 1024 };
  }
}

export function buildFluxSchnellWorkflow({
  prompt,
  width = 1024,
  height = 1024,
  seed = Math.floor(Math.random() * 2147483647),
} = {}) {
  const safeWidth = clamp64(width);
  const safeHeight = clamp64(height);

  // Based on RunPod's official worker-comfyui FLUX.1 Schnell workflow.
  // Model filenames match the prebuilt FLUX Schnell worker image.
  return {
    "5": {
      inputs: { width: safeWidth, height: safeHeight, batch_size: 1 },
      class_type: "EmptyLatentImage",
      _meta: { title: "Empty Latent Image" },
    },
    "6": {
      inputs: { text: String(prompt || ""), clip: ["11", 0] },
      class_type: "CLIPTextEncode",
      _meta: { title: "CLIP Text Encode (Prompt)" },
    },
    "8": {
      inputs: { samples: ["13", 0], vae: ["10", 0] },
      class_type: "VAEDecode",
      _meta: { title: "VAE Decode" },
    },
    "9": {
      inputs: { filename_prefix: "NOVA_FREE_FLUX", images: ["8", 0] },
      class_type: "SaveImage",
      _meta: { title: "Save Image" },
    },
    "10": {
      inputs: { vae_name: "ae.safetensors" },
      class_type: "VAELoader",
      _meta: { title: "Load VAE" },
    },
    "11": {
      inputs: {
        clip_name1: "t5xxl_fp8_e4m3fn.safetensors",
        clip_name2: "clip_l.safetensors",
        type: "flux",
      },
      class_type: "DualCLIPLoader",
      _meta: { title: "DualCLIPLoader" },
    },
    "12": {
      inputs: { unet_name: "flux1-schnell.safetensors", weight_dtype: "fp8_e4m3fn" },
      class_type: "UNETLoader",
      _meta: { title: "Load Diffusion Model" },
    },
    "13": {
      inputs: {
        noise: ["25", 0],
        guider: ["22", 0],
        sampler: ["16", 0],
        sigmas: ["17", 0],
        latent_image: ["5", 0],
      },
      class_type: "SamplerCustomAdvanced",
      _meta: { title: "SamplerCustomAdvanced" },
    },
    "16": {
      inputs: { sampler_name: "euler" },
      class_type: "KSamplerSelect",
      _meta: { title: "KSamplerSelect" },
    },
    "17": {
      inputs: { scheduler: "sgm_uniform", steps: 4, denoise: 1, model: ["12", 0] },
      class_type: "BasicScheduler",
      _meta: { title: "BasicScheduler" },
    },
    "22": {
      inputs: { model: ["12", 0], conditioning: ["6", 0] },
      class_type: "BasicGuider",
      _meta: { title: "BasicGuider" },
    },
    "25": {
      inputs: { noise_seed: Number(seed) || 1 },
      class_type: "RandomNoise",
      _meta: { title: "RandomNoise" },
    },
  };
}
