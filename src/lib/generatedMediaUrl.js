export function extractGeneratedMediaUrl(payload) {
  const seen = new Set();
  const urls = [];

  function addFromString(value) {
    if (!value || typeof value !== "string") return;

    if (/^data:(image|video)\//i.test(value)) {
      urls.push(value);
      return;
    }

    const matches = value.match(/https?:\/\/[^\s"'<>\\]+/g) || [];

    for (const raw of matches.length ? matches : [value]) {
      const clean = String(raw)
        .replace(/\\u0026/g, "&")
        .replace(/&amp;/g, "&")
        .replace(/[),.;\]]+$/g, "");

      if (/^https?:\/\//i.test(clean)) urls.push(clean);
    }
  }

  function walk(value) {
    if (value == null) return;

    if (typeof value === "string") {
      addFromString(value);
      return;
    }

    if (typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    const priorityKeys = [
      "video",
      "url",
      "video_url",
      "videoUrl",
      "mediaUrl",
      "media_url",
      "outputUrl",
      "output_url",
      "image",
      "images",
      "file",
      "content",
      "result",
      "output",
      "data",
    ];

    for (const key of priorityKeys) {
      if (key in value) walk(value[key]);
    }

    for (const key of Object.keys(value)) {
      if (!priorityKeys.includes(key)) walk(value[key]);
    }
  }

  walk(payload);

  const unique = [...new Set(urls)];

  return (
    unique.find((url) => /^data:video\//i.test(url)) ||
    unique.find((url) => /\.(mp4|webm|mov)(\?|#|$)/i.test(url)) ||
    unique.find((url) => /^data:image\//i.test(url)) ||
    unique.find((url) => /video/i.test(url)) ||
    unique.find((url) => /\.(png|jpg|jpeg|webp)(\?|#|$)/i.test(url)) ||
    unique[0] ||
    null
  );
}

export function isVideoUrl(url) {
  const value = String(url || "");
  return /^data:video\//i.test(value) || /\.(mp4|webm|mov)(\?|#|$)/i.test(value) || /video/i.test(value);
}
