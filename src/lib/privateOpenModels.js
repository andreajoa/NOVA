// Server-side only model aliases for NOVA-branded generation.
// Do not import this file from client components. Real provider/model names stay here.

export const privateOpenModels = {
  image: {
    "nova-image-free": {
      label: "NOVA IMAGEM FREE",
      description: "Geração de imagem incluída no NOVA.",
      tier: "free",
      freeQuotaKind: "image",
      providerPreference: "cloudflare-workers-ai",
      cloudflareModel: "@cf/black-forest-labs/flux-1-schnell",
      zeroCostOnly: true,
      modes: {
        "text-to-image": {
          label: "Text to Image",
          endpoint: "fal-ai/flux/schnell",
          needsImage: false,
        },
      },
    },
  },
  video: {
    "nova-video-free": {
      label: "NOVA VIDEO FREE",
      description: "Geração de vídeo incluída no NOVA.",
      tier: "free",
      freeQuotaKind: "video",
      providerPreference: "nova-zero-cost-video",
      zeroCostOnly: true,
      // Provider/model identity remains server-side. The worker URL itself is configured only by environment.
      modes: {
        "text-to-video": {
          label: "Text to Video",
          endpoint: "fal-ai/wan-t2v",
          needsImage: false,
        },
        "image-to-video": {
          label: "Image to Video",
          endpoint: "fal-ai/wan-i2v",
          needsImage: true,
        },
      },
    },
  },
};

export const HIDDEN_OPEN_MODEL_KEYS = new Set([
  "flux-schnell",
  "z-image-turbo",
  "wan21-free",
]);
