export const VIDEO_RESOLUTION_OPTIONS_BY_MODEL_MODE = {
  "nova-video-free": {
    "text-to-video": [
      ["480p", { label: "480p · INCLUDED" }],
    ],
    "image-to-video": [
      ["480p", { label: "480p · INCLUDED" }],
    ],
  },

  wan: {
    "text-to-video": [
      ["480p", { label: "480p" }],
      ["580p", { label: "580p" }],
      ["720p", { label: "720p" }],
    ],
    "image-to-video": [
      ["480p", { label: "480p" }],
      ["580p", { label: "580p" }],
      ["720p", { label: "720p" }],
    ],
  },

  lyra: {
    "text-to-video": [
      ["480p", { label: "480p" }],
      ["580p", { label: "580p" }],
      ["720p", { label: "720p" }],
    ],
  },

  seedance: {
    "text-to-video": [
      ["480p", { label: "480p" }],
      ["720p", { label: "720p" }],
      ["1080p", { label: "1080p" }],
    ],
    "image-to-video": [
      ["480p", { label: "480p" }],
      ["720p", { label: "720p" }],
      ["1080p", { label: "1080p" }],
    ],
    "reference-to-video": [
      ["480p", { label: "480p" }],
      ["720p", { label: "720p" }],
      ["1080p", { label: "1080p" }],
    ],
  },

  pixverse: {
    "image-to-video": [
      ["360p", { label: "360p" }],
      ["540p", { label: "540p" }],
      ["720p", { label: "720p" }],
      ["1080p", { label: "1080p" }],
    ],
  },

  veo: {
    "text-to-video": [
      ["720p", { label: "720p" }],
      ["1080p", { label: "1080p" }],
      ["4k", { label: "4K" }],
    ],
    "image-to-video": [
      ["720p", { label: "720p" }],
      ["1080p", { label: "1080p" }],
      ["4k", { label: "4K" }],
    ],
    "reference-to-video": [
      ["720p", { label: "720p" }],
      ["1080p", { label: "1080p" }],
      ["4k", { label: "4K" }],
    ],
  },

  happyhorse: {
    "text-to-video": [
      ["720p", { label: "720p" }],
      ["1080p", { label: "1080p" }],
    ],
    "image-to-video": [
      ["720p", { label: "720p" }],
      ["1080p", { label: "1080p" }],
    ],
    "reference-to-video": [
      ["720p", { label: "720p" }],
      ["1080p", { label: "1080p" }],
    ],
  },
};

export function getVideoResolutionOptions(modelKey, modeKey) {
  return (
    VIDEO_RESOLUTION_OPTIONS_BY_MODEL_MODE?.[modelKey]?.[modeKey] ||
    VIDEO_RESOLUTION_OPTIONS_BY_MODEL_MODE?.[modelKey]?.default ||
    []
  );
}

export function normalizeVideoResolutionForModel(modelKey, modeKey, value) {
  const options = getVideoResolutionOptions(modelKey, modeKey);
  if (!options.length) return undefined;

  const allowed = options.map(([key]) => key);
  if (allowed.includes(value)) return value;

  return allowed[0];
}
