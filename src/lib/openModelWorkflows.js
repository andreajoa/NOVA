// Shared policy helpers for NOVA included image generation.
// Keep provider/model implementation details out of this public repository.

export function freeImageDimensions(aspectRatio = "1:1") {
  switch (String(aspectRatio)) {
    case "16:9":
      return { width: 1024, height: 576 };
    case "9:16":
      return { width: 576, height: 1024 };
    case "4:5":
      return { width: 768, height: 960 };
    default:
      return { width: 1024, height: 1024 };
  }
}
