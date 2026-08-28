function config() {
  const url = process.env.NOVA_ZERO_COST_VIDEO_URL;
  if (!url) return null;
  return {
    url,
    secret: process.env.NOVA_ZERO_COST_VIDEO_SECRET || "",
  };
}

export function canUseZeroCostVideoWorker() {
  return Boolean(config());
}

function normalizeVideoOutput(payload) {
  const out = payload?.output ?? payload?.result ?? payload;
  const url =
    out?.video?.url ||
    out?.video_url ||
    out?.videoUrl ||
    out?.url ||
    (Array.isArray(out?.videos) ? out.videos[0]?.url || out.videos[0] : null);

  if (typeof url === "string" && (/^https?:\/\//i.test(url) || /^data:video\//i.test(url))) {
    return { video: { url } };
  }

  if (out?.video_base64) {
    return { video: { url: `data:video/mp4;base64,${out.video_base64}` } };
  }

  throw new Error("NOVA zero-cost video worker returned no video");
}

export async function runZeroCostVideo(input = {}) {
  const worker = config();
  if (!worker) throw new Error("NOVA zero-cost video worker is not configured");

  const response = await fetch(worker.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(worker.secret ? { Authorization: `Bearer ${worker.secret}` } : {}),
    },
    body: JSON.stringify({ input }),
    cache: "no-store",
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`NOVA zero-cost video worker failed (${response.status})`);
  }

  return normalizeVideoOutput(payload);
}
