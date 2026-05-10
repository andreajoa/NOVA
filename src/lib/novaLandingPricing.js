export const NOVA_API_CREDIT_PACK = {
  usd: 10,
  credits: 140,
  usdPerCredit: 10 / 140,
};

export const LANDING_PAGE_WITH_IMAGES = {
  code: "LANDING_PAGE_WITH_IMAGES",
  label: "Complete Landing Page with AI Images",
  novaCreditsRequired: 24,
  includedImages: 4,
  imageModel: "fal-ai/flux/schnell",
  imageModelLabel: "FLUX.1 schnell",
  falPricingBasis: "$0.003 per megapixel, rounded up to nearest megapixel",
  estimatedDeliveredMegapixels: 5,
  reservedMegapixelsWithBuffer: 10,
  estimatedFalDirectCostUsd: 0.015,
  estimatedFalBufferedCostUsd: 0.03,
  estimatedOperationalBufferUsd: 0.02,
  estimatedInternalCostUsd: 0.05,
  estimatedNovaRevenueUsd: 24 * (10 / 140),
  estimatedGrossProfitUsd: 24 * (10 / 140) - 0.05,
};

export function landingPricingPublic() {
  return {
    package: LANDING_PAGE_WITH_IMAGES.label,
    novaCreditsRequired: LANDING_PAGE_WITH_IMAGES.novaCreditsRequired,
    includedImages: LANDING_PAGE_WITH_IMAGES.includedImages,
    includes: [
      "Landing page layout",
      "Conversion copy",
      "4 AI-generated images",
      "Export ZIP",
      "HTML, React, Next.js, Hydrogen/Oxygen and Shopify Theme formats",
    ],
    model: LANDING_PAGE_WITH_IMAGES.imageModel,
    note: "No video is included in this package. Video must be priced separately to protect margin.",
  };
}

export function landingPricingInternal() {
  return {
    ...landingPricingPublic(),
    internal: {
      falPricingBasis: LANDING_PAGE_WITH_IMAGES.falPricingBasis,
      estimatedDeliveredMegapixels: LANDING_PAGE_WITH_IMAGES.estimatedDeliveredMegapixels,
      reservedMegapixelsWithBuffer: LANDING_PAGE_WITH_IMAGES.reservedMegapixelsWithBuffer,
      estimatedFalDirectCostUsd: LANDING_PAGE_WITH_IMAGES.estimatedFalDirectCostUsd,
      estimatedFalBufferedCostUsd: LANDING_PAGE_WITH_IMAGES.estimatedFalBufferedCostUsd,
      estimatedOperationalBufferUsd: LANDING_PAGE_WITH_IMAGES.estimatedOperationalBufferUsd,
      estimatedInternalCostUsd: LANDING_PAGE_WITH_IMAGES.estimatedInternalCostUsd,
      estimatedNovaRevenueUsd: Number(LANDING_PAGE_WITH_IMAGES.estimatedNovaRevenueUsd.toFixed(4)),
      estimatedGrossProfitUsd: Number(LANDING_PAGE_WITH_IMAGES.estimatedGrossProfitUsd.toFixed(4)),
      estimatedGrossMarginPercent: Number(
        ((LANDING_PAGE_WITH_IMAGES.estimatedGrossProfitUsd /
          LANDING_PAGE_WITH_IMAGES.estimatedNovaRevenueUsd) *
          100).toFixed(2)
      ),
    },
  };
}
