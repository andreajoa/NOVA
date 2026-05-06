export default function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Nova AI",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "url": "https://novvideos.online",
    "description": "AI video studio for brands, creators, and e-commerce teams. Generate product ads, UGC videos, and cinematic content using Seedance, Kling, Veo, and 10+ AI models.",
    "offers": [
      { "@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "USD" },
      { "@type": "Offer", "name": "Starter", "price": "5", "priceCurrency": "USD" },
      { "@type": "Offer", "name": "Plus", "price": "34", "priceCurrency": "USD" },
      { "@type": "Offer", "name": "Ultra", "price": "119", "priceCurrency": "USD" },
    ],
    "featureList": [
      "AI video generation", "Text to video", "Image to video",
      "Product ad creation", "UGC video generation", "Multiple AI models"
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
