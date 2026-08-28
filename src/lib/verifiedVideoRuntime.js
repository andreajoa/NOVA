const LTX_PROVIDER = {
  id: "ltx23",
  quotaFamily: "hf-zerogpu",
  base: "https://lightricks-ltx-2-3.hf.space",
  api: "generate_video",
  tasks: new Set(["text-to-video", "image-to-video"]),
  maxSeconds: 10,
  buildData({ input, image, seed }) {
    const { height, width } = dimensionsForAspect(input.aspect_ratio);
    const prompt = [
      String(input.prompt || "").trim(),
      input.negative_prompt ? `Avoid: ${String(input.negative_prompt).trim()}` : "",
    ].filter(Boolean).join("\n");

    return [
      image,
      prompt,
      Number(input.duration || 5),
      false,
      seed,
      false,
      height,
      width,
    ];
  },
};

const LTX_FAST_PROVIDER = {
  id: "ltx-fast",
  quotaFamily: "hf-zerogpu",
  base: "https://lightricks-ltx-video-distilled.hf.space",
  tasks: new Set(["text-to-video", "image-to-video"]),
  maxSeconds: 8.5,
  apiFor(input) {
    return input.task === "image-to-video" ? "image_to_video" : "text_to_video";
  },
  buildData({ input, image, seed }) {
    const { height, width } = dimensionsForFastAspect(input.aspect_ratio);
    return [
      String(input.prompt || "").trim(),
      String(input.negative_prompt || "").trim(),
      input.task === "image-to-video" ? image : null,
      null,
      height,
      width,
      input.task === "image-to-video" ? "image-to-video" : "text-to-video",
      Math.min(8.5, Number(input.duration || 5)),
      9,
      seed,
      false,
      1,
      false,
    ];
  },
};

const WAN_T2V_PROVIDER = {
  id: "wan22-fast-t2v",
  quotaFamily: "hf-zerogpu",
  base: "https://zerogpu-aoti-wan2-2-fp8da-aoti.hf.space",
  api: "generate_video",
  tasks: new Set(["text-to-video"]),
  maxSeconds: 5,
  buildData({ input, seed }) {
    return [
      String(input.prompt || "").trim(),
      String(input.negative_prompt || "").trim(),
      Math.min(5, Number(input.duration || 5)),
      1,
      3,
      2,
      seed,
      false,
    ];
  },
};

const WAN_I2V_PROVIDER = {
  id: "wan22-fast-i2v",
  quotaFamily: "hf-zerogpu",
  base: "https://zerogpu-aoti-wan2-2-fp8da-aoti-faster.hf.space",
  api: "generate_video",
  tasks: new Set(["image-to-video"]),
  maxSeconds: 5,
  buildData({ input, image, seed }) {
    return [
      image,
      String(input.prompt || "").trim(),
      2,
      String(input.negative_prompt || "").trim(),
      Math.min(5, Number(input.duration || 5)),
      1,
      1,
      seed,
      false,
    ];
  },
};

const SUBMIT_TIMEOUT_MS = 20_000;
const RESULT_TIMEOUT_MS = 45_000;
const VERIFY_TIMEOUT_MS = 12_000;
const RUNTIME_DEADLINE_MS = 82_000;

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

function dimensionsForFastAspect(aspect) {
  if (aspect === "9:16") return { height: 512, width: 384 };
  if (aspect === "1:1") return { height: 384, width: 384 };
  return { height: 384, width: 512 };
}

function providerPool(input) {
  const seconds = Number(input.duration || 5);

  if (input.task === "image-to-video" && seconds <= WAN_I2V_PROVIDER.maxSeconds) {
    return [LTX_PROVIDER, WAN_I2V_PROVIDER, LTX_FAST_PROVIDER];
  }

  if (input.task === "text-to-video" && seconds <= WAN_T2V_PROVIDER.maxSeconds) {
    // LTX 2.3 is the primary route because this exact 5-second payload is
    // continuously probed by NOVA CI. Other engines are genuine failovers.
    return [LTX_PROVIDER, WAN_T2V_PROVIDER, LTX_FAST_PROVIDER];
  }

  if (seconds <= LTX_FAST_PROVIDER.maxSeconds) {
    return [LTX_PROVIDER, LTX_FAST_PROVIDER];
  }

  return [LTX_PROVIDER];
}

