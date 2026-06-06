export function extractUrls(payload) {
  const urls = [];

  function walk(value) {
    if (!value) return;

    if (typeof value === "string") {
      if (/^https?:\/\//i.test(value)) urls.push(value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  }

  walk(payload);
  return [...new Set(urls)];
}

export function extractFirstUrl(payload, kind = "any") {
  const urls = extractUrls(payload);

  if (kind === "video") {
    return urls.find((url) => /\.(mp4|mov|webm)(\?|$)/i.test(url)) || urls[0] || "";
  }

  if (kind === "audio") {
    return urls.find((url) => /\.(mp3|wav|m4a|aac|ogg)(\?|$)/i.test(url)) || urls[0] || "";
  }

  if (kind === "image") {
    return urls.find((url) => /\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(url)) || urls[0] || "";
  }

  return urls[0] || "";
}

export function safeErrorMessage(error) {
  return error?.body?.detail || error?.message || "Generation failed.";
}
