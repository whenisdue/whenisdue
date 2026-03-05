// @ts-nocheck
/* eslint-disable no-console */
/**
 * buildIntegrityConflictsIndexJson.ts
 *
 * Phase 19 — Deliverable 1, File 4
 */

import fs from "fs";
import path from "path";

type ConflictType = "EQUIVOCATION" | "ROLLBACK" | "PREFIX_MISMATCH";
type Severity = "AMBER" | "RED" | "CRITICAL";

type ConflictProofLite = {
  conflictId: string;
  conflictType: ConflictType;
  severity?: Severity;
  detectedAtUtc: string;
  detectedBy: string;
  logId: string;
  sthA: { treeSize: number; rootHash: string; signature: string };
  sthB: { treeSize: number; rootHash: string; signature: string };
  canonicalConflictHash: string;
  signature?: unknown;
};

function readUtf8(p: string): string {
  return fs.readFileSync(p, "utf8");
}

function writeUtf8(p: string, s: string): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, "utf8");
}

function safeParseJson<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`JSON_PARSE_FAIL:${label}`);
  }
}

function listConflictProofFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .map((f) => path.join(dir, f))
    .filter((p) => path.basename(p).toLowerCase() !== "index.json");
  files.sort(); 
  return files;
}

function isHex64(s: unknown): boolean {
  return typeof s === "string" && /^[a-f0-9]{64}$/i.test(s);
}

function isIsoUtc(s: unknown): boolean {
  return typeof s === "string" && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/.test(s);
}

function toInt(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? Math.trunc(x) : 0;
}

function validateProof(p: any): ConflictProofLite | null {
  if (!p || typeof p !== "object") return null;

  const conflictId = String(p.conflictId || "");
  const conflictType = String(p.conflictType || "") as ConflictType;
  const detectedAtUtc = String(p.detectedAtUtc || "");
  const detectedBy = String(p.detectedBy || "");
  const logId = String(p.logId || "");
  const canonicalConflictHash = String(p.canonicalConflictHash || "");

  if (!conflictId) return null;
  if (!["EQUIVOCATION", "ROLLBACK", "PREFIX_MISMATCH"].includes(conflictType)) return null;
  if (!isIsoUtc(detectedAtUtc)) return null;
  if (!detectedBy) return null;
  if (!logId) return null;
  if (!isHex64(canonicalConflictHash)) return null;

  const sthA = p.sthA;
  const sthB = p.sthB;
  if (!sthA || !sthB) return null;

  const a = {
    treeSize: toInt(sthA.treeSize),
    rootHash: String(sthA.rootHash || ""),
    signature: String(sthA.signature || ""),
  };
  const b = {
    treeSize: toInt(sthB.treeSize),
    rootHash: String(sthB.rootHash || ""),
    signature: String(sthB.signature || ""),
  };
  if (!a.rootHash || !b.rootHash) return null;
  if (!a.signature || !b.signature) return null;

  const severityRaw = String(p.severity || "");
  const severity =
    severityRaw === "AMBER" || severityRaw === "RED" || severityRaw === "CRITICAL"
      ? (severityRaw as Severity)
      : undefined;

  return {
    conflictId,
    conflictType,
    severity,
    detectedAtUtc,
    detectedBy,
    logId,
    sthA: a,
    sthB: b,
    canonicalConflictHash,
    signature: p.signature,
  };
}

function main(): void {
  const conflictsDir = process.env.WID_CONFLICTS_DIR || "integrity/conflicts";
  const outPath = process.env.WID_CONFLICTS_INDEX_PATH || path.join(conflictsDir, "index.json");

  const files = listConflictProofFiles(conflictsDir);
  if (files.length === 0) {
    const empty = {
      version: 1,
      updatedAtUtc: new Date().toISOString(),
      conflicts: [] as any[],
    };
    writeUtf8(outPath, JSON.stringify(empty, null, 2) + "\n");
    console.log(JSON.stringify({ ok: true, proofs: 0, invalid: 0, wrote: outPath }, null, 2));
    return;
  }

  const entries: any[] = [];
  let invalid = 0;

  for (const f of files) {
    const raw = readUtf8(f);
    const j = safeParseJson<any>(raw, `conflict:${f}`);
    const p = validateProof(j);
    if (!p) {
      invalid += 1;
      continue;
    }

    entries.push({
      conflictId: p.conflictId,
      conflictType: p.conflictType,
      severity: p.severity || "RED",
      detectedAtUtc: p.detectedAtUtc,
      detectedBy: p.detectedBy,
      logId: p.logId,
      treeSizeA: p.sthA.treeSize,
      rootHashA: p.sthA.rootHash,
      treeSizeB: p.sthB.treeSize,
      rootHashB: p.sthB.rootHash,
      canonicalConflictHash: p.canonicalConflictHash,
      href: `/integrity/conflicts/${p.conflictId}.json`,
    });
  }

  entries.sort((x, y) => {
    const ax = String(x.detectedAtUtc);
    const ay = String(y.detectedAtUtc);
    if (ax === ay) return String(x.conflictId).localeCompare(String(y.conflictId));
    return ay.localeCompare(ax);
  });

  const payload = {
    version: 1,
    updatedAtUtc: new Date().toISOString(),
    proofs: entries.length,
    invalid,
    conflicts: entries,
  };

  writeUtf8(outPath, JSON.stringify(payload, null, 2) + "\n");

  console.log(
    JSON.stringify(
      { ok: true, proofsRead: files.length, proofsValid: entries.length, invalid, wrote: outPath },
      null,
      2
    )
  );
}

if (require.main === module) {
  try {
    main();
  } catch (e: any) {
    console.error(String(e?.message || e));
    process.exit(2);
  }
}