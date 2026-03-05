// @ts-nocheck
/* eslint-disable no-console */
/**
 * GlobalConflictObservatory
 *
 * Deterministic split-view detection + ConflictProof production.
 */

import crypto from "crypto";
import { verifyConsistencyProof, type ConsistencyProofInput } from "./ConsistencyProofEngine";

export type HashAlg = "sha256";
export type ConflictType = "EQUIVOCATION" | "ROLLBACK" | "PREFIX_MISMATCH";
export type Severity = "AMBER" | "RED";

export interface SignedTreeHeadLike {
  origin: string; 
  treeSize: number;
  rootHash: string; 
  timestamp: string; 
  signature: string; 
  sthHash?: string; 
}

export interface SthObservation {
  observerId: string; 
  observedAtUtc: string; 
  sth: SignedTreeHeadLike;
  evidence?: {
    oldSize?: number;
    oldRoot?: string;
    newSize?: number;
    newRoot?: string;
    consistencyProof?: string[]; 
    inclusionProof?: unknown;
  };
}

export interface ConflictProof {
  conflictId: string; 
  conflictType: ConflictType;
  severity: Severity; 
  sthA: Pick<SignedTreeHeadLike, "origin" | "treeSize" | "rootHash" | "timestamp" | "signature">;
  sthB: Pick<SignedTreeHeadLike, "origin" | "treeSize" | "rootHash" | "timestamp" | "signature">;
  detectedBy: string; 
  detectedAtUtc: string; 
  logId: string; 
  evidence?: {
    inclusionProof?: unknown;
    consistencyProof?: string[]; 
  };
  canonicalConflictHash: string; 
  signature?: {
    type: "Ed25519";
    keyId: string; 
    value: string; 
  };
}

export interface DetectedConflict {
  proof: ConflictProof;
  reason:
    | "EQUIVOCATION_SAME_SIZE_DIFF_ROOT"
    | "ROLLBACK_SIZE_DECREASE"
    | "PREFIX_MISMATCH_CONSISTENCY_FAIL"
    | "INVALID_STH_SIGNATURE";
}

export interface ObservatoryConfig {
  hashAlg: HashAlg; 
  verifySthSignature: (sth: SignedTreeHeadLike) => boolean;
  maxObservations?: number;
}

function isFiniteInt(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && Math.floor(n) === n;
}

function normRootHash(rootHash: string): string | null {
  if (typeof rootHash !== "string") return null;
  const s = rootHash.toLowerCase().trim();
  const hex = s.startsWith("sha256:") ? s.slice("sha256:".length) : s;
  if (!/^[a-f0-9]{64}$/.test(hex)) return null;
  return `sha256:${hex}`;
}

