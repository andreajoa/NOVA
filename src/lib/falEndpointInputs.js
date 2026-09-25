// Per-endpoint input quirks for fal.ai video models. The generate route sends
// one generic input shape; some endpoints validate duration as an enum of
// strings or accept a narrower range than NOVA's UI offers.

function clampSeconds(seconds, min, max) {
  const n = Math.round(Number(seconds));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function normalizeDurationForEndpoint(endpoint, seconds) {
  const ep = String(endpoint || "");
  if (seconds === undefined || seconds === null) return undefined;
  // Kling v3: duration is a string enum "3".."15".
  if (ep.includes("kling-video/v3")) return String(clampSeconds(seconds, 3, 15));
  // Seedance 2.5: string enum "4".."17" (plus "auto").
  if (ep.includes("seedance-2.5")) return String(clampSeconds(seconds, 4, 15));
  return seconds;
}

// Extra flags that make an endpoint deliver what NOVA advertises.
export function endpointDefaults(endpoint) {
  const ep = String(endpoint || "");
  if (ep.includes("seedance-2.5")) return { generate_audio: true };
  return {};
}
