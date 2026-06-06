export const NOVA_CREDIT_USD_VALUE = 0.01;

// IMPORTANT:
// Credits are intentionally priced above estimated fal.ai cost.
// This protects NOVA margin and prevents loss-making generations.
export const MEDIA_MODELS = {
  "wan-2-2-text": {
    label: "Wan 2.2 Text to Video",
    modelKey: "wan",
    modeKey: "text-to-video",
    endpoint: "fal-ai/wan/v2.2-a14b/text-to-video",
    type: "video",
    supportsAudio: false,
    supportsImageInput: false,
    supportsCharacterConsistency: false,
    supportsExtension: true,
    maxSeconds: 5,
    estimatedFalCostUsd: 0.2,
    novaCredits: 35,
    note: "Silent video. Best for affordable text-to-video generation.",
  },

  "wan-2-2-image": {
    label: "Wan 2.2 Image to Video",
    modelKey: "wan",
    modeKey: "image-to-video",
    endpoint: "fal-ai/wan/v2.2-a14b/image-to-video",
    type: "video",
    supportsAudio: false,
    supportsImageInput: true,
    supportsCharacterConsistency: "medium",
    supportsExtension: true,
    maxSeconds: 5,
    estimatedFalCostUsd: 0.2,
    novaCredits: 35,
    note: "Silent image animation. Better identity retention than text-to-video, but not perfect.",
  },

  "wan-2-2-speech": {
    label: "Wan 2.2 Speech to Video",
    endpoint: "fal-ai/wan/v2.2-14b/speech-to-video",
    type: "talking-avatar",
    supportsAudio: true,
    requiresImage: true,
    requiresAudio: true,
    supportsCharacterConsistency: "high",
    supportsExtension: false,
    maxSeconds: 60,
    estimatedFalCostUsd: 0.7,
    novaCredits: 120,
    note: "Photo + audio to talking video. Use for avatars, spokespeople and lip-sync workflows.",
  },

  "sync-lipsync-v2": {
    label: "Sync Lipsync v2",
    endpoint: "fal-ai/sync-lipsync/v2",
    type: "talking-avatar",
    supportsAudio: true,
    requiresVideo: true,
    requiresAudio: true,
    supportsCharacterConsistency: "high",
    supportsExtension: false,
    maxSeconds: 60,
    estimatedFalCostUsd: 0.15,
    novaCredits: 35,
    note: "Lip-sync existing video with uploaded or generated audio.",
  },

  "kling-lipsync": {
    label: "Kling LipSync",
    endpoint: "fal-ai/kling-video/lipsync/audio-to-video",
    type: "talking-avatar",
    supportsAudio: true,
    requiresVideo: true,
    requiresAudio: true,
    supportsCharacterConsistency: "high",
    supportsExtension: false,
    maxSeconds: 60,
    estimatedFalCostUsd: 0.18,
    novaCredits: 45,
    note: "High-quality lip-sync for existing videos.",
  },

  "seedance-2-text": {
    label: "Seedance 2.0 Text to Video",
    modelKey: "seedance",
    modeKey: "text-to-video",
    endpoint: "bytedance/seedance-2.0/text-to-video",
    type: "video",
    supportsAudio: "model-dependent",
    supportsImageInput: false,
    supportsCharacterConsistency: "medium",
    supportsExtension: true,
    maxSeconds: 10,
    estimatedFalCostUsd: 0.45,
    novaCredits: 80,
    note: "Premium text-to-video model used for cinematic and social creative generation.",
  },

  "seedance-2-image": {
    label: "Seedance 2.0 Image to Video",
    modelKey: "seedance",
    modeKey: "image-to-video",
    endpoint: "bytedance/seedance-2.0/image-to-video",
    type: "video",
    supportsAudio: "model-dependent",
    supportsImageInput: true,
    supportsCharacterConsistency: "medium-high",
    supportsExtension: true,
    maxSeconds: 10,
    estimatedFalCostUsd: 0.45,
    novaCredits: 80,
    note: "Image animation with better reference control than plain text-to-video.",
  },

  "seedance-2-reference": {
    label: "Seedance 2.0 Reference to Video",
    modelKey: "seedance",
    modeKey: "reference-to-video",
    endpoint: "bytedance/seedance-2.0/reference-to-video",
    type: "consistent-character",
    supportsAudio: "model-dependent",
    supportsImageInput: true,
    supportsCharacterConsistency: "high",
    supportsExtension: true,
    maxSeconds: 10,
    estimatedFalCostUsd: 0.5,
    novaCredits: 90,
    note: "Use for character reference and consistent visual identity workflows.",
  },

  "kling-2-6-pro-image": {
    label: "Kling 2.6 Pro Image to Video",
    endpoint: "fal-ai/kling-video/v2.6/pro/image-to-video",
    type: "video",
    supportsAudio: true,
    supportsImageInput: true,
    supportsCharacterConsistency: "high",
    supportsExtension: true,
    maxSeconds: 10,
    estimatedFalCostUsd: 1.0,
    novaCredits: 180,
    note: "Premium video model with optional native audio. Best for high-value paid plans.",
  },

  "veo-3": {
    label: "Veo 3",
    endpoint: "fal-ai/veo3",
    type: "video",
    supportsAudio: true,
    supportsImageInput: false,
    supportsCharacterConsistency: "medium",
    supportsExtension: false,
    maxSeconds: 8,
    estimatedFalCostUsd: 2.0,
    novaCredits: 350,
    note: "Premium text-to-video with sound. Expensive; use only for paid plans.",
  },

  "elevenlabs-v3-tts": {
    label: "ElevenLabs v3 TTS",
    endpoint: "fal-ai/elevenlabs/tts/eleven-v3",
    type: "audio",
    supportsAudio: true,
    maxCharacters: 2500,
    estimatedFalCostUsd: 0.08,
    novaCredits: 20,
    note: "Premium narration and voiceover generation.",
  },

  "chatterboxhd-tts": {
    label: "ChatterboxHD TTS",
    endpoint: "resemble-ai/chatterboxhd/text-to-speech",
    type: "audio",
    supportsAudio: true,
    maxCharacters: 2500,
    estimatedFalCostUsd: 0.05,
    novaCredits: 15,
    note: "Affordable narration and voiceover generation.",
  },
};

export function getMediaModel(id) {
  return MEDIA_MODELS[id] || null;
}

export function estimateCredits(modelId, options = {}) {
  const model = getMediaModel(modelId);
  if (!model) return 0;

  const seconds = Number(options.seconds || model.maxSeconds || 5);
  const baseSeconds = Number(model.maxSeconds || seconds || 5);
  const multiplier = model.type === "audio" ? 1 : Math.max(1, seconds / baseSeconds);

  return Math.ceil(Number(model.novaCredits || 0) * multiplier);
}

export function isAudioSupported(modelId) {
  const model = getMediaModel(modelId);
  return Boolean(model?.supportsAudio === true);
}

export function publicMediaModels() {
  return Object.entries(MEDIA_MODELS).map(([id, model]) => ({ id, ...model }));
}
