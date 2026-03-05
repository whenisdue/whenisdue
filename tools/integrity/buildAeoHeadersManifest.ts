// @ts-nocheck
/* eslint-disable no-console */
/**
 * buildAeoHeadersManifest.ts
 *
 * Phase 19 — Deliverable 3 (File 2)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

type TrustVerdict = {
  id: string;
  canonicalUrl?: string;
  citeabilityScore: number;
  status: "PASS" | "WARN" | "FAIL";
  evidenceRefs?: {
    conflicts?: string | null;
  };
};

type HeaderRule = {
  path: string; 
  headers: Record<string, string>;
};

function toInt(x: any, fallback: number): number {
  const n = typeof x === "number" ? x : Number(x);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function readJson(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(dir);
  return out.sort((a, b) => a.localeCompare(b));
}

function sha256Hex(buf: Buffer | string): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function asUrlPath(p: string): string {
  const s = p.replace(/\\/g, "/");
  return s.startsWith("/") ? s : `/${s}`;
}

function inferTier(score: number, status: TrustVerdict["status"]): "HIGH" | "MEDIUM" | "LOW" | "INVALID" {
  if (status === "FAIL") return "INVALID";
  if (!Number.isFinite(score)) return "INVALID";
  if (score >= 85) return "HIGH";
  if (score >= 70) return "MEDIUM";
  return "LOW";
}

function buildLinkHeader(links: Array<{ rel: string; href: string; type?: string }>): string {
  const sorted = [...links].sort((a, b) => {
    const r = a.rel.localeCompare(b.rel);
    if (r !== 0) return r;
    return a.href.localeCompare(b.href);
  });

  return sorted
    .map((l) => {
      const parts = [`<${l.href}>`, `rel="${l.rel}"`];
      if (l.type) parts.push(`type="${l.type}"`);
      return parts.join("; ");
    })
    .join(", ");
}

function main(): void {
  const outPath = process.argv.includes("--out")
    ? process.argv[process.argv.indexOf("--out") + 1]
    : "aeo-headers.json";

  const trustVerdictDir = process.argv.includes("--trustVerdictDir")
    ? process.argv[process.argv.indexOf("--trustVerdictDir") + 1]
    : "verify/trustVerdict";

  const statementDir = process.argv.includes("--statementDir")
    ? process.argv[process.argv.indexOf("--statementDir") + 1]
    : "scitt/statement";

  const receiptDir = process.argv.includes("--receiptDir")
    ? process.argv[process.argv.indexOf("--receiptDir") + 1]
    : "scitt/receipt";

  const timestampDir = process.argv.includes("--timestampDir")
    ? process.argv[process.argv.indexOf("--timestampDir") + 1]
    : "anchors/rfc3161";

  const canonicalHost = process.argv.includes("--canonicalHost")
    ? process.argv[process.argv.indexOf("--canonicalHost") + 1]
    : "https://whenisdue.com";

  const trustTierHeaderName = process.argv.includes("--trustTierHeaderName")
    ? process.argv[process.argv.indexOf("--trustTierHeaderName") + 1]
    : "x-whenisdue-trust-tier";

  const minScoreHigh = toInt(process.env.AEO_TIER_HIGH_MIN, 85);
  const minScoreMedium = toInt(process.env.AEO_TIER_MEDIUM_MIN, 70);

  const tierFrom = (score: number, status: TrustVerdict["status"]) => {
    if (status === "FAIL") return "INVALID" as const;
    if (!Number.isFinite(score)) return "INVALID" as const;
    if (score >= minScoreHigh) return "HIGH" as const;
    if (score >= minScoreMedium) return "MEDIUM" as const;
    return "LOW" as const;
  };

  const verdictFiles = listFilesRecursive(trustVerdictDir).filter((f) => f.endsWith(".json"));

  const rules: HeaderRule[] = [];

  for (const vf of verdictFiles) {
    const verdict = readJson(vf) as TrustVerdict;

    if (!verdict || typeof verdict.id !== "string" || verdict.id.length === 0) continue;

    const id = verdict.id;

    const verdictPath = asUrlPath(path.posix.join("verify/trustVerdict", `${id}.json`));

    const tier = tierFrom(verdict.citeabilityScore, verdict.status);

    const statementPath = asUrlPath(path.posix.join(statementDir, `${id}.cose`));
    const receiptPath = asUrlPath(path.posix.join(receiptDir, `${id}.cbor`));

    const timestampDiscovery = asUrlPath(timestampDir);

    const baseLinks = [
      { rel: "trust-verdict", href: `${canonicalHost}${verdictPath}`, type: "application/json" },
      { rel: "scitt-statement", href: `${canonicalHost}${statementPath}`, type: "application/cose" },
      { rel: "scitt-receipt", href: `${canonicalHost}${receiptPath}`, type: "application/cbor" },
      { rel: "timestamp", href: `${canonicalHost}${timestampDiscovery}` },
      { rel: "describedby", href: `${canonicalHost}/.well-known/ai-ingestion-policy.json`, type: "application/json" },
    ];

    rules.push({
      path: verdictPath,
      headers: {
        [trustTierHeaderName]: tier,
        "x-whenisdue-citeability": String(toInt(verdict.citeabilityScore, 0)),
        "x-whenisdue-trust-status": verdict.status,
        "Cache-Control": "public, max-age=31536000, immutable",
        Link: buildLinkHeader(baseLinks),
        "x-whenisdue-aeo-hdr-sha256": sha256Hex(Buffer.from(buildLinkHeader(baseLinks), "utf8")),
      },
    });

    if (verdict.canonicalUrl && typeof verdict.canonicalUrl === "string") {
      try {
        const u = new URL(verdict.canonicalUrl);
        const canonicalPath = asUrlPath(u.pathname);

        const links = [
          { rel: "canonical", href: `${canonicalHost}${canonicalPath}`, type: "text/html" },
          ...baseLinks,
        ];

        rules.push({
          path: canonicalPath,
          headers: {
            [trustTierHeaderName]: tier,
            "x-whenisdue-citeability": String(toInt(verdict.citeabilityScore, 0)),
            "x-whenisdue-trust-status": verdict.status,
            "Cache-Control": "public, max-age=60, stale-while-revalidate=3600",
            Link: buildLinkHeader(links),
            "x-whenisdue-aeo-hdr-sha256": sha256Hex(Buffer.from(buildLinkHeader(links), "utf8")),
          },
        });
      } catch {
      }
    }
  }

  const byPath = new Map<string, HeaderRule>();
  for (const r of rules.sort((a, b) => a.path.localeCompare(b.path))) byPath.set(r.path, r);

  const finalRules = Array.from(byPath.values()).sort((a, b) => a.path.localeCompare(b.path));

  const outObj = {
    schemaVersion: 1,
    generatedAtUtc: new Date().toISOString(),
    canonicalHost,
    rules: finalRules,
  };

  fs.writeFileSync(outPath, JSON.stringify(outObj, null, 2) + "\n", "utf8");
  console.log(`[buildAeoHeadersManifest] wrote ${outPath}`);
  console.log(`[buildAeoHeadersManifest] rules=${finalRules.length}`);
}

main();