// @ts-nocheck
/* appendIntegrityConflict.ts
 *
 * Phase 15 — Deliverable 1 (File 2)
 * Integrity Log Append Script (conflict proofs)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { verifyConflictProof, parseConflictProof, serializeConflictProof, type ConflictProof } from "./ConflictProofEngine";

type IntegrityIndexEntry = {
  conflictHash: string; 
  conflictId: string; 
  conflictType: string;
  detectedAtUtc: string;
  logId: string;
  href: string; 
  severity: string;
};

type IntegrityIndex = {
  schemaVersion: number; 
  generatedAtUtc: string;
  items: IntegrityIndexEntry[];
};

function assert(condition: any, msg: string): asserts condition {
  if (!condition) throw new Error(`appendIntegrityConflict: ${msg}`);
}

function isIsoUtc(s: string): boolean {
  if (typeof s !== "string") return false;
  if (!s.endsWith("Z")) return false;
  const t = Date.parse(s);
  return Number.isFinite(t);
}

function nowIsoUtc(): string {
  return new Date().toISOString();
}

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--in") args.in = argv[++i];
    else if (a === "--outDir") args.outDir = argv[++i];
    else if (a === "--dryRun") args.dryRun = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return args;
}

function readText(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath: string, text: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, "utf8");
}

function fileExists(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function sha256Hex(buf: Buffer | string): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function validateConflictHashFormat(conflictHash: string): { hex: string } {
  assert(typeof conflictHash === "string" && conflictHash.startsWith("sha256:"), "conflictHash must start with sha256:");
  const hex = conflictHash.slice("sha256:".length);
  assert(/^[0-9a-f]{64}$/.test(hex), "conflictHash must be sha256:<64 lowercase hex chars>");
  return { hex };
}

function loadIndex(indexPath: string): IntegrityIndex {
  if (!fileExists(indexPath)) {
    return {
      schemaVersion: 1,
      generatedAtUtc: nowIsoUtc(),
      items: [],
    };
  }
  const raw = readText(indexPath);
  const obj = JSON.parse(raw) as IntegrityIndex;

  assert(obj && typeof obj === "object", "index.json must be object");
  assert(obj.schemaVersion === 1, "index.json schemaVersion mismatch");
  assert(typeof obj.generatedAtUtc === "string" && isIsoUtc(obj.generatedAtUtc), "index.json generatedAtUtc invalid");
  assert(Array.isArray(obj.items), "index.json items must be array");

  const seen = new Set<string>();
  for (const it of obj.items) {
    assert(it && typeof it === "object", "index item must be object");
    assert(typeof it.conflictHash === "string", "index item conflictHash missing");
    validateConflictHashFormat(it.conflictHash);
    assert(!seen.has(it.conflictHash), "index.json contains duplicate conflictHash");
    seen.add(it.conflictHash);

    assert(typeof it.href === "string" && it.href.length > 0, "index item href invalid");
    assert(typeof it.conflictId === "string" && it.conflictId.startsWith("urn:uuid:"), "index item conflictId invalid");
    assert(typeof it.detectedAtUtc === "string" && isIsoUtc(it.detectedAtUtc), "index item detectedAtUtc invalid");
  }

  return obj;
}

function buildHref(outDirPublicRelative: string, hashHex: string): string {
  const base = outDirPublicRelative.replace(/\\/g, "/").replace(/\/+$/, "");
  return `${base}/${hashHex}.json`;
}

function makeIndexEntry(proof: ConflictProof, href: string): IntegrityIndexEntry {
  return {
    conflictHash: proof.conflictHash,
    conflictId: proof.conflictId,
    conflictType: proof.conflictType,
    detectedAtUtc: proof.detectedAtUtc,
    logId: proof.logId,
    href,
    severity: proof.severity,
  };
}

function ensureAppendOnly(original: IntegrityIndex, next: IntegrityIndex) {
  assert(next.items.length >= original.items.length, "index update would delete items (not allowed)");
  for (let i = 0; i < original.items.length; i++) {
    const a = original.items[i];
    const b = next.items[i];
    assert(JSON.stringify(a) === JSON.stringify(b), "index update would reorder or mutate existing items (not allowed)");
  }
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    // eslint-disable-next-line no-console
    console.log(
      [
        "appendIntegrityConflict.ts",
        "Usage:",
        "  node tools/appendIntegrityConflict.ts --in /path/to/conflictProof.json --outDir web/public/integrity/conflicts [--dryRun]",
      ].join("\n")
    );
    process.exit(0);
  }

  const inPath = args.in as string | undefined;
  const outDir = args.outDir as string | undefined;
  const dryRun = Boolean(args.dryRun);

  assert(typeof inPath === "string" && inPath.length > 0, "--in is required");
  assert(typeof outDir === "string" && outDir.length > 0, "--outDir is required");

  const raw = readText(inPath);
  const proof = parseConflictProof(raw);

  assert(verifyConflictProof(proof), "conflict proof failed verification (signature/hash/id mismatch)");

  assert(typeof proof.detectedAtUtc === "string" && isIsoUtc(proof.detectedAtUtc), "detectedAtUtc must be ISO UTC");
  const { hex } = validateConflictHashFormat(proof.conflictHash);

  const artifactPath = path.join(outDir, `${hex}.json`);
  const canonicalArtifact = serializeConflictProof(proof);

  if (fileExists(artifactPath)) {
    const existing = readText(artifactPath);
    if (existing !== canonicalArtifact) {
      const existingHash = sha256Hex(existing);
      const newHash = sha256Hex(canonicalArtifact);
      assert(
        existingHash === newHash,
        "existing artifact differs from new artifact (immutability violation); refuse to overwrite"
      );
    }
  }

  const indexPath = path.join(outDir, "index.json");
  const index = loadIndex(indexPath);

  const already = index.items.some((it) => it.conflictHash === proof.conflictHash);
  const outDirPublicRelative = "/integrity/conflicts"; 
  const href = buildHref(outDirPublicRelative, hex);

  let nextIndex: IntegrityIndex = {
    schemaVersion: 1,
    generatedAtUtc: nowIsoUtc(),
    items: index.items,
  };

  if (!already) {
    nextIndex = {
      schemaVersion: 1,
      generatedAtUtc: nowIsoUtc(),
      items: [...index.items, makeIndexEntry(proof, href)],
    };
  }

  ensureAppendOnly(index, nextIndex);

  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ok: true, dryRun: true, appended: !already, artifactPath, indexPath }, null, 2));
    process.exit(0);
  }

  if (!fileExists(artifactPath)) {
    writeText(artifactPath, canonicalArtifact);
  }

  writeText(indexPath, JSON.stringify(nextIndex, null, 2) + "\n");

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, appended: !already, conflictHash: proof.conflictHash, href }, null, 2));
}

main();