import { NextRequest, NextResponse } from "next/server";

/**
 * Phase 14 — AI/Agent Discovery Headers
 *
 * Adds:
 * - rel="alternate" → machine mirror JSON endpoint
 * - rel="describedby" → trust manifest
 *
 * Adapted to target /[category]/[slug] routing correctly.
 */

export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  const res = NextResponse.next();

  // Always expose trust manifest (lightweight, safe for all pages)
  res.headers.append(
    "Link",
    `<${origin}/.well-known/whenisdue-trust.json>; rel="describedby"; type="application/json"`
  );

  const pathParts = pathname.split("/").filter(Boolean);

  // Detect tracker pages which use the /[category]/[slug] pattern
  if (pathParts.length === 2) {
    const slug = pathParts[1];

    // Machine mirror for tracker page
    const mirrorUrl = `${origin}/v1/api/tracker/${slug}.json`;

    res.headers.append(
      "Link",
      `<${mirrorUrl}>; rel="alternate"; type="application/json"`
    );
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Apply to all non-static routes except:
     * - /_next
     * - /api
     * - static assets (.json, .txt, .png, etc.)
     */
    "/((?!_next|api|.*\\..*).*)",
  ],
};