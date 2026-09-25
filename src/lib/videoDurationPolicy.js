// Video lengths a plan may request. Paid plans reach 15s (NOVA's own-GPU LTX
// renders it in one pass); free accounts stay at 10s or less.
export const PAID_MAX_VIDEO_SECONDS = 15;
export const FREE_MAX_VIDEO_SECONDS = 10;

export function normalizeMaxVideoSeconds(paid, requested, fallback) {
  const cap = paid ? PAID_MAX_VIDEO_SECONDS : FREE_MAX_VIDEO_SECONDS;
  return Math.max(5, Math.min(cap, Number(requested) || Number(fallback) || 5));
}

export function videoDurationsFor(maxSeconds) {
  return [5, 10, 15].filter((seconds) => seconds <= maxSeconds);
}
