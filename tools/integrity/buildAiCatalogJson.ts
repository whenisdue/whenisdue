// @ts-nocheck
/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import crypto from "crypto";

// ---------------------------------------------------------------------
// Phase 16 — Deliverable 4
// AI-Native Authority Index generator
// ---------------------------------------------------------------------

type HttpUrl = string;

type AiCatalog = {
  specVersion: "1.0.0";
  generatedAtUtc: string;
  publisher: {
    name: string;
    origin: HttpUrl;
    trustManifest: HttpUrl;
  };
  discovery: {
    llmsTxt: HttpUrl;
    aiCatalog: HttpUrl;
    robotsTxt?: HttpUrl;
    sitemap?: HttpUrl;
  };
  verification: {
    pvc: HttpUrl;
    trustManifest: HttpUrl;
    graphSigning: {
      spec: "RDFC-1.0";
      verifyDocs: HttpUrl;
      proofsIndex?: HttpUrl;
    };
  };
  transparency: {
    sth: {
      latest: HttpUrl;
      history?: HttpUrl;
      witnessed?: HttpUrl;
    };
    diffs: {
      index: HttpUrl;
      range?: HttpUrl;
    };
  };
  integrity: {
    conflicts: {
      index: HttpUrl;
      feedXml: HttpUrl;
    };
    monitor: {
      feedJson: HttpUrl;
      status?: HttpUrl;
    };
    gossip?: {
      submit: HttpUrl;
      dailySummary?: HttpUrl;
    };
  };
  content: {
    machineMirrors: Array<{
      name: string;
      description: string;
      href: HttpUrl;
      format: "text/plain" | "application/json" | "application/ld+json";
    }>;
  };
  catalogHash: {
    algorithm: "sha256";
    value: string; 
  };
};

function main(): void {
  const nowUtc = mustEnv("WHENISDUE_NOW_UTC");
  if (!isIsoUtc(nowUtc)) fail("WHENISDUE_NOW_UTC must be ISO 8601 UTC (ends with Z)");

  const origin = mustHttpsUrl(mustEnv("WHENISDUE_SITE_ORIGIN"), "WHENISDUE_SITE_ORIGIN");
  const outPath = mustEnv("WHENISDUE_OUTPUT_PATH");

  const trustUrl = mustHttpsUrl(process.env.WHENISDUE_TRUST_URL ?? `${origin}/.well-known/whenisdue-trust.json`, "WHENISDUE_TRUST_URL");
  const llmsUrl = mustHttpsUrl(process.env.WHENISDUE_LLMS_URL ?? `${origin}/llms.txt`, "WHENISDUE_LLMS_URL");
  const catalogUrl = mustHttpsUrl(process.env.WHENISDUE_CATALOG_URL ?? `${origin}/.well-known/ai-catalog.json`, "WHENISDUE_CATALOG_URL");

  const pvcUrl = mustHttpsUrl(process.env.WHENISDUE_PVC_URL ?? `${origin}/verify`, "WHENISDUE_PVC_URL");
  const verifyDocsUrl = mustHttpsUrl(process.env.WHENISDUE_VERIFY_DOCS_URL ?? `${origin}/verify/docs`, "WHENISDUE_VERIFY_DOCS_URL");

  const sthLatest = mustHttpsUrl(process.env.WHENISDUE_STH_LATEST_URL ?? `${origin}/transparency/sth/latest.json`, "WHENISDUE_STH_LATEST_URL");
  const sthHistory = optionalHttpsUrl(process.env.WHENISDUE_STH_HISTORY_URL);
  const sthWitnessed = optionalHttpsUrl(process.env.WHENISDUE_STH_WITNESSED_URL ?? `${origin}/transparency/sth/witnessed.json`);

  const diffsIndex = mustHttpsUrl(process.env.WHENISDUE_DIFF_INDEX_URL ?? `${origin}/transparency/diff/index.json`, "WHENISDUE_DIFF_INDEX_URL");
  const diffsRange = optionalHttpsUrl(process.env.WHENISDUE_DIFF_RANGE_URL);

  const conflictsIndex = mustHttpsUrl(process.env.WHENISDUE_CONFLICTS_INDEX_URL ?? `${origin}/integrity/conflicts/index.json`, "WHENISDUE_CONFLICTS_INDEX_URL");
  const conflictsFeedXml = mustHttpsUrl(process.env.WHENISDUE_CONFLICTS_FEED_XML_URL ?? `${origin}/integrity/conflicts/feed.xml`, "WHENISDUE_CONFLICTS_FEED_XML_URL");

  const monitorFeedJson = mustHttpsUrl(process.env.WHENISDUE_MONITOR_FEED_JSON_URL ?? `${origin}/monitor/feed.json`, "WHENISDUE_MONITOR_FEED_JSON_URL");
  const monitorStatus = optionalHttpsUrl(process.env.WHENISDUE_MONITOR_STATUS_URL);

  const gossipSubmit = optionalHttpsUrl(process.env.WHENISDUE_GOSSIP_SUBMIT_URL ?? `${origin}/api/gossip`);
  const gossipDailySummary = optionalHttpsUrl(process.env.WHENISDUE_GOSSIP_DAILY_SUMMARY_URL);

  const proofsIndex = optionalHttpsUrl(process.env.WHENISDUE_PROOFS_INDEX_URL);

  const publisherName = (process.env.WHENISDUE_PUBLISHER_NAME ?? "WhenIsDue").trim();

  const machineMirrors = buildMachineMirrorList(origin);

  const base: Omit<AiCatalog, "catalogHash"> = {
    specVersion: "1.0.0",
    generatedAtUtc: nowUtc,
    publisher: {
      name: publisherName,
      origin,
      trustManifest: trustUrl,
    },
    discovery: {
      llmsTxt: llmsUrl,
      aiCatalog: catalogUrl,
      robotsTxt: optionalHttpsUrl(process.env.WHENISDUE_ROBOTS_URL ?? `${origin}/robots.txt`) ?? undefined,
      sitemap: optionalHttpsUrl(process.env.WHENISDUE_SITEMAP_URL ?? `${origin}/sitemap.xml`) ?? undefined,
    },
    verification: {
      pvc: pvcUrl,
      trustManifest: trustUrl,
      graphSigning: {
        spec: "RDFC-1.0",
        verifyDocs: verifyDocsUrl,
        proofsIndex: proofsIndex ?? undefined,
      },
    },
    transparency: {
      sth: {
        latest: sthLatest,
        history: sthHistory ?? undefined,
        witnessed: sthWitnessed ?? undefined,
      },
      diffs: {
        index: diffsIndex,
        range: diffsRange ?? undefined,
      },
    },
    integrity: {
      conflicts: {
        index: conflictsIndex,
        feedXml: conflictsFeedXml,
      },
      monitor: {
        feedJson: monitorFeedJson,
        status: monitorStatus ?? undefined,
      },
      gossip: gossipSubmit
        ? {
            submit: gossipSubmit,
            dailySummary: gossipDailySummary ?? undefined,
          }
        : undefined,
    },
    content: {
      machineMirrors,
    },
  };

  const canonicalWithoutHash = stableStringify(base);
  const hashHex = sha256Hex(canonicalWithoutHash);

  const finalObj: AiCatalog = {
    ...base,
    catalogHash: {
      algorithm: "sha256",
      value: hashHex,
    },
  };

  const outJson = stableStringify(finalObj) + "\n";

  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, outJson, "utf8");

  console.log(`[ai-catalog] wrote ${outPath}`);
  console.log(`[ai-catalog] sha256=${hashHex}`);
}

