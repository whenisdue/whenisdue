import type { Metadata } from "next";

export type SearchParams = Record<string, string | string[] | undefined>;

function first(sp: SearchParams, key: string): string | null {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return null;
}

export function spGet(searchParams: SearchParams, key: string): string | null {
  return first(searchParams, key);
}

export function getSiteUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";
  return base.replace(/\/+$/, "");
}

export function toInt(value: unknown, fallback = NaN): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function parseYmd(value: string | null): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value.trim());
  if (!m) return null;
  const y = toInt(m[1], NaN);
  const mo = toInt(m[2], NaN);
  const d = toInt(m[3], NaN);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return { y, m: mo, d };
}

export function dateUtcFromYmd(ymd: { y: number; m: number; d: number }): Date {
  return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d, 0, 0, 0, 0));
}

export function formatYmdUtc(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function nowUtcYmd(): { y: number; m: number; d: number } {
  const n = new Date();
  return { y: n.getUTCFullYear(), m: n.getUTCMonth() + 1, d: n.getUTCDate() };
}

export function buildQueryString(sp: SearchParams): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") {
      if (v.trim().length > 0) params.set(k, v);
    } else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string" && item.trim().length > 0) params.append(k, item);
      }
    }
  }
  const qs = params.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

export function toolRobotsForParams(sp: SearchParams): Metadata["robots"] {
  const hasAnyParam = Object.values(sp).some((v) =>
    typeof v === "string" ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : false
  );
  if (!hasAnyParam) return { index: true, follow: true };
  return { index: false, follow: true };
}

export function webPageJsonLd(args: {
  url: string;
  name: string;
  description: string;
  lastCalculatedUtc?: string;
  distribution?: {
    cciScore: number;
    cycleCount: number;
    windowDays: number;
    p10Date: string;
    p50Date: string;
    p90Date: string;
  };
}): string {
  const obj = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: args.name,
    url: args.url,
    description: args.description,
    ...(args.lastCalculatedUtc ? { dateModified: args.lastCalculatedUtc } : {}),
    ...(args.distribution
      ? {
          mainEntity: {
            "@type": "ItemList",
            itemListElement: [
              {
                "@type": "PropertyValue",
                name: "Cadence Confidence Index",
                value: args.distribution.cciScore,
                minValue: 0,
                maxValue: 1,
                valueReference: "https://whenisdue.com/methodology",
              },
              {
                "@type": "PropertyValue",
                name: "Historical Cycle Count",
                value: args.distribution.cycleCount,
                valueReference: "https://whenisdue.com/methodology",
              },
              {
                "@type": "PropertyValue",
                name: "P10 Earliest Bound",
                value: args.distribution.p10Date,
                valueReference: "https://whenisdue.com/methodology",
              },
              {
                "@type": "PropertyValue",
                name: "P50 Median Center",
                value: args.distribution.p50Date,
                valueReference: "https://whenisdue.com/methodology",
              },
              {
                "@type": "PropertyValue",
                name: "P90 Latest Bound",
                value: args.distribution.p90Date,
                valueReference: "https://whenisdue.com/methodology",
              },
            ],
          },
        }
      : {}),
  };
  return JSON.stringify(obj);
}

export function makeToolMetadata(args: {
  toolName: string;
  pathname: string;
  searchParams: SearchParams;
  resultTitlePrefix?: string | null;
  description: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const qs = buildQueryString(args.searchParams);
  const urlWithParams = `${siteUrl}${args.pathname}${qs}`;
  const canonical = `${siteUrl}${args.pathname}`;

  const hasPrefix =
    args.resultTitlePrefix && args.resultTitlePrefix.trim().length > 0;

  const prefix = hasPrefix ? `${args.resultTitlePrefix!.trim()} | ` : "";

  const title = `${prefix}${args.toolName} | WhenIsDue`;

  let description = args.description;
  if (hasPrefix) {
    description += ` Calculated on ${new Date().toUTCString()}. Verified by WhenIsDue mathematical infrastructure.`;
  }

  return {
    title,
    description,
    alternates: { canonical },
    robots: toolRobotsForParams(args.searchParams),
    openGraph: {
      title,
      description,
      url: urlWithParams,
      siteName: "WhenIsDue",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
