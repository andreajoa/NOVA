export const falModels = {
  video: {
    seedance: {
      label: "Seedance 2.0",
      description: "ByteDance flagship video model",
      image: "/models/seedance.png",
      modes: {
        "text-to-video":       { label: "Text to Video",       endpoint: "bytedance/seedance-2.0/text-to-video",       needsImage: false },
        "image-to-video":      { label: "Image to Video",      endpoint: "bytedance/seedance-2.0/image-to-video",      needsImage: true  },
        "reference-to-video":  { label: "Reference to Video",  endpoint: "bytedance/seedance-2.0/reference-to-video",  needsImage: true  },
      }
    },
    kling: {
      label: "Kling 3.0",
      description: "Kuaishou pro-grade video model",
      image: "/models/kling.png",
      modes: {
        "text-to-video":  { label: "Text to Video",  endpoint: "fal-ai/kling-video/v2.1/master/text-to-video",  needsImage: false },
        "image-to-video": { label: "Image to Video", endpoint: "fal-ai/kling-video/v2.1/standard/image-to-video", needsImage: true  },
      }
    },
    pixverse: {
      label: "PixVerse V6",
      description: "Cinematic video generation",
      image: "/models/pixverse.png",
      modes: {
        "image-to-video": { label: "Image to Video", endpoint: "fal-ai/pixverse/v4/image-to-video", needsImage: true },
      }
    },
    veo: {
      label: "Veo 3.1",
      description: "Google DeepMind video model",
      image: "/models/veo.png",
      modes: {
        "text-to-video":      { label: "Text to Video",      endpoint: "fal-ai/veo3.1", needsImage: false },
        "image-to-video":     { label: "Image to Video",     endpoint: "fal-ai/veo3.1/image-to-video", needsImage: true  },
        "reference-to-video": { label: "Reference to Video", endpoint: "fal-ai/veo3.1/reference-to-video", needsImage: true  },
      }
    },
    happyhorse: {
      label: "Happy Horse",
      description: "Alibaba creative video AI",
      image: "/models/happyhorse.png",
      modes: {
        "text-to-video":      { label: "Text to Video",      endpoint: "alibaba/happy-horse/text-to-video",  needsImage: false },
        "image-to-video":     { label: "Image to Video",     endpoint: "alibaba/happy-horse/image-to-video", needsImage: true  },
        "reference-to-video": { label: "Reference to Video", endpoint: "fal-ai/wan/v2.2-a14b/image-to-video", needsImage: true  },
      }
    },
    // LTX temporarily disabled: previous endpoints were not verified in fal.ai docs.
    // ltx: {
    //   label: "LTX Video 2.3",
    //   description: "Lightning-fast video generation",
    //   image: "/models/ltx.png",
    //   modes: {}
    // },
    wan: {
      label: "Wan 2.2",
      description: "Open-source video powerhouse",
      image: "/models/wan.png",
      modes: {
        "text-to-video":  { label: "Text to Video",  endpoint: "fal-ai/wan/v2.2-a14b/text-to-video",  needsImage: false },
        "image-to-video": { label: "Image to Video", endpoint: "fal-ai/wan/v2.2-a14b/image-to-video", needsImage: true  },
      }
    },
    lyra: {
      label: "Hunyuan Video",
      description: "High-fidelity motion synthesis",
      image: "/models/lyra.png",
      modes: {
        "text-to-video": { label: "Text to Video", endpoint: "fal-ai/hunyuan-video", needsImage: false },
      }
    },
    lucy: {
      label: "Lucy (Decart)",
      description: "Real-time world simulation",
      image: "/models/lucy.png",
      modes: {
        "image-to-video": { label: "Image to Video", endpoint: "fal-ai/minimax-video/image-to-video", needsImage: true },
      }
    },
    "kling-avatar": {
      label: "Kling Avatar",
      description: "AI avatar and lipsync generation",
      image: "/models/kling-avatar.png",
      modes: {
        "avatar-generation": { label: "Avatar Generation", endpoint: "fal-ai/kling-video/v1.6/standard/image-to-video", needsImage: true },
        "lipsync":           { label: "Lipsync",           endpoint: "fal-ai/lipsync",                                  needsImage: true },
      }
    },
  },

  image: {
    "flux-schnell": {
      label: "FLUX Schnell",
      description: "Fastest FLUX — great for rapid iteration",
      image: "/models/flux-schnell.png",
      costPerGen: 0.003,
      unlimited: true,
      modes: {
        "text-to-image": { label: "Text to Image", endpoint: "fal-ai/flux/schnell", needsImage: false },
      },
    },
    "flux-dev": {
      label: "FLUX Dev",
      description: "High-quality open-source image generation",
      image: "/models/flux-dev.png",
      costPerGen: 0.025,
      unlimited: true,
      modes: {
        "text-to-image":  { label: "Text to Image",  endpoint: "fal-ai/flux/dev",                 needsImage: false },
        "image-to-image": { label: "Image to Image", endpoint: "fal-ai/flux/dev/image-to-image",  needsImage: true  },
      },
    },
    "flux-pro": {
      label: "FLUX Pro 1.1",
      description: "Professional-grade image quality",
      image: "/models/flux-pro.png",
      costPerGen: 0.04,
      unlimited: true,
      modes: {
        "text-to-image":  { label: "Text to Image",  endpoint: "fal-ai/flux-pro/v1.1",        needsImage: false },
        "image-to-image": { label: "Image to Image", endpoint: "fal-ai/flux-pro/v1.1/redux",  needsImage: true  },
      },
    },
    "flux-ultra": {
      label: "FLUX Ultra",
      description: "Highest resolution — up to 4MP",
      image: "/models/flux-ultra.png",
      costPerGen: 0.06,
      unlimited: true,
      modes: {
        "text-to-image": { label: "Text to Image", endpoint: "fal-ai/flux-pro/v1.1-ultra", needsImage: false },
      },
    },
    "gpt-image": {
      label: "GPT Image 2",
      description: "OpenAI latest image generation model",
      image: "/models/gpt-image.png",
      costPerGen: 0.02,
      unlimited: true,
      modes: {
        "text-to-image":  { label: "Text to Image",  endpoint: "openai/gpt-image-2",       needsImage: false },
        "image-editing":  { label: "Image Editing",  endpoint: "openai/gpt-image-2/edit",  needsImage: true  },
      },
    },
    "recraft-v3": {
      label: "Recraft V3",
      description: "Best for design, illustration and branding",
      image: "/models/recraft.png",
      costPerGen: 0.04,
      unlimited: true,
      modes: {
        "text-to-image":  { label: "Text to Image",   endpoint: "fal-ai/recraft-v3",               needsImage: false },
        "image-to-image": { label: "Style Transfer",  endpoint: "fal-ai/recraft-v3/create-style",  needsImage: true  },
      },
    },
    "ideogram-v3": {
      label: "Ideogram V3",
      description: "Best text rendering in AI images",
      image: "/models/ideogram.png",
      costPerGen: 0.08,
      unlimited: true,
      modes: {
        "text-to-image":  { label: "Text to Image",  endpoint: "fal-ai/ideogram/v3",       needsImage: false },
        "image-editing":  { label: "Image Editing",  endpoint: "fal-ai/ideogram/v3/edit",  needsImage: true  },
      },
    },
    "stable-diffusion-35": {
      label: "Stable Diffusion 3.5",
      description: "Open-source powerhouse with great control",
      image: "/models/sd35.png",
      costPerGen: 0.035,
      unlimited: true,
      modes: {
        "text-to-image":  { label: "Text to Image",  endpoint: "fal-ai/stable-diffusion-v35-large",                needsImage: false },
        "image-to-image": { label: "Image to Image", endpoint: "fal-ai/stable-diffusion-v35-large/image-to-image", needsImage: true  },
      },
    },
    "aura-flow": {
      label: "AuraFlow",
      description: "Fast and expressive open-source model",
      image: "/models/auraflow.png",
      costPerGen: 0.01,
      unlimited: true,
      modes: {
        "text-to-image": { label: "Text to Image", endpoint: "fal-ai/aura-flow", needsImage: false },
      },
    },
    "nano-banana": {
      label: "Nano Banana 2",
      description: "Ultra-fast creative image generation",
      image: "/models/nano-banana.png",
      costPerGen: 0.012,
      unlimited: true,
      modes: {
        "text-to-image": { label: "Text to Image", endpoint: "fal-ai/nano-banana-2", needsImage: false },
      },
    },
    "hidream-i1": {
      label: "HiDream I1",
      description: "High-resolution photorealistic images",
      image: "/models/hidream.png",
      costPerGen: 0.05,
      unlimited: true,
      modes: {
        "text-to-image": { label: "Text to Image", endpoint: "fal-ai/hidream-i1-full", needsImage: false },
        "fast":          { label: "Fast",           endpoint: "fal-ai/hidream-i1-fast", needsImage: false },
      },
    },
    "sana": {
      label: "Sana",
      description: "NVIDIA efficient high-res generation",
      image: "/models/sana.png",
      costPerGen: 0.005,
      unlimited: true,
      modes: {
        "text-to-image": { label: "Text to Image", endpoint: "fal-ai/sana", needsImage: false },
      },
    },
    "kolors": {
      label: "Kolors",
      description: "Kuaishou vivid color-focused model",
      image: "/models/kolors.png",
      costPerGen: 0.008,
      unlimited: true,
      modes: {
        "text-to-image":  { label: "Text to Image",  endpoint: "fal-ai/kolors",                  needsImage: false },
      },
    },
  },
};

export const PLAN_CONFIG = {
  trial:    { credits: 10,     imageUnlimited: false, imageMonthlyLimit: 10   },
  basic:    { credits: 70,     imageUnlimited: false, imageMonthlyLimit: null },
  plus:     { credits: 500,    imageUnlimited: false, imageMonthlyLimit: null },
  ultra:    { credits: 3000,   imageUnlimited: true,  imageMonthlyLimit: null },
  business: { credits: 3000,   imageUnlimited: true,  imageMonthlyLimit: null },
  admin:    { credits: 999999, imageUnlimited: true,  imageMonthlyLimit: null },
};
