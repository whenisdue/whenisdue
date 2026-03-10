"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function PageViewTracker() {
  const pathname = usePathname();
  const sentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    // Prevent double-firing on React StrictMode or fast re-renders
    if (sentRef.current === pathname) return;
    sentRef.current = pathname;

    const payload = JSON.stringify({
      pathname,
      slug: pathname.split("/").filter(Boolean).pop() ?? null,
    });

    const url = "/api/analytics/page-view";

    // Delivery Method 1: sendBeacon (Zero UX Impact)
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }

    // Delivery Method 2: Fetch Keepalive Fallback
    fetch(url, {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {
      // Intentionally swallow errors so telemetry never breaks the UI
    });
  }, [pathname]);

  return null; // This is a logic-only component, it renders nothing visible
}