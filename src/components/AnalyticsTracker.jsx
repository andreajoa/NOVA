"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

// ── device / browser detection ─────────────────────────────────────────────

function detectDevice() {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(ua)) return "mobile";
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return "tablet";
  return "desktop";
}

function detectBrowser() {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent || "";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/Firefox\//i.test(ua)) return "Firefox";
  return "Other";
}

// ── UTM extraction ─────────────────────────────────────────────────────────

function getUtmParams() {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  return {
    src: sp.get("utm_source") || "",
    med: sp.get("utm_medium") || "",
    cmp: sp.get("utm_campaign") || "",
    cnt: sp.get("utm_content") || "",
  };
}

// ── IDs ────────────────────────────────────────────────────────────────────

function getVisitorId() {
  if (typeof localStorage === "undefined") return crypto.randomUUID();
  let vid = localStorage.getItem("nova_vid");
  if (!vid) {
    vid = crypto.randomUUID();
    localStorage.setItem("nova_vid", vid);
  }
  return vid;
}

function getSessionId() {
  if (typeof sessionStorage === "undefined") return crypto.randomUUID();
  let sid = sessionStorage.getItem("nova_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("nova_sid", sid);
  }
  return sid;
}

// ── scroll depth ───────────────────────────────────────────────────────────

function getScrollDepth() {
  if (typeof document === "undefined") return 0;
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop || 0;
  const scrollHeight = doc.scrollHeight || 1;
  const clientHeight = doc.clientHeight || 1;
  if (scrollHeight <= clientHeight) return 100;
  return Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
}

// ── the tracker ────────────────────────────────────────────────────────────

const FLUSH_INTERVAL = 30_000; // 30s
const ENDPOINT = "/api/analytics/event";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const queue = useRef([]);
  const pageEnteredAt = useRef(0);
  const maxScroll = useRef(0);
  const timerRef = useRef(null);
  const flushing = useRef(false);

  const flush = useCallback(() => {
    if (flushing.current || queue.current.length === 0) return;
    flushing.current = true;
    const batch = queue.current.splice(0);

    // Use sendBeacon if available (works on unload)
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        ENDPOINT,
        new Blob([JSON.stringify(batch)], { type: "application/json" })
      );
      if (!ok) {
        // Fallback to fetch
        fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
          keepalive: true,
        }).catch(() => {});
      }
    } else {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
        keepalive: true,
      }).catch(() => {});
    }

    flushing.current = false;
  }, []);

  const track = useCallback(
    (event, extra = {}) => {
      const utm = getUtmParams();
      queue.current.push({
        sid: getSessionId(),
        vid: getVisitorId(),
        ev: event,
        url: typeof window !== "undefined" ? window.location.pathname : pathname,
        title: typeof document !== "undefined" ? document.title : "",
        ref: typeof document !== "undefined" ? document.referrer : "",
        src: utm.src,
        med: utm.med,
        cmp: utm.cmp,
        cnt: utm.cnt,
        dev: detectDevice(),
        br: detectBrowser(),
        ts: Math.floor(Date.now() / 1000),
        ...extra,
      });
    },
    [pathname]
  );

  // Flush on interval
  useEffect(() => {
    timerRef.current = setInterval(flush, FLUSH_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [flush]);

  // Track page unload — send remaining events + duration
  useEffect(() => {
    const onUnload = () => {
      const dur = Math.round((Date.now() - pageEnteredAt.current) / 1000);
      if (dur > 0) {
        track("pageview_end", { dur, sc: maxScroll.current });
      }
      flush();
    };

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onUnload();
    });

    return () => {
      window.removeEventListener("visibilitychange", onUnload);
    };
  }, [track, flush]);

  // Track scroll depth
  useEffect(() => {
    const onScroll = () => {
      const depth = getScrollDepth();
      if (depth > maxScroll.current) maxScroll.current = depth;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track pageview on route change
  useEffect(() => {
    // Send duration of previous page
    if (pageEnteredAt.current > 0) {
      const dur = Math.round((Date.now() - pageEnteredAt.current) / 1000);
      if (dur > 1) {
        track("pageview_end", {
          dur,
          sc: maxScroll.current,
          url: typeof window !== "undefined" ? window.location.pathname : pathname,
        });
      }
    }

    // New pageview
    pageEnteredAt.current = Date.now();
    maxScroll.current = 0;
    track("pageview");
  }, [pathname, track]);

  return null;
}
