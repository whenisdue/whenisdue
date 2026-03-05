// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Phase 18 — Deliverable 4 (File 1)
 * buildWhenIsDueManifestJson.ts
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

type Args = {
  publicDir: string;
  baseUrl: string;
  outRel: string;
};

function parseArgs(argv: string[]): Args {
  const a: any = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith("--")) continue;
    const key = k.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    a[key] = val;
  }

  const publicDir = String(a.publicDir || "./public");
  const baseUrl = String(a.baseUrl || "");
  const outRel = String(a.outRel || "/.well-known/whenisdue-manifest.json");

  if (!baseUrl) throw new Error("Missing --baseUrl");
  return { publicDir, baseUrl: baseUrl.replace(/\/+$/, ""), outRel };
}

function readIfExists(absPath: string): { sha256: string; size: number } | null {
  if (!fs.existsSync(absPath)) return null;
  const buf = fs.readFileSync(absPath);
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  return { sha256, size: buf.length };
}

function writeJsonAtomic(absPath: string, obj: unknown) {
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = absPath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, absPath);
}

function joinRel(rel: string): string {
  if (!rel.startsWith("/")) return `/${rel}`;
  return rel;
}

function main() {
  const { publicDir, baseUrl, outRel } = parseArgs(process.argv.slice(2));

  const nowUtc = new Date().toISOString();

  const trustRel = "/.well-known/whenisdue-trust.json";
  const witnessDirRelCandidates = ["/.well-known/witness-directory.json", "/.well-known/witnesses.json", "/.well-known/witness.json"];
  const aiCatalogRel = "/ai-catalog.json";
  const llmsRel = "/llms.txt";

  const sthLatestRel = "/transparency/sth/latest.json";
  const sthHistoryRel = "/transparency/sth/history.json";
  const diffIndexRel = "/transparency/diff/index.json";
  const conflictsIndexRel = "/integrity/conflicts/index.json";

  const scittStatementTpl = "/scitt/statement/{id}.cose";
  const scittReceiptTpl = "/scitt/receipt/{id}.cbor";
  const trustVerdictTpl = "/verify/trustVerdict/{id}.json";
  const rfc3161Tpl = "/anchors/rfc3161/{yyyy}/{mm}/{dd}/{name}.tsr";

  const trustMeta = readIfExists(path.join(publicDir, trustRel));
  const aiCatalogMeta = readIfExists(path.join(publicDir, aiCatalogRel));
  const sthLatestMeta = readIfExists(path.join(publicDir, sthLatestRel));
  const conflictsMeta = readIfExists(path.join(publicDir, conflictsIndexRel));

  let witnessRel: string | null = null;
  let witnessMeta: { sha256: string; size: number } | null = null;
  for (const rel of witnessDirRelCandidates) {
    const m = readIfExists(path.join(publicDir, rel));
    if (m) {
      witnessRel = rel;
      witnessMeta = m;
      break;
    }
  }

  const manifest: any = {};
  manifest.specVersion = "1.0.0";
  manifest.service = {
    id: "did:web:whenisdue.com",
    baseUrl,
    generatedAtUtc: nowUtc,
  };

  manifest.discovery = {
    trustContract: {
      url: baseUrl + trustRel,
      sha256: trustMeta ? `sha256:${trustMeta.sha256}` : null,
      size: trustMeta ? trustMeta.size : null,
    },
    witnessDirectory: {
      url: witnessRel ? baseUrl + witnessRel : null,
      sha256: witnessMeta ? `sha256:${witnessMeta.sha256}` : null,
      size: witnessMeta ? witnessMeta.size : null,
    },
    aiCatalog: {
      url: baseUrl + aiCatalogRel,
      sha256: aiCatalogMeta ? `sha256:${aiCatalogMeta.sha256}` : null,
      size: aiCatalogMeta ? aiCatalogMeta.size : null,
    },
    llms: {
      url: baseUrl + llmsRel,
    },
  };

  manifest.transparency = {
    sthLatest: {
      url: baseUrl + sthLatestRel,
      sha256: sthLatestMeta ? `sha256:${sthLatestMeta.sha256}` : null,
      size: sthLatestMeta ? sthLatestMeta.size : null,
      cacheHint: "mutable-pointer",
    },
    sthHistory: {
      url: baseUrl + sthHistoryRel,
      cacheHint: "append-only",
    },
    diffIndex: {
      url: baseUrl + diffIndexRel,
      cacheHint: "append-only",
    },
    conflictsIndex: {
      url: baseUrl + conflictsIndexRel,
      sha256: conflictsMeta ? `sha256:${conflictsMeta.sha256}` : null,
      size: conflictsMeta ? conflictsMeta.size : null,
      cacheHint: "append-only",
    },
  };

  manifest.artifacts = {
    scittStatement: {
      template: baseUrl + joinRel(scittStatementTpl),
      contentType: "application/cose",
      immutability: "immutable",
    },
    scittReceipt: {
      template: baseUrl + joinRel(scittReceiptTpl),
      contentType: "application/cbor",
      immutability: "immutable",
    },
    trustVerdict: {
      template: baseUrl + joinRel(trustVerdictTpl),
      contentType: "application/json",
      immutability: "mutable-per-version",
    },
    rfc3161Timestamp: {
      template: baseUrl + joinRel(rfc3161Tpl),
      contentType: "application/timestamp-reply",
      immutability: "immutable",
    },
  };

  manifest.linkRelations = {
    canonical: "rel=canonical",
    alternateJson: 'rel=alternate; type="application/json"',
    alternateCose: 'rel=alternate; type="application/cose"',
    describedby: "rel=describedby",
    related: "rel=related",
    scittStatement: 'rel="scitt-statement"',
    scittReceipt: 'rel="scitt-receipt"',
    timestamp: 'rel="timestamp"',
    trustVerdict: 'rel="trust-verdict"',
    witnessDirectory: 'rel="witness-directory"',
  };

  manifest.cachePolicy = {
    immutable: "public, max-age=31536000, immutable",
    latestPointers: "public, max-age=60, stale-while-revalidate=3600",
    wellKnown: "public, max-age=3600, must-revalidate",
  };

  const outAbs = path.join(publicDir, outRel);
  writeJsonAtomic(outAbs, manifest);

  console.log(`Wrote ${outRel}`);
}

main();