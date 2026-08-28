// Server-side NOVA aliases. Underlying model identifiers are deployment secrets/env vars.
// Do not import this file from client components.

export const privateOpenModels = {
  image: {
    "nova-image-free": {
      label: "NOVA IMAGEM FREE",
      description: "Geração de imagem incluída no NOVA.",
      tier: "free",
      freeQuotaKind: "image",
      engine: "nova-native-image",
      zeroCostOnly: true,
      modes: {
        "text-to-image": {
          label: "Text to Image",
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
      engine: "nova-zero-cost-video",
      zeroCostOnly: true,
      modes: {
        "text-to-video": {
          label: "Text to Video",
          needsImage: false,
        },
        "image-to-video": {
          label: "Image to Video",
          needsImage: true,
        },
      },
    },
  },
};
