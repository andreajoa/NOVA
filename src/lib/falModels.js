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
        "text-to-video":  { label: "Text to Video",  endpoint: "kling-video/v3/4k/text-to-video",   needsImage: false },
        "image-to-video": { label: "Image to Video", endpoint: "kling-video/v3/pro/image-to-video", needsImage: true  },
      }
    },
    pixverse: {
      label: "PixVerse V6",
      description: "Cinematic video generation",
      image: "/models/pixverse.png",
      modes: {
        "image-to-video": { label: "Image to Video", endpoint: "pixverse/v6/image-to-video", needsImage: true },
      }
    },
    veo: {
      label: "Veo 3.1",
      description: "Google DeepMind video model",
      image: "/models/veo.png",
      modes: {
        "text-to-video":      { label: "Text to Video",      endpoint: "veo3.1",                       needsImage: false },
        "image-to-video":     { label: "Image to Video",     endpoint: "veo3.1/image-to-video",        needsImage: true  },
        "reference-to-video": { label: "Reference to Video", endpoint: "veo3.1/reference-to-video",    needsImage: true  },
      }
    },
    happyhorse: {
      label: "Happy Horse",
      description: "Alibaba creative video AI",
      image: "/models/happyhorse.png",
      modes: {
        "text-to-video":      { label: "Text to Video",      endpoint: "alibaba/happy-horse/text-to-video",      needsImage: false },
        "image-to-video":     { label: "Image to Video",     endpoint: "alibaba/happy-horse/image-to-video",     needsImage: true  },
        "reference-to-video": { label: "Reference to Video", endpoint: "alibaba/happy-horse/reference-to-video", needsImage: true  },
      }
    },
    ltx: {
      label: "LTX Video 2.3",
      description: "Lightning-fast video generation",
      image: "/models/ltx.png",
      modes: {
        "video-to-video":           { label: "Video to Video",   endpoint: "ltx-video/v2.3/video-to-video", needsImage: true },
        "reference-video-to-video": { label: "Reference Video",  endpoint: "ltx-video/v2.3/reference",      needsImage: true },
      }
    },
    wan: {
      label: "Wan 2.2",
      description: "Open-source video powerhouse",
      image: "/models/wan.png",
      modes: {
        "image-to-video": { label: "Image to Video", endpoint: "wan/v2.2/image-to-video", needsImage: true },
      }
    },
    lyra: {
      label: "Lyra 2",
      description: "High-fidelity motion synthesis",
      image: "/models/lyra.png",
      modes: {
        "image-to-video": { label: "Image to Video", endpoint: "lyra/v2/image-to-video", needsImage: true },
      }
    },
    lucy: {
      label: "Lucy (Decart)",
      description: "Real-time world simulation",
      image: "/models/lucy.png",
      modes: {
        "image-to-video": { label: "Image to Video", endpoint: "decart/lucy/image-to-video", needsImage: true },
      }
    },
    "kling-avatar": {
      label: "Kling Avatar",
      description: "AI avatar and lipsync generation",
      image: "/models/kling-avatar.png",
      modes: {
        "avatar-generation": { label: "Avatar Generation", endpoint: "kling-video/v1/avatar",   needsImage: true },
        "lipsync":           { label: "Lipsync",           endpoint: "kling-video/v1/lipsync",  needsImage: true },
      }
    },
  }
};
