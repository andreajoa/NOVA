const VIDEO_BASE = "https://lightricks-ltx-2-3.hf.space";
const VIDEO_API = "generate_video";

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, timer };
}

function dimensionsForAspect(aspect) {
  if (aspect === "9:16") return { height: 768, width: 512 };
  if (aspect === "1:1") return { height: 512, width: 512 };
  return { height: 512, width: 768 };
}

function findVideo(value) {
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value) && (/\.mp4(?:\?|#|$)/i.test(value) || /file=/i.test(value))) {
      return value;
    }
    if (value.startsWith("/") && (/\.mp4(?:\?|#|$)/i.test(value) || /file=/i.test(value))) {
      return `${VIDEO_BASE}${value}`;
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVideo(item);
      if (found) return found;
    }
    return null;
  }

  if (value && typeof value === "object") {
    for (const key of ["url", "path", "video", "value"]) {
      if (key in value) {
        const found = findVideo(value[key]);
        if (found) return found;
      }
    }
    for (const item of Object.values(value)) {
      const found = findVideo(item);
      if (found) return found;
    }
  }

  return null;
}

async function uploadReference(imageUrl) {
  const sourceTimeout = withTimeout(15000);
  let source;
  try {
    source = await fetch(imageUrl, {
      method: "GET",
      cache: "no-store",
      signal: sourceTimeout.controller.signal,
    });
  } finally {
    clearTimeout(sourceTimeout.timer);
  }

  if (!source?.ok) throw new Error(`NOVA could not read reference image (${source?.status || 0})`);
  const contentType = (source.headers.get("content-type") || "image/jpeg").split(";")[0];
  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new Error("NOVA reference is not an image");
  }

  const bytes = await source.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 12_000_000) {
    throw new Error("NOVA reference image is empty or too large");
  }

  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const form = new FormData();
  form.append("files", new Blob([bytes], { type: contentType }), `nova-reference.${extension}`);

  const uploadTimeout = withTimeout(25000);
  let response;
  try {
    response = await fetch(`${VIDEO_BASE}/gradio_api/upload`, {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: uploadTimeout.controller.signal,
      headers: { "User-Agent": "NOVA-free-video-sync/1.0" },
    });
  } finally {
    clearTimeout(uploadTimeout.timer);
  }

  if (!response.ok) throw new Error(`NOVA reference upload failed (${response.status})`);
  const paths = await response.json().catch(() => []);
  const path = Array.isArray(paths) ? paths[0] : null;
  if (!path) throw new Error("NOVA reference upload returned no file path");

  return {
    path,
    orig_name: `nova-reference.${extension}`,
    mime_type: contentType,
    meta: { _type: "gradio.FileData" },
  };
}

async function submitJob(input) {
  const image = input.image_url ? await uploadReference(input.image_url) : null;
  const { height, width } = dimensionsForAspect(input.aspect_ratio);
  const seed = Number.isFinite(Number(input.seed))
    ? Number(input.seed)
    : Math.floor(Math.random() * 2_000_000_000);
  const prompt = [
    String(input.prompt || "").trim(),
    input.negative_prompt ? `Avoid: ${String(input.negative_prompt).trim()}` : "",
  ].filter(Boolean).join("\n");

  const payload = JSON.stringify({
    data: [
      image,
      prompt,
      Number(input.duration || 5),
      false,
      seed,
      false,
      height,
      width,
    ],
  });

  const errors = [];
  for (const root of [
    `${VIDEO_BASE}/gradio_api/call/${VIDEO_API}`,
    `${VIDEO_BASE}/call/${VIDEO_API}`,
  ]) {
    const submitTimeout = withTimeout(45000);
    try {
      const response = await fetch(root, {
        method: "POST",
        cache: "no-store",
        signal: submitTimeout.controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "NOVA-free-video-sync/1.0",
        },
        body: payload,
      });
      const text = await response.text();
      let parsed = {};
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = {};
      }

      if (response.ok && parsed?.event_id) {
        return `${root}/${encodeURIComponent(parsed.event_id)}`;
      }
      errors.push(`${response.status}:${text.slice(0, 180)}`);
    } catch (error) {
      errors.push(error?.message || String(error));
    } finally {
      clearTimeout(submitTimeout.timer);
    }
  }

  throw new Error(`NOVA video queue rejected the job: ${errors.join(" | ").slice(0, 600)}`);
}

async function waitForResult(pollUrl) {
  const resultTimeout = withTimeout(70000);
  let response;
  try {
    response = await fetch(pollUrl, {
      method: "GET",
      cache: "no-store",
      signal: resultTimeout.controller.signal,
      headers: {
        Accept: "text/event-stream, application/json",
        "User-Agent": "NOVA-free-video-sync/1.0",
      },
    });
  } finally {
    clearTimeout(resultTimeout.timer);
  }

  if (!response.ok) throw new Error(`NOVA video result stream failed (${response.status})`);

  const text = await response.text();
  const blocks = text.replace(/\r\n/g, "\n").split("\n\n");
  for (const block of blocks) {
    if (block.includes("event: error")) {
      throw new Error(`NOVA video runtime reported an error: ${block.slice(-900)}`);
    }
    if (!block.includes("event: complete")) continue;

    const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
    if (!dataLine) throw new Error("NOVA video runtime returned an empty completion event");

    let data;
    try {
      data = JSON.parse(dataLine.slice(6));
    } catch {
      throw new Error("NOVA video runtime returned invalid completion data");
    }

    const videoUrl = findVideo(data);
    if (!videoUrl) throw new Error("NOVA video runtime returned no MP4 URL");
    return videoUrl;
  }

  throw new Error("NOVA video runtime ended without a completion event");
}

async function verifyVideo(url) {
  const timeout = withTimeout(20000);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: timeout.controller.signal,
      headers: {
        Range: "bytes=0-63",
        "User-Agent": "NOVA-free-video-sync/1.0",
      },
    });
    if (!response.ok && response.status !== 206) {
      throw new Error(`NOVA generated video is not reachable (${response.status})`);
    }
    const contentType = response.headers.get("content-type") || "";
    const first = Buffer.from(await response.arrayBuffer()).subarray(0, 64);
    if (!contentType.toLowerCase().includes("video") && !first.includes(Buffer.from("ftyp"))) {
      throw new Error("NOVA generated output is not a valid video");
    }
  } finally {
    clearTimeout(timeout.timer);
  }
}

export async function runVerifiedVideoRuntime(input = {}) {
  if (!["text-to-video", "image-to-video"].includes(input.task)) {
    throw new Error("Verified NOVA public runtime supports text-to-video and image-to-video only");
  }

  const pollUrl = await submitJob(input);
  const videoUrl = await waitForResult(pollUrl);
  await verifyVideo(videoUrl);
  return { videoUrl };
}
