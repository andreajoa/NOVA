import { falModels } from "@/lib/falModels";
import { privateOpenModels } from "@/lib/privateOpenModels";

export function findGenerationModel(modelKey) {
  if (privateOpenModels.image?.[modelKey]) {
    return { type: "image", modelKey, model: privateOpenModels.image[modelKey], privateEngine: true };
  }
  if (privateOpenModels.video?.[modelKey]) {
    return { type: "video", modelKey, model: privateOpenModels.video[modelKey], privateEngine: true };
  }

  const imageModel = falModels.image?.[modelKey];
  if (imageModel) {
    if (imageModel.tier === "free") return null;
    return { type: "image", modelKey, model: imageModel, privateEngine: false };
  }

  const videoModel = falModels.video?.[modelKey];
  if (videoModel) {
    if (videoModel.tier === "free") return null;
    return { type: "video", modelKey, model: videoModel, privateEngine: false };
  }

  return null;
}

export function resolveGenerationSelection({ model: modelKey, mode: requestedMode, body = {} } = {}) {
  // NOVA VIDEO uses its dedicated asynchronous dashboard endpoint. Keeping it
  // out of the generic endpoint prevents accidental synchronous execution,
  // provider leaks and API-key abuse of the included video pool.
  if (modelKey === "nova-video-free") return null;

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
  if (!mode) return null;
  if (!found.privateEngine && !mode.endpoint) return null;

  return {
    ...found,
    modeKey,
    mode,
    endpoint: mode.endpoint || null,
    engine: found.model?.engine || null,
    isFree: found.model?.tier === "free",
    freeQuotaKind: found.model?.freeQuotaKind || found.type,
    zeroCostOnly: Boolean(found.model?.zeroCostOnly),
  };
}

export function isFreeGenerationModel(modelKey) {
  return findGenerationModel(modelKey)?.model?.tier === "free";
}
