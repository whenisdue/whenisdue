// @ts-nocheck
/* eslint-disable no-console */
/**
 * buildConflictProofs.ts
 *
 * Phase 19 — Deliverable 1, File 3
 *
 * Orchestrator:
 * - Loads gossip observations (and/or federation summaries) from a deterministic input directory
 * - Runs GlobalConflictObservatory.detectConflicts()
 * - Emits:
 * - /integrity/conflicts/{conflictId}.json (immutable)
 * - /integrity/conflicts/index.json (append-only index)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  detectConflicts,
  type ConflictProof,
  type SthObservation,
  type ObservatoryConfig,
} from "./GlobalConflictObservatory";

type Json = Record<string, unknown>;

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
  } catch (e) {
    throw new Error(`JSON_PARSE_FAIL:${label}`);
  }
}

function listJsonFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop()!;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile() && ent.name.toLowerCase().endsWith(".json")) out.push(full);
    }
  }
  out.sort(); 
  return out;
}

function sha256HexUtf8(s: string): string {
  return crypto.createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
}

function verifySthSignatureMinimal(sth: any): boolean {
  const pubHex = process.env.WID_LOG_PUBKEY_HEX || "";
  if (!/^[a-f0-9]{64}$/i.test(pubHex)) return false;

  const msg = Buffer.from(
    `${String(sth.origin)}|${String(sth.treeSize)}|${String(sth.rootHash)}|${String(sth.timestamp)}`,
    "utf8"
  );

  const sigStr = String(sth.signature || "");
  if (sigStr.length < 8) return false;

  const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
  const pub = Buffer.from(pubHex, "hex");
  const spkiDer = Buffer.concat([spkiPrefix, pub]);

  const keyObj = crypto.createPublicKey({ key: spkiDer, format: "der", type: "spki" });

  const tryHex = /^[a-f0-9]+$/i.test(sigStr) && sigStr.length % 2 === 0;
  const sigCandidates: Buffer[] = [];
  if (tryHex) sigCandidates.push(Buffer.from(sigStr, "hex"));
  try {
    sigCandidates.push(Buffer.from(sigStr, "base64"));
  } catch {
  }

  for (const sig of sigCandidates) {
    if (sig.length !== 64) continue;
    try {
      const ok = crypto.verify(null, msg, keyObj, sig);
      if (ok) return true;
    } catch {
    }
  }
  return false;
}

function nowUtcIso(): string {
  return new Date().toISOString();
}

function loadObservations(inputDir: string): SthObservation[] {
  const files = listJsonFiles(inputDir);
  if (files.length === 0) {
    throw new Error(`NO_INPUT_FILES:${inputDir}`);
  }

  const obs: SthObservation[] = [];

  for (const f of files) {
    const raw = readUtf8(f);
    const j = safeParseJson<Json>(raw, `obs:${f}`);

    const pushObs = (o: any) => {
      if (!o || typeof o !== "object") return;
      obs.push({
        observerId: String(o.observerId || ""),
        observedAtUtc: String(o.observedAtUtc || o.detectedAtUtc || ""),
        sth: o.sth || o.primarySTH || o.sthObserved || o.signedTreeHead,
        evidence: o.evidence,
      } as any);
    };

    if (Array.isArray(j)) {
      for (const o of j) pushObs(o);
      continue;
    }

    if (Array.isArray((j as any).observations)) {
      for (const o of (j as any).observations) pushObs(o);
      continue;
    }

    pushObs(j);
  }

  if (obs.length === 0) throw new Error("NO_VALID_OBSERVATIONS");
  return obs;
}

function readExistingIndex(indexPath: string): { version: number; updatedAtUtc: string; conflicts: string[] } {
  if (!fs.existsSync(indexPath)) {
    return { version: 1, updatedAtUtc: nowUtcIso(), conflicts: [] };
  }
  const j = safeParseJson<any>(readUtf8(indexPath), "conflicts:index");
  const conflicts = Array.isArray(j.conflicts) ? j.conflicts.map((x: any) => String(x)) : [];
  const version = Number.isFinite(j.version) ? Number(j.version) : 1;
  const updatedAtUtc = typeof j.updatedAtUtc === "string" ? j.updatedAtUtc : nowUtcIso();
  return { version, updatedAtUtc, conflicts };
}

function writeIndex(indexPath: string, conflictIds: string[]): void {
  const uniq = Array.from(new Set(conflictIds)).sort();
  const payload = {
    version: 1,
    updatedAtUtc: nowUtcIso(),
    conflicts: uniq,
  };
  writeUtf8(indexPath, JSON.stringify(payload, null, 2) + "\n");
}

function fileExists(p: string): boolean {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function main(): void {
  const inputDir = process.env.WID_CONFLICT_INPUT_DIR || "integrity/gossip";
  const outDir = process.env.WID_CONFLICT_OUT_DIR || "integrity/conflicts";
  const indexPath = path.join(outDir, "index.json");

  const observations = loadObservations(inputDir);

  const cfg: ObservatoryConfig = {
    hashAlg: "sha256",
    verifySthSignature: (sth) => verifySthSignatureMinimal(sth),
    maxObservations: 200_000,
  };

  const { conflicts, invalidObservations } = detectConflicts(cfg, observations);

  const existing = readExistingIndex(indexPath);
  const known = new Set(existing.conflicts);

  const newIds: string[] = [];
  for (const c of conflicts) {
    const proof: ConflictProof = c.proof;

    const outPath = path.join(outDir, `${proof.conflictId}.json`);
    if (fileExists(outPath)) {
      known.add(proof.conflictId);
      continue;
    }

    const canonicalBytes = JSON.stringify(
      {
        conflictId: proof.conflictId,
        conflictType: proof.conflictType,
        severity: proof.severity,
        sthA: proof.sthA,
        sthB: proof.sthB,
        detectedBy: proof.detectedBy,
        detectedAtUtc: proof.detectedAtUtc,
        logId: proof.logId,
        evidence: proof.evidence || undefined,
        canonicalConflictHash: proof.canonicalConflictHash,
      },
      null,
      0
    );
    const contentHash = sha256HexUtf8(canonicalBytes);

    const toWrite = {
      ...proof,
      contentHash: `sha256:${contentHash}`,
      reason: c.reason,
    };

    writeUtf8(outPath, JSON.stringify(toWrite, null, 2) + "\n");
    known.add(proof.conflictId);
    newIds.push(proof.conflictId);
  }

  writeIndex(indexPath, Array.from(known));

  console.log(
    JSON.stringify(
      {
        ok: true,
        inputDir,
        outDir,
        invalidObservations,
        detectedConflicts: conflicts.length,
        newConflictsWritten: newIds.length,
      },
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