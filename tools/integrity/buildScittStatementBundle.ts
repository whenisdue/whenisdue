// @ts-nocheck
/* eslint-disable no-restricted-syntax */
/**
 * Phase 17 — Deliverable 3: Transparent Statement Bundling
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

type BundleConfig = {
  bundleId: string;
  outputPath: string;
  items: BundleItemInput[];
};

type BundleItemInput = {
  id: string;
  jsonPath: string;
  statementCosePath: string;
  receiptCosePath?: string;
  receiptContentsPath?: string;
};

type BundleIndex = {
  specVersion: "scitt-lite-bundle/1";
  bundleId: string;
  createdBy: "whenisdue-build";
  hashAlgorithm: "sha256";
  serialization: "rfc8785";
  items: BundleIndexItem[];
};

type BundleIndexItem = {
  id: string;
  artifacts: Array<{
    kind: "statement.json" | "statement.cose" | "receipt.cose" | "receipt.contents.cbor";
    path: string;
    sha256: string; 
    bytes: number; 
  }>;
};

function main() {
  const args = parseArgs(process.argv.slice(2));
  const configPath = args["--config"];
  if (!configPath) throw new Error("Missing --config path");

  const cfg = readJson<BundleConfig>(configPath);
  validateConfig(cfg);

  const outDir = path.dirname(cfg.outputPath);
  ensureDir(outDir);

  const index: BundleIndex = {
    specVersion: "scitt-lite-bundle/1",
    bundleId: cfg.bundleId,
    createdBy: "whenisdue-build",
    hashAlgorithm: "sha256",
    serialization: "rfc8785",
    items: [],
  };

  const itemsSorted = [...cfg.items].sort((a, b) => a.id.localeCompare(b.id, "en"));
  for (const item of itemsSorted) {
    const artifacts: BundleIndexItem["artifacts"] = [];

    artifacts.push(hashArtifact("statement.json", item.jsonPath, { requiredExt: [".json"] }));

    artifacts.push(hashArtifact("statement.cose", item.statementCosePath, { requiredExt: [".cose"] }));

    const hasAnyReceipt = Boolean(item.receiptCosePath || item.receiptContentsPath);
    if (hasAnyReceipt) {
      if (!item.receiptCosePath || !item.receiptContentsPath) {
        throw new Error(`Item ${item.id}: receiptCosePath and receiptContentsPath must both be set`);
      }
      artifacts.push(hashArtifact("receipt.cose", item.receiptCosePath, { requiredExt: [".cose"] }));
      artifacts.push(hashArtifact("receipt.contents.cbor", item.receiptContentsPath, { requiredExt: [".cbor"] }));
    }

    artifacts.sort((a, b) => {
      const p = a.path.localeCompare(b.path, "en");
      if (p !== 0) return p;
      return a.kind.localeCompare(b.kind, "en");
    });

    index.items.push({ id: item.id, artifacts });
  }

  index.items.sort((a, b) => a.id.localeCompare(b.id, "en"));

  writeJsonAtomic(cfg.outputPath, index);
  // eslint-disable-next-line no-console
  console.log(`OK: wrote ${cfg.outputPath} (${index.items.length} items)`);
}

/* --------------------------- Artifact Hashing --------------------------- */

function hashArtifact(
  kind: BundleIndexItem["artifacts"][number]["kind"],
  relPath: string,
  opts: { requiredExt: string[] },
): BundleIndexItem["artifacts"][number] {
  const safe = normalizeRelPath(relPath);
  const ext = path.extname(safe).toLowerCase();
  if (!opts.requiredExt.includes(ext)) {
    throw new Error(`Artifact ${safe}: invalid extension ${ext}; expected ${opts.requiredExt.join(", ")}`);
  }

  const abs = path.resolve(process.cwd(), safe);
  if (!fs.existsSync(abs)) throw new Error(`Missing artifact: ${safe}`);

  const buf = fs.readFileSync(abs);
  const sha = sha256Hex(buf);

  return {
    kind,
    path: safe.replace(/\\/g, "/"),
    sha256: sha,
    bytes: buf.byteLength,
  };
}

/* ------------------------------ Validation ------------------------------ */

function validateConfig(cfg: BundleConfig) {
  if (!cfg || typeof cfg !== "object") throw new Error("Config must be an object");
  if (typeof cfg.bundleId !== "string" || cfg.bundleId.length < 1) throw new Error("bundleId required");
  if (typeof cfg.outputPath !== "string" || cfg.outputPath.length < 1) throw new Error("outputPath required");
  if (!Array.isArray(cfg.items) || cfg.items.length < 1) throw new Error("items must be a non-empty array");

  const ids = new Set<string>();
  for (const it of cfg.items) {
    if (typeof it.id !== "string" || it.id.length < 1) throw new Error("Each item.id required");
    if (ids.has(it.id)) throw new Error(`Duplicate item.id: ${it.id}`);
    ids.add(it.id);

    requirePath(it.jsonPath, "jsonPath");
    requirePath(it.statementCosePath, "statementCosePath");

    const hasAnyReceipt = Boolean(it.receiptCosePath || it.receiptContentsPath);
    if (hasAnyReceipt) {
      requirePath(it.receiptCosePath!, "receiptCosePath");
      requirePath(it.receiptContentsPath!, "receiptContentsPath");
    }
  }

  normalizeRelPath(cfg.outputPath);
}

function requirePath(p: string, label: string) {
  if (typeof p !== "string" || p.length < 1) throw new Error(`${label} required`);
  normalizeRelPath(p);
}

function normalizeRelPath(p: string): string {
  const s = p.replace(/\\/g, "/").trim();
  if (s.length < 1) throw new Error("Empty path");
  if (s.startsWith("/")) throw new Error(`Absolute path not allowed: ${s}`);
  if (s.includes("..")) throw new Error(`Parent traversal not allowed: ${s}`);
  return s;
}

/* ------------------------------ IO Helpers ------------------------------ */

function readJson<T>(p: string): T {
  const safe = normalizeRelPath(p);
  const abs = path.resolve(process.cwd(), safe);
  const raw = fs.readFileSync(abs, "utf8");
  return JSON.parse(raw) as T;
}

function writeJsonAtomic(outPath: string, obj: unknown) {
  const safe = normalizeRelPath(outPath);
  const abs = path.resolve(process.cwd(), safe);
  const dir = path.dirname(abs);
  ensureDir(dir);

  const json = JSON.stringify(obj, null, 2) + "\n";
  const tmp = abs + ".tmp";
  fs.writeFileSync(tmp, json, "utf8");
  fs.renameSync(tmp, abs);
}

function ensureDir(dirAbsOrRel: string) {
  const abs = path.isAbsolute(dirAbsOrRel) ? dirAbsOrRel : path.resolve(process.cwd(), dirAbsOrRel);
  if (!fs.existsSync(abs)) fs.mkdirSync(abs, { recursive: true });
}

/* ------------------------------ Hashing ------------------------------ */

function sha256Hex(buf: Buffer | Uint8Array): string {
  const h = crypto.createHash("sha256");
  h.update(buf);
  return h.digest("hex");
}

/* ------------------------------ Args ------------------------------ */

function parseArgs(argv: string[]): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const v = argv[i + 1];
      if (v && !v.startsWith("--")) {
        out[a] = v;
        i++;
      } else {
        out[a] = "true";
      }
    }
  }
  return out;
}

main();