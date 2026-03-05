"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      let url = window.origin + pathname;
      const qs = searchParams?.toString();
      
      if (qs) {
        url = url + `?${qs}`;
      }
      
      // Captures the pageview and automatically logs UTMs (like your webpush clicks)
      posthog.capture("$pageview", {
        $current_url: url,
        traffic_source: qs?.includes("utm_source=webpush") ? "webpush" : "other",
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "dummy_dev_key", {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_pageview: false, // We handle this manually above
      });
    }
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PostHogProvider>
  );
}