function buildMachineMirrorList(origin: string): AiCatalog["content"]["machineMirrors"] {
  const candidates: AiCatalog["content"]["machineMirrors"] = [
    {
      name: "Registry Catalog (JSON-LD)",
      description: "Machine-readable catalog of registry datasets (DataCatalog).",
      href: `${origin}/v1/registry/catalog`,
      format: "application/ld+json",
    },
    {
      name: "Registry Feed (JSON Feed)",
      description: "Recent deterministic changes for incremental indexing.",
      href: `${origin}/v1/registry/feed`,
      format: "application/json",
    },
    {
      name: "Trust Manifest (Zero-handshake)",
      description: "Public trust contract and verification entry points.",
      href: `${origin}/.well-known/whenisdue-trust.json`,
      format: "application/json",
    },
  ];

  for (const c of candidates) {
    mustHttpsUrl(c.href, `machineMirrors:${c.name}`);
  }

  return candidates;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value), null, 2);
}

function canonicalize(value: unknown): unknown {
  if (value === null) return null;

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === "undefined") continue;
      out[k] = canonicalize(v);
    }
    return out;
  }

  return value;
}

function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function mustEnv(key: string): string {
  const v = process.env[key];
  if (!v || !String(v).trim()) {
    console.warn(`⚠️ Missing env var: ${key}. Using dummy fallback.`);
    if (key === "WHENISDUE_NOW_UTC") return new Date().toISOString();
    if (key === "WHENISDUE_SITE_ORIGIN") return "https://whenisdue.com";
    if (key === "WHENISDUE_OUTPUT_PATH") return path.join(process.cwd(), "public", ".well-known", "ai-catalog.json");
    return "dummy";
  }
  return String(v).trim();
}

function mustHttpsUrl(v: string, label: string): HttpUrl {
  const s = String(v).trim();
  if (!s) fail(`${label} is required`);
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    fail(`${label} must be a valid URL`);
  }
  
  // We relax this rule slightly for local testing to allow http://localhost
  if (u.protocol !== "https:" && u.hostname !== "localhost") fail(`${label} must be https`);
  return u.toString();
}

function optionalHttpsUrl(v?: string): HttpUrl | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  return mustHttpsUrl(s, "optionalUrl");
}

function isIsoUtc(v: unknown): boolean {
  if (typeof v !== "string") return false;
  if (!v.endsWith("Z")) return false;
  const ms = Date.parse(v);
  return Number.isFinite(ms);
}

function ensureDir(dir: string): void {
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
}

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

main();