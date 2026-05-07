"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_ID = "G-ES6ER30RY4";
const GT_ID = "GT-K4LNHL2B";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skippedInitial = useRef(false);

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;

    // O primeiro page_view já é enviado no script inicial.
    if (!skippedInitial.current) {
      skippedInitial.current = true;
      return;
    }

    const query = searchParams?.toString();
    const pagePath = pathname + (query ? `?${query}` : "");

    window.gtag?.("event", "page_view", {
      send_to: GA_ID,
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  return (
    <>
      <Script
        id="google-tag-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GT_ID}`}
        strategy="afterInteractive"
      />

      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;

          gtag('js', new Date());

          gtag('config', '${GT_ID}', {
            send_page_view: false
          });

          gtag('config', '${GA_ID}', {
            send_page_view: false
          });

          gtag('event', 'page_view', {
            send_to: '${GA_ID}',
            page_path: window.location.pathname + window.location.search,
            page_location: window.location.href,
            page_title: document.title
          });
        `}
      </Script>

      <Suspense fallback={null}>
        <GoogleAnalyticsPageView />
      </Suspense>
    </>
  );
}
