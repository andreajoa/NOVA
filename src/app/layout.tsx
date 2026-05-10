import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import PromoPopup from "@/components/PromoPopup";
import GeneratePaywallProvider from "@/components/GeneratePaywallProvider";
import StructuredData from "@/components/StructuredData";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.novvideos.online"),
  icons: {
    icon: [
      { url: "/fav2_nova.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "256x256", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  title: "Nova AI Video Studio",
  description: "AI video studio for brands that move fast.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#050505] text-white">
        <GoogleAnalytics />
        <TopNav />
        <StructuredData />
        {children}
        <GeneratePaywallProvider />
        <PromoPopup />
      </body>
    </html>
    </ClerkProvider>
  );
}