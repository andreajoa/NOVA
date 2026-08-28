import { falModels } from "@/lib/falModels";

export function findGenerationModel(modelKey) {
  if (falModels.image?.[modelKey]) {
    return { type: "image", modelKey, model: falModels.image[modelKey] };
  }
  if (falModels.video?.[modelKey]) {
    return { type: "video", modelKey, model: falModels.video[modelKey] };
  }
  return null;
}

export function resolveGenerationSelection({ model: modelKey, mode: requestedMode, body = {} } = {}) {
  const found = findGenerationModel(modelKey);
  if (!found) return null;

  let modeKey = requestedMode;
  if (
    found.modelKey === "gpt-image" &&
    modeKey === "text-to-image" &&
    (body.image_url || body.image_urls?.length)
  ) {
    modeKey = "image-editing";
  }

  const mode = found.model?.modes?.[modeKey];
  if (!mode?.endpoint) return null;

  return {
    ...found,
    modeKey,
    mode,
    endpoint: mode.endpoint,
    isFree: found.model?.tier === "free",
    freeQuotaKind: found.model?.freeQuotaKind || found.type,
    runpodTarget: found.model?.runpodTarget || mode.endpoint,
  };
}

export function isFreeGenerationModel(modelKey) {
  return findGenerationModel(modelKey)?.model?.tier === "free";
}
