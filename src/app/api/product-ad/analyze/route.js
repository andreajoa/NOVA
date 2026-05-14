import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cleanText(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(base, value) {
  if (!value) return "";
  try {
    return new URL(value, base).toString();
  } catch {
    return "";
  }
}

function pickMeta(html, names = []) {
  for (const name of names) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["'][^>]*>`, "i"),
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return cleanText(match[1]);
    }
  }

  return "";
}

function extractTitle(html) {
  return (
    pickMeta(html, ["og:title", "twitter:title"]) ||
    cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "") ||
    cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "")
  );
}

function extractDescription(html) {
  return (
    pickMeta(html, ["og:description", "twitter:description", "description"]) ||
    cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "")
  );
}

function extractJsonLd(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const objects = [];

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script[1].trim());
      const arr = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of arr) {
        if (item?.["@graph"] && Array.isArray(item["@graph"])) {
          objects.push(...item["@graph"]);
        } else {
          objects.push(item);
        }
      }
    } catch {}
  }

  return objects;
}

function findProductData(jsonLd = []) {
  const product =
    jsonLd.find((item) => {
      const type = item?.["@type"];
      return Array.isArray(type)
        ? type.some((t) => String(t).toLowerCase() === "product")
        : String(type || "").toLowerCase() === "product";
    }) || null;

  if (!product) return {};

  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers || {};
  const image = Array.isArray(product.image) ? product.image[0] : product.image;

  return {
    productName: cleanText(product.name || ""),
    productDescription: cleanText(product.description || ""),
    price: cleanText(offer.price || offer.lowPrice || ""),
    currency: cleanText(offer.priceCurrency || ""),
    image: image || "",
    brand: cleanText(product.brand?.name || product.brand || ""),
  };
}

function extractImages(html, baseUrl, jsonProductImage = "") {
  const images = [];

  const metaImage = pickMeta(html, ["og:image", "twitter:image"]);
  if (metaImage) images.push(absoluteUrl(baseUrl, metaImage));

  if (jsonProductImage) images.push(absoluteUrl(baseUrl, jsonProductImage));

  for (const match of html.matchAll(/<img[^>]+(?:src|data-src|data-original)=["']([^"']+)["'][^>]*>/gi)) {
    const url = absoluteUrl(baseUrl, match[1]);
    if (url) images.push(url);
  }

  return [...new Set(images)]
    .filter(Boolean)
    .filter((url) => !url.startsWith("data:"))
    .filter((url) => !/logo|icon|sprite|placeholder/i.test(url))
    .slice(0, 12);
}

function extractColors(html) {
  const colors = [...html.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0].toUpperCase());
  const counts = new Map();

  for (const color of colors) {
    if (["#FFFFFF", "#000000", "#F5F5F5", "#EEEEEE"].includes(color)) continue;
    counts.set(color, (counts.get(color) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color)
    .slice(0, 6);
}

function extractStoreName(url, html) {
  const siteName = pickMeta(html, ["og:site_name", "application-name"]);
  if (siteName) return siteName;

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.split(".")[0].replace(/[-_]/g, " ");
  } catch {
    return "Store";
  }
}

function extractPageCopy(html) {
  const h1 = cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((m) => cleanText(m[1]))
    .filter(Boolean)
    .slice(0, 6);

  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => cleanText(m[1]))
    .filter((t) => t.length > 35 && t.length < 320)
    .slice(0, 10);

  return {
    headline: h1,
    bullets: [...h2s, ...paragraphs].slice(0, 12),
  };
}

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: "Missing product URL." }, { status: 400 });
    }

    let target;
    try {
      target = new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL." }, { status: 400 });
    }

    if (!["http:", "https:"].includes(target.protocol)) {
      return NextResponse.json({ success: false, error: "Only http/https URLs are allowed." }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(target.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NOVAProductAdBot/1.0; +https://www.novvideos.online)",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not read product page. HTTP ${response.status}`,
        },
        { status: 502 }
      );
    }

    const html = await response.text();
    const limitedHtml = html.slice(0, 1_500_000);

    const jsonLd = extractJsonLd(limitedHtml);
    const productData = findProductData(jsonLd);
    const storeName = extractStoreName(target.toString(), limitedHtml);
    const title = productData.productName || extractTitle(limitedHtml);
    const description = productData.productDescription || extractDescription(limitedHtml);
    const images = extractImages(limitedHtml, target.toString(), productData.image);
    const colors = extractColors(limitedHtml);
    const copy = extractPageCopy(limitedHtml);

    const result = {
      success: true,
      url: target.toString(),
      storeName,
      productName: title || "Product",
      description,
      price: productData.price,
      currency: productData.currency,
      brand: productData.brand,
      colors,
      images,
      mainImage: images[0] || "",
      copy,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error?.name === "AbortError"
            ? "Product page took too long to respond."
            : error?.message || "Could not analyze product page.",
      },
      { status: 500 }
    );
  }
}