function sha256Hex(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function canonicalSthBytes(sth: Pick<SignedTreeHeadLike, "origin" | "treeSize" | "rootHash" | "timestamp" | "signature">): Buffer {
  const root = normRootHash(sth.rootHash) ?? "sha256:".padEnd(7 + 64, "0"); 
  const ts = typeof sth.timestamp === "string" ? sth.timestamp : "";
  const sig = typeof sth.signature === "string" ? sth.signature : "";
  return Buffer.from(`${sth.origin}|${sth.treeSize}|${root}|${ts}|${sig}`, "utf8");
}

export function computeCanonicalConflictHash(params: {
  sthA: Pick<SignedTreeHeadLike, "origin" | "treeSize" | "rootHash" | "timestamp" | "signature">;
  sthB: Pick<SignedTreeHeadLike, "origin" | "treeSize" | "rootHash" | "timestamp" | "signature">;
}): string {
  const a = canonicalSthBytes(params.sthA);
  const b = canonicalSthBytes(params.sthB);
  const ordered = Buffer.compare(a, b) <= 0 ? [a, b] : [b, a];
  return sha256Hex(Buffer.concat(ordered));
}

export function deriveDeterministicConflictId(logId: string, canonicalConflictHash: string): string {
  const ns = Buffer.from("whenisdue:conflict", "utf8");
  const name = Buffer.from(`${logId}:${canonicalConflictHash}`, "utf8");
  const h = crypto.createHash("sha256").update(Buffer.concat([ns, Buffer.from([0x00]), name])).digest();

  const b = Buffer.from(h.slice(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; 
  b[8] = (b[8] & 0x3f) | 0x80; 

  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function minimalSth(sth: SignedTreeHeadLike): Pick<SignedTreeHeadLike, "origin" | "treeSize" | "rootHash" | "timestamp" | "signature"> {
  return {
    origin: sth.origin,
    treeSize: sth.treeSize,
    rootHash: normRootHash(sth.rootHash) ?? sth.rootHash,
    timestamp: sth.timestamp,
    signature: sth.signature,
  };
}

function validSthShape(sth: SignedTreeHeadLike): { ok: true; normRoot: string } | { ok: false; error: string } {
  if (!sth || typeof sth !== "object") return { ok: false, error: "sth missing" };
  if (typeof sth.origin !== "string" || sth.origin.trim().length < 3) return { ok: false, error: "origin invalid" };
  if (!isFiniteInt(sth.treeSize) || sth.treeSize < 1) return { ok: false, error: "treeSize invalid" };
  const rh = normRootHash(sth.rootHash);
  if (!rh) return { ok: false, error: "rootHash invalid" };
  if (typeof sth.timestamp !== "string" || sth.timestamp.length < 10) return { ok: false, error: "timestamp invalid" };
  if (typeof sth.signature !== "string" || sth.signature.length < 8) return { ok: false, error: "signature invalid" };
  return { ok: true, normRoot: rh };
}

export function detectConflicts(
  cfg: ObservatoryConfig,
  observations: SthObservation[]
): { conflicts: DetectedConflict[]; invalidObservations: number } {
  const maxObs = cfg.maxObservations ?? 50_000;
  const slice = Array.isArray(observations) ? observations.slice(0, maxObs) : [];

  const norm: Array<SthObservation & { _normRoot: string }> = [];
  let invalid = 0;

  for (const o of slice) {
    if (!o || typeof o !== "object") {
      invalid++;
      continue;
    }
    if (typeof o.observerId !== "string" || o.observerId.length < 3) {
      invalid++;
      continue;
    }
    if (typeof o.observedAtUtc !== "string" || o.observedAtUtc.length < 10) {
      invalid++;
      continue;
    }
    const chk = validSthShape(o.sth as any);
    if (!chk.ok) {
      invalid++;
      continue;
    }
    const sth: SignedTreeHeadLike = {
      ...o.sth,
      rootHash: chk.normRoot,
    };

    const sigOk = cfg.verifySthSignature(sth);
    if (!sigOk) {
      invalid++;
      continue;
    }

    norm.push({ ...o, sth, _normRoot: chk.normRoot });
  }

  const byLog = new Map<string, Array<typeof norm[number]>>();
  for (const o of norm) {
    const logId = o.sth.origin;
    const arr = byLog.get(logId) ?? [];
    arr.push(o);
    byLog.set(logId, arr);
  }

  const out = new Map<string, DetectedConflict>();

  for (const [logId, arr] of byLog.entries()) {
    const sizeMap = new Map<number, Map<string, typeof arr[number]>>();
    for (const o of arr) {
      const m = sizeMap.get(o.sth.treeSize) ?? new Map<string, typeof arr[number]>();
      if (!m.has(o._normRoot)) m.set(o._normRoot, o);
      sizeMap.set(o.sth.treeSize, m);
    }

    for (const [treeSize, roots] of sizeMap.entries()) {
      if (roots.size <= 1) continue;
      const entries = Array.from(roots.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const aObs = entries[0][1];
      const bObs = entries[1][1];

      const sthA = minimalSth(aObs.sth);
      const sthB = minimalSth(bObs.sth);
      const canonicalConflictHash = computeCanonicalConflictHash({ sthA, sthB });
      const conflictId = deriveDeterministicConflictId(logId, canonicalConflictHash);

      out.set(conflictId, {
        reason: "EQUIVOCATION_SAME_SIZE_DIFF_ROOT",
        proof: {
          conflictId,
          conflictType: "EQUIVOCATION",
          severity: "RED",
          sthA,
          sthB,
          detectedBy: aObs.observerId,
          detectedAtUtc: aObs.observedAtUtc,
          logId,
          canonicalConflictHash,
          evidence: undefined,
        },
      });
    }

    const byObserver = new Map<string, typeof arr>();
    for (const o of arr) {
      const list = byObserver.get(o.observerId) ?? [];
      list.push(o);
      byObserver.set(o.observerId, list);
    }

    for (const [observerId, list] of byObserver.entries()) {
      const ordered = list
        .slice()
        .sort((x, y) => (x.observedAtUtc === y.observedAtUtc ? x.sth.treeSize - y.sth.treeSize : x.observedAtUtc.localeCompare(y.observedAtUtc)));

      let maxSizeSeen = 0;
      let maxObs: typeof ordered[number] | null = null;

      for (const o of ordered) {
        if (o.sth.treeSize >= maxSizeSeen) {
          maxSizeSeen = o.sth.treeSize;
          maxObs = o;
          continue;
        }
        if (!maxObs) continue;

        const sthA = minimalSth(maxObs.sth); 
        const sthB = minimalSth(o.sth); 
        const canonicalConflictHash = computeCanonicalConflictHash({ sthA, sthB });
        const conflictId = deriveDeterministicConflictId(logId, canonicalConflictHash);

        if (!out.has(conflictId)) {
          out.set(conflictId, {
            reason: "ROLLBACK_SIZE_DECREASE",
            proof: {
              conflictId,
              conflictType: "ROLLBACK",
              severity: "RED",
              sthA,
              sthB,
              detectedBy: observerId,
              detectedAtUtc: o.observedAtUtc,
              logId,
              canonicalConflictHash,
              evidence: undefined,
            },
          });
        }
      }
    }

    for (const o of arr) {
      const ev = o.evidence;
      if (!ev || !Array.isArray(ev.consistencyProof)) continue;

      const oldSize = ev.oldSize ?? undefined;
      const newSize = ev.newSize ?? undefined;
      const oldRoot = ev.oldRoot ?? undefined;
      const newRoot = ev.newRoot ?? undefined;

      if (!isFiniteInt(oldSize) || !isFiniteInt(newSize) || typeof oldRoot !== "string" || typeof newRoot !== "string") {
        continue;
      }
      if (oldSize >= newSize) continue;

      const input: ConsistencyProofInput = {
        hashAlg: "sha256",
        oldSize,
        newSize,
        oldRoot,
        newRoot,
        proof: ev.consistencyProof,
      };

      const res = verifyConsistencyProof(input);
      if (res.ok) continue;

      const sthA: Pick<SignedTreeHeadLike, "origin" | "treeSize" | "rootHash" | "timestamp" | "signature"> = {
        origin: logId,
        treeSize: oldSize,
        rootHash: oldRoot,
        timestamp: o.sth.timestamp,
        signature: o.sth.signature,
      };
      const sthB: Pick<SignedTreeHeadLike, "origin" | "treeSize" | "rootHash" | "timestamp" | "signature"> = {
        origin: logId,
        treeSize: newSize,
        rootHash: newRoot,
        timestamp: o.sth.timestamp,
        signature: o.sth.signature,
      };

      const canonicalConflictHash = computeCanonicalConflictHash({ sthA, sthB });
      const conflictId = deriveDeterministicConflictId(logId, canonicalConflictHash);

      if (!out.has(conflictId)) {
        out.set(conflictId, {
          reason: "PREFIX_MISMATCH_CONSISTENCY_FAIL",
          proof: {
            conflictId,
            conflictType: "PREFIX_MISMATCH",
            severity: "RED",
            sthA,
            sthB,
            detectedBy: o.observerId,
            detectedAtUtc: o.observedAtUtc,
            logId,
            canonicalConflictHash,
            evidence: {
              consistencyProof: ev.consistencyProof,
              inclusionProof: ev.inclusionProof,
            },
          },
        });
      }
    }
  }

  const conflicts = Array.from(out.values()).sort((a, b) => a.proof.conflictId.localeCompare(b.proof.conflictId));

  return { conflicts, invalidObservations: invalid };
}