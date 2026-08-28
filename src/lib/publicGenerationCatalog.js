// Client-safe catalog. Never place provider endpoint names or private model identifiers here.

export const publicGenerationModels = {
  image: {
    "nova-image-free": {
      label: "NOVA IMAGEM FREE",
      description: "Crie imagens com IA sem gastar créditos.",
      tier: "free",
      badge: "FREE",
      image: "/nova/models-v2/card-car.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
      },
    },
    "flux-dev": {
      label: "FLUX Dev",
      description: "High-quality image generation",
      image: "/models/flux-dev.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
        "image-to-image": { label: "Image to Image", needsImage: true },
      },
    },
    "flux-pro": {
      label: "FLUX Pro 1.1",
      description: "Professional-grade image quality",
      image: "/models/flux-pro.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
        "image-to-image": { label: "Image to Image", needsImage: true },
      },
    },
    "flux-ultra": {
      label: "FLUX Ultra",
      description: "Highest resolution — up to 4MP",
      image: "/models/flux-ultra.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
      },
    },
    "gpt-image": {
      label: "GPT Image 2",
      description: "OpenAI image generation and editing",
      image: "/models/gpt-image.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
        "image-editing": { label: "Image Editing", needsImage: true },
      },
    },
    "recraft-v3": {
      label: "Recraft V3",
      description: "Design, illustration and branding",
      image: "/models/recraft.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
        "image-to-image": { label: "Style Transfer", needsImage: true },
      },
    },
    "ideogram-v3": {
      label: "Ideogram V3",
      description: "Strong text rendering in AI images",
      image: "/models/ideogram.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
        "image-editing": { label: "Image Editing", needsImage: true },
      },
    },
    "stable-diffusion-35": {
      label: "Stable Diffusion 3.5",
      description: "Flexible image generation with strong control",
      image: "/models/sd35.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
        "image-to-image": { label: "Image to Image", needsImage: true },
      },
    },
    "aura-flow": {
      label: "AuraFlow",
      description: "Fast and expressive image generation",
      image: "/models/auraflow.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
      },
    },
    "nano-banana": {
      label: "Nano Banana 2",
      description: "Fast creative image generation",
      image: "/models/nano-banana.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
      },
    },
    "hidream-i1": {
      label: "HiDream I1",
      description: "High-resolution photorealistic images",
      image: "/models/hidream.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
        fast: { label: "Fast", needsImage: false },
      },
    },
    sana: {
      label: "Sana",
      description: "Efficient high-resolution generation",
      image: "/models/sana.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
      },
    },
    kolors: {
      label: "Kolors",
      description: "Vivid color-focused image generation",
      image: "/models/kolors.png",
      modes: {
        "text-to-image": { label: "Text to Image", needsImage: false },
      },
    },
  },
  video: {
    "nova-video-free": {
      label: "NOVA VIDEO FREE",
      description: "Gere vídeo sem gastar créditos. Text to Video ou Image to Video.",
      tier: "free",
      badge: "FREE",
      image: "/nova/models-v2/card-motorbike.png",
      modes: {
        "text-to-video": { label: "Text to Video", needsImage: false },
        "image-to-video": { label: "Image to Video", needsImage: true },
      },
    },
    seedance: {
      label: "Seedance 2.0",
      description: "Flagship video generation",
      image: "/models/seedance.png",
      modes: {
        "text-to-video": { label: "Text to Video", needsImage: false },
        "image-to-video": { label: "Image to Video", needsImage: true },
        "reference-to-video": { label: "Reference to Video", needsImage: true },
      },
    },
    kling: {
      label: "Kling 3.0",
      description: "Pro-grade video generation",
      image: "/models/kling.png",
      modes: {
        "text-to-video": { label: "Text to Video", needsImage: false },
        "image-to-video": { label: "Image to Video", needsImage: true },
      },
    },
    pixverse: {
      label: "PixVerse V6",
      description: "Cinematic video generation",
      image: "/models/pixverse.png",
      modes: {
        "image-to-video": { label: "Image to Video", needsImage: true },
      },
    },
    veo: {
      label: "Veo 3.1",
      description: "High-end video generation",
      image: "/models/veo.png",
      modes: {
        "text-to-video": { label: "Text to Video", needsImage: false },
        "image-to-video": { label: "Image to Video", needsImage: true },
        "reference-to-video": { label: "Reference to Video", needsImage: true },
      },
    },
    happyhorse: {
      label: "Happy Horse",
      description: "Creative video generation",
      image: "/models/happyhorse.png",
      modes: {
        "text-to-video": { label: "Text to Video", needsImage: false },
        "image-to-video": { label: "Image to Video", needsImage: true },
        "reference-to-video": { label: "Reference to Video", needsImage: true },
      },
    },
    wan: {
      label: "Wan 2.2",
      description: "High-quality video generation",
      image: "/models/wan.png",
      modes: {
        "text-to-video": { label: "Text to Video", needsImage: false },
        "image-to-video": { label: "Image to Video", needsImage: true },
      },
    },
    lyra: {
      label: "Hunyuan Video",
      description: "High-fidelity motion synthesis",
      image: "/models/lyra.png",
      modes: {
        "text-to-video": { label: "Text to Video", needsImage: false },
      },
    },
    lucy: {
      label: "Lucy",
      description: "Real-time world simulation",
      image: "/models/lucy.png",
      modes: {
        "image-to-video": { label: "Image to Video", needsImage: true },
      },
    },
    "kling-avatar": {
      label: "Kling Avatar",
      description: "AI avatar and lipsync generation",
      image: "/models/kling-avatar.png",
      modes: {
        "avatar-generation": { label: "Avatar Generation", needsImage: true },
        lipsync: { label: "Lipsync", needsImage: true },
      },
    },
  },
};
