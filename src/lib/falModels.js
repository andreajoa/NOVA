export const falModels = {
  video: {
    seedance: {
      label: "Seedance 2.0",
      description: "ByteDance flagship video model",
      image: "/models/seedance.png",
      modes: {
        "text-to-video":       { label: "Text to Video",       endpoint: "fal-ai/bytedance/seedance-2-0/text-to-video",       needsImage: false },
        "image-to-video":      { label: "Image to Video",      endpoint: "fal-ai/bytedance/seedance-2-0/image-to-video",      needsImage: true  },
        "reference-to-video":  { label: "Reference to Video",  endpoint: "fal-ai/bytedance/seedance-2-0/reference-to-video",  needsImage: true  },
      }
    },
    kling: {
      label: "Kling 3.0",
      description: "Kuaishou pro-grade video model",
      image: "/models/kling.png",
      modes: {
        "text-to-video":  { label: "Text to Video",  endpoint: "fal-ai/kling-video/v2.1/standard/text-to-video",   needsImage: false },
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
        "text-to-video":      { label: "Text to Video",      endpoint: "fal-ai/veo3",                       needsImage: false },
        "image-to-video":     { label: "Image to Video",     endpoint: "fal-ai/veo3",        needsImage: true  },
        "reference-to-video": { label: "Reference to Video", endpoint: "fal-ai/veo3",    needsImage: true  },
      }
    },
    happyhorse: {
      label: "Happy Horse",
      description: "Alibaba creative video AI",
      image: "/models/happyhorse.png",
      modes: {
        "text-to-video":      { label: "Text to Video",      endpoint: "fal-ai/wan-pro/text-to-video",      needsImage: false },
        "image-to-video":     { label: "Image to Video",     endpoint: "fal-ai/wan-pro/image-to-video",     needsImage: true  },
        "reference-to-video": { label: "Reference to Video", endpoint: "fal-ai/wan-pro/image-to-video", needsImage: true  },
      }
    },
    ltx: {
      label: "LTX Video 2.3",
      description: "Lightning-fast video generation",
      image: "/models/ltx.png",
      modes: {
        "video-to-video":           { label: "Video to Video",   endpoint: "fal-ai/ltx-video/video-to-video", needsImage: true },
        "reference-video-to-video": { label: "Reference Video",  endpoint: "fal-ai/ltx-video",      needsImage: true },
      }
    },
    wan: {
      label: "Wan 2.2",
      description: "Open-source video powerhouse",
      image: "/models/wan.png",
      modes: {
        "image-to-video": { label: "Image to Video", endpoint: "fal-ai/wan-pro/image-to-video", needsImage: true },
      }
    },
    lyra: {
      label: "Lyra 2",
      description: "High-fidelity motion synthesis",
      image: "/models/lyra.png",
      modes: {
        "image-to-video": { label: "Image to Video", endpoint: "fal-ai/hunyuan-video", needsImage: true },
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
        "avatar-generation": { label: "Avatar Generation", endpoint: "fal-ai/kling-video/v1.6/standard/image-to-video",   needsImage: true },
        "lipsync":           { label: "Lipsync",           endpoint: "fal-ai/lipsync",  needsImage: true },
      }
    },
  }
};
