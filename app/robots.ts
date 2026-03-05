import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Keep the dynamic URL logic so it works locally and in production
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/gaming", "/tools"], // Explicitly allowing your core directories
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}