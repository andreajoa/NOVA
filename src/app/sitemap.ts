import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://novvideos.online";
  const now = new Date();

  const staticPages = [
    { url: base, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${base}/pricing`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${base}/product-ad-generator`, priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${base}/explore`, priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${base}/contact`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${base}/terms`, priority: 0.3, changeFrequency: "yearly" as const },
    { url: `${base}/privacy`, priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const models = ["seedance","kling","pixverse","veo","happyhorse","ltx","wan","lyra","lucy","kling-avatar"];
  const modelPages = models.map((m) => ({
    url: `${base}/dashboard/models/${m}`,
    priority: 0.8,
    changeFrequency: "monthly" as const,
  }));

  return [...staticPages, ...modelPages].map((page) => ({
    ...page,
    lastModified: now,
  }));
}