function requestHeaders(hfToken, extra = {}) {
  return {
    ...extra,
    ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {}),
  };
}

function findVideo(value, base) {
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value) && (/\.mp4(?:\?|#|$)/i.test(value) || /file=/i.test(value))) {
      return value;
    }
    if (value.startsWith("/") && (/\.mp4(?:\?|#|$)/i.test(value) || /file=/i.test(value))) {
      return `${base}${value}`;
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVideo(item, base);
      if (found) return found;
    }
    return null;
  }

  if (value && typeof value === "object") {
    for (const key of ["url", "path", "video", "value"]) {
      if (key in value) {
        const found = findVideo(value[key], base);
        if (found) return found;
      }
    }
    for (const item of Object.values(value)) {
      const found = findVideo(item, base);
      if (found) return found;
    }
  }

  return null;
}

function isSharedZeroGpuQuotaError(error) {
  const text = [error?.message, error?.cause?.message, error?.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return [
    "gpu quota",
    "zerogpu quota",
    "zero gpu quota",
    "quota exceeded",
    "exceeded your quota",
    "rate limit",
    "too many requests",
    "status 429",
    "(429)",
  ].some((needle) => text.includes(needle));
}

function normalizeProviderError(error, provider) {
  const wrapped = new Error(`[${provider.id}] ${error?.message || String(error)}`);
  wrapped.cause = error;
  wrapped.quotaFamily = provider.quotaFamily || "unknown";
  if (isSharedZeroGpuQuotaError(error)) {
    wrapped.code = "NOVA_ZERO_GPU_QUOTA_EXHAUSTED";
  } else {
    wrapped.code = error?.code || "NOVA_FREE_VIDEO_PROVIDER_FAILED";
  }
  return wrapped;
}

async function readReferenceImage(imageUrl) {
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

  return { bytes, contentType };
}

async function uploadReference(provider, reference, hfToken) {
  const extension = reference.contentType.includes("png")
    ? "png"
    : reference.contentType.includes("webp")
      ? "webp"
      : "jpg";
  const form = new FormData();
  form.append(
    "files",
    new Blob([reference.bytes], { type: reference.contentType }),
    `nova-reference.${extension}`
  );

  const uploadTimeout = withTimeout(25000);
  let response;
  try {
    response = await fetch(`${provider.base}/gradio_api/upload`, {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: uploadTimeout.controller.signal,
      headers: requestHeaders(hfToken, { "User-Agent": "NOVA-free-video-pool/1.3" }),
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
    mime_type: reference.contentType,
    meta: { _type: "gradio.FileData" },
  };
}

async function submitJob(provider, input, reference, hfToken) {
  const image = reference ? await uploadReference(provider, reference, hfToken) : null;
  const seed = Number.isFinite(Number(input.seed))
    ? Number(input.seed)
    : Math.floor(Math.random() * 2_000_000_000);
  const payload = JSON.stringify({ data: provider.buildData({ input, image, seed }) });
  const api = typeof provider.apiFor === "function" ? provider.apiFor(input) : provider.api;

  if (!api) throw new Error("NOVA free video provider has no API endpoint");

  const errors = [];
  for (const root of [
    `${provider.base}/gradio_api/call/${api}`,
    `${provider.base}/call/${api}`,
  ]) {
    const submitTimeout = withTimeout(SUBMIT_TIMEOUT_MS);
    try {
      const response = await fetch(root, {
        method: "POST",
        cache: "no-store",
        signal: submitTimeout.controller.signal,
        headers: requestHeaders(hfToken, {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "NOVA-free-video-pool/1.3",
        }),
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
      errors.push(`${response.status}:${text.slice(0, 300)}`);
    } catch (error) {
      errors.push(error?.message || String(error));
    } finally {
      clearTimeout(submitTimeout.timer);
    }
  }

  throw new Error(`NOVA video queue rejected the job: ${errors.join(" | ").slice(0, 900)}`);
}

async function waitForResult(provider, pollUrl, hfToken) {
  const resultTimeout = withTimeout(RESULT_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(pollUrl, {
      method: "GET",
      cache: "no-store",
      signal: resultTimeout.controller.signal,
      headers: requestHeaders(hfToken, {
        Accept: "text/event-stream, application/json",
        "User-Agent": "NOVA-free-video-pool/1.3",
      }),
    });
  } finally {
    clearTimeout(resultTimeout.timer);
  }

  if (!response.ok) throw new Error(`NOVA video result stream failed (${response.status})`);

  const text = await response.text();
  const blocks = text.replace(/\r\n/g, "\n").split("\n\n");
  for (const block of blocks) {
    if (block.includes("event: error")) {
      throw new Error(`NOVA video runtime reported an error: ${block.slice(-1200)}`);
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

    const videoUrl = findVideo(data, provider.base);
    if (!videoUrl) throw new Error("NOVA video runtime returned no MP4 URL");
    return videoUrl;
  }

  throw new Error("NOVA video runtime ended without a completion event");
}

async function verifyVideo(url, hfToken) {
  const timeout = withTimeout(VERIFY_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: timeout.controller.signal,
      headers: requestHeaders(hfToken, {
        Range: "bytes=0-63",
        "User-Agent": "NOVA-free-video-pool/1.3",
      }),
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

async function runProvider(provider, input, reference, hfToken) {
  if (!provider.tasks.has(input.task) || Number(input.duration || 5) > provider.maxSeconds) {
    throw new Error("Provider does not support this NOVA video request");
  }

  const pollUrl = await submitJob(provider, input, reference, hfToken);
  const videoUrl = await waitForResult(provider, pollUrl, hfToken);
  await verifyVideo(videoUrl, hfToken);
  return { videoUrl, engine: provider.id };
}

export async function runVerifiedVideoRuntime(input = {}, options = {}) {
  if (!["text-to-video", "image-to-video"].includes(input.task)) {
    throw new Error("Verified NOVA public runtime supports text-to-video and image-to-video only");
  }

  const hfToken = String(options.hfToken || "").trim();
  const reference = input.image_url ? await readReferenceImage(input.image_url) : null;
  const providers = providerPool(input);
  const failures = [];
  const startedAt = Date.now();
  let quotaError = null;
  let quotaFailures = 0;

  for (const provider of providers) {
    if (Date.now() - startedAt >= RUNTIME_DEADLINE_MS) break;

    try {
      return await runProvider(provider, input, reference, hfToken);
    } catch (error) {
      const normalized = normalizeProviderError(error, provider);
      const isQuota = normalized.code === "NOVA_ZERO_GPU_QUOTA_EXHAUSTED";
      failures.push(`${provider.id}:${normalized.message}`);

      console.warn("[NOVA_VIDEO] free engine attempt failed", {
        engine: provider.id,
        code: normalized.code,
        quotaFamily: provider.quotaFamily || "unknown",
        authenticatedHfQuota: Boolean(hfToken),
        message: normalized.message.slice(0, 500),
      });

      if (isQuota) {
        quotaFailures += 1;
        quotaError ||= normalized;

        // A personal HF quota can be exhausted while the same public Space is
        // still accepting anonymous/shared traffic. Retry that exact provider
        // once without the token before moving to another engine.
        if (hfToken && Date.now() - startedAt < RUNTIME_DEADLINE_MS) {
          try {
            return await runProvider(provider, input, reference, "");
          } catch (anonymousError) {
            const anonymousNormalized = normalizeProviderError(anonymousError, provider);
            failures.push(`${provider.id}-anonymous:${anonymousNormalized.message}`);
            if (anonymousNormalized.code === "NOVA_ZERO_GPU_QUOTA_EXHAUSTED") {
              quotaFailures += 1;
              quotaError ||= anonymousNormalized;
            }
            console.warn("[NOVA_VIDEO] anonymous failover attempt failed", {
              engine: provider.id,
              code: anonymousNormalized.code,
              message: anonymousNormalized.message.slice(0, 500),
            });
          }
        }
      }
    }
  }

  // Do not treat the first ZeroGPU quota response as a global stop. Different
  // Spaces can still be healthy, so all configured engines are attempted.
  // Only report quota exhaustion when every attempted route failed that way.
  if (quotaError && failures.length > 0 && quotaFailures >= failures.length) {
    throw quotaError;
  }

  const error = new Error(`All NOVA free video engines failed: ${failures.join(" | ").slice(0, 1500)}`);
  error.code = "NOVA_FREE_VIDEO_POOL_UNAVAILABLE";
  throw error;
}
