import { NextResponse } from "next/server";
import { requireNovaApiCredits } from "@/lib/novaClaudeConnector";
import {
  createLandingPageDesign,
  createLandingExportFiles,
  createZipBuffer,
  slugify,
} from "@/lib/novaLandingDesigner";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const allowedPlatforms = new Set([
  "html",
  "react",
  "nextjs",
  "hydrogen",
  "shopify-theme",
]);

export async function GET() {
  return NextResponse.json({
    success: true,
    tool: "nova_export_landing_page_zip",
    method: "POST",
    endpoint: "/api/claude/tools/export-landing-page",
    description: "Export a NOVA landing page design as a ZIP package for Shopify, Hydrogen/Oxygen, Next.js, React or HTML.",
    requires: {
      authorization: "Bearer YOUR_NOVA_API_KEY",
      billing: "NOVA API credits required. Minimum purchase: $10.",
      checkoutUrl: "/checkout/api-credits?pack=starter",
    },
    platforms: ["html", "react", "nextjs", "hydrogen", "shopify-theme"],
    example: {
      platform: "hydrogen",
      product: "Luxury perfume",
      brandName: "Maison Nova",
      audience: "Women 25-45",
      style: "black and neon green luxury ecommerce",
    },
  });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));

  const gate = await requireNovaApiCredits(req, Number(body.credits || 3));
  if (!gate.ok) return gate.response;

  const platform = allowedPlatforms.has(body.platform)
    ? body.platform
    : "html";

  const design = body.design && typeof body.design === "object"
    ? body.design
    : createLandingPageDesign({ ...body, platform });

  const files = createLandingExportFiles(design, platform);
  const zip = createZipBuffer(files);
  const slug = slugify(design.product || "nova-landing");
  const key = `users/${gate.identity.userId}/exports/landing/${Date.now()}-${slug}-${platform}.zip`;

  const downloadUrl = await uploadToR2(key, zip, "application/zip");

  return NextResponse.json({
    success: true,
    type: "landing_page_export",
    platform,
    fileName: `${slug}-${platform}.zip`,
    downloadUrl,
    files: files.map((file) => file.path),
    installNotes: {
      "shopify-theme": "Upload as a draft theme ZIP or copy sections/templates/assets into an existing Shopify theme.",
      hydrogen: "Copy files into your Hydrogen project, commit to GitHub and deploy through Oxygen/GitHub.",
      nextjs: "Copy files into your Next.js app folder and adjust routes/assets.",
      react: "Import the React component into your React/Vite project.",
      html: "Open html/index.html or upload the html folder to any static host.",
    }[platform],
    billing: {
      wallet: "nova_api_credits",
      creditsCharged: gate.charged,
      remainingApiCredits: gate.remainingBalance,
    },
  });
}
