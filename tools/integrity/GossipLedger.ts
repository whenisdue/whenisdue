// @ts-nocheck
/* GossipLedger.ts
 *
 * Phase 15 — Deliverable 3 (File 1)
 * Passive Gossip Endpoint — ledger core (static-first, fail-closed, deterministic)
 */

import crypto from "crypto";

export type GossipPayload = {
  observedAtUtc: string; 
  treeSize: number;
  rootHash: string; 
  sthSignature: string; 
  sourceUrl: string; 

  observerId?: string; 
  observerPublicKey?: string; 
  observerSignature?: string; 
  pow?: string; 
};

export type IngestResult =
  | { ok: true; action: "ACCEPTED"; contentHash: string; bucketKey: string }
  | { ok: false; action: "REJECTED"; reason: RejectReason };

export type RejectReason =
  | "INVALID_JSON"
  | "PAYLOAD_TOO_LARGE"
  | "MISSING_FIELD"
  | "NONFINITE_NUMBER"
  | "TEMPORAL_ANOMALY"
  | "INVALID_STH_SIGNATURE"
  | "INVALID_OBSERVER_SIGNATURE"
  | "REJECT_DUPLICATE"
  | "REJECT_POW";

export type LedgerPolicy = {
  maxPayloadBytes: number; 
  maxClockSkewMs: number; 
  requireObserverSignature: boolean; 
  enablePow: boolean; 
  powDifficultyBits: number; 
};

export type LogKeyResolver = (sourceUrl: string) => Promise<Ed25519PublicKey>;

export type Ed25519PublicKey = {
  raw: Buffer;
};

export type LedgerStorage = {
  has: (bucketKey: string, contentHash: string) => Promise<boolean>;
  append: (bucketKey: string, contentHash: string, payload: GossipPayload) => Promise<void>;
  list: (bucketKey: string) => Promise<Array<{ contentHash: string; payload: GossipPayload }>>;
};

export type Conflict = {
  conflictType: "EQUIVOCATION";
  treeSize: number;
  rootHashA: string;
  rootHashB: string;
  observedAtUtcA: string;
  observedAtUtcB: string;
  sourceUrl: string;
  evidenceHashes: [string, string]; 
};

export type BucketSummary = {
  bucketKey: string;
  acceptedCount: number;
  bucketMerkleRoot: string; 
  conflicts: Conflict[];
};

export const DEFAULT_POLICY: LedgerPolicy = {
  maxPayloadBytes: 4096,
  maxClockSkewMs: 5 * 60 * 1000,
  requireObserverSignature: true,
  enablePow: false,
  powDifficultyBits: 20,
};

function assert(condition: any, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

function isIsoUtc(s: any): boolean {
  if (typeof s !== "string") return false;
  if (!s.endsWith("Z")) return false;
  const t = Date.parse(s);
  return Number.isFinite(t);
}

function toInt(n: any): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return NaN;
  return Math.trunc(x);
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function base64ToBuf(b64: string): Buffer {
  return Buffer.from(b64, "base64");
}

function base64UrlToBuf(b64u: string): Buffer {
  const pad = (4 - (b64u.length % 4)) % 4;
  const b64 = (b64u + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

export function jcsCanonicalize(value: any): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "number") {
    assert(Number.isFinite(value), "Non-finite number");
    return JSON.stringify(value);
  }
  if (t === "string" || t === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map((v) => jcsCanonicalize(v)).join(",") + "]";
  }
  if (t === "object") {
    const keys = Object.keys(value).sort();
    return (
      "{" +
      keys
        .map((k) => {
          return JSON.stringify(k) + ":" + jcsCanonicalize(value[k]);
        })
        .join(",") +
      "}"
    );
  }
  throw new Error("Unsupported type");
}

function ed25519SpkiFromRaw(raw32: Buffer): Buffer {
  assert(raw32.length === 32, "Ed25519 pubkey must be 32 bytes");
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  return Buffer.concat([prefix, raw32]);
}

function verifyEd25519Signature(rawPub: Buffer, message: Buffer, sigB64: string): boolean {
  try {
    const spki = ed25519SpkiFromRaw(rawPub);
    const keyObj = crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
    return crypto.verify(null, message, keyObj, base64ToBuf(sigB64));
  } catch {
    return false;
  }
}

function sthBytesForVerification(p: GossipPayload): Buffer {
  const obj = {
    sourceUrl: p.sourceUrl,
    treeSize: p.treeSize,
    rootHash: p.rootHash,
    observedAtUtc: p.observedAtUtc,
  };
  return Buffer.from(jcsCanonicalize(obj), "utf8");
}

function canonicalPayloadMinusObserverSig(p: GossipPayload): string {
  const clone: any = { ...p };
  delete clone.observerSignature;
  return jcsCanonicalize(clone);
}

function payloadByteSize(p: GossipPayload): number {
  return Buffer.byteLength(jcsCanonicalize(p), "utf8");
}

function powCheck(token: string, canonical: string, difficultyBits: number): boolean {
  const msg = token + "\n" + sha256Hex(Buffer.from(canonical, "utf8"));
  const h = crypto.createHash("sha256").update(msg).digest();
  const bits = leadingZeroBits(h);
  return bits >= difficultyBits;
}

function leadingZeroBits(buf: Buffer): number {
  let count = 0;
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b === 0) {
      count += 8;
      continue;
    }
    for (let bit = 7; bit >= 0; bit--) {
      if ((b & (1 << bit)) === 0) count++;
      else return count;
    }
  }
  return count;
}

export function bucketKeyFromObservedAtUtc(observedAtUtc: string): string {
  const d = new Date(observedAtUtc);
  assert(Number.isFinite(d.getTime()), "Invalid observedAtUtc");
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}/hour-${hh}`;
}

export async function ingestGossip(
  input: any,
  policy: LedgerPolicy,
  storage: LedgerStorage,
  resolveLogKey: LogKeyResolver
): Promise<IngestResult> {
  let p: GossipPayload;
  try {
    p = input as GossipPayload;
  } catch {
    return { ok: false, action: "REJECTED", reason: "INVALID_JSON" };
  }

  const required: Array<keyof GossipPayload> = ["observedAtUtc", "treeSize", "rootHash", "sthSignature", "sourceUrl"];
  for (const k of required) {
    if ((p as any)[k] === undefined || (p as any)[k] === null || String((p as any)[k]).length === 0) {
      return { ok: false, action: "REJECTED", reason: "MISSING_FIELD" };
    }
  }

  if (!isIsoUtc(p.observedAtUtc)) return { ok: false, action: "REJECTED", reason: "MISSING_FIELD" };

  const treeSize = toInt(p.treeSize);
  if (!Number.isFinite(treeSize) || treeSize < 0) return { ok: false, action: "REJECTED", reason: "NONFINITE_NUMBER" };
  p.treeSize = treeSize;

  const bytes = payloadByteSize(p);
  if (bytes > policy.maxPayloadBytes) return { ok: false, action: "REJECTED", reason: "PAYLOAD_TOO_LARGE" };

  const now = Date.now();
  const ts = Date.parse(p.observedAtUtc);
  if (!Number.isFinite(ts)) return { ok: false, action: "REJECTED", reason: "TEMPORAL_ANOMALY" };
  if (Math.abs(now - ts) > policy.maxClockSkewMs) return { ok: false, action: "REJECTED", reason: "TEMPORAL_ANOMALY" };

  const canonicalFull = jcsCanonicalize(p);
  if (policy.enablePow) {
    if (typeof p.pow !== "string" || p.pow.length < 8) return { ok: false, action: "REJECTED", reason: "REJECT_POW" };
    if (!powCheck(p.pow, canonicalFull, policy.powDifficultyBits)) return { ok: false, action: "REJECTED", reason: "REJECT_POW" };
  }

  const logKey = await resolveLogKey(p.sourceUrl);
  const sthBytes = sthBytesForVerification(p);
  const sthOk = verifyEd25519Signature(logKey.raw, sthBytes, p.sthSignature);
  if (!sthOk) return { ok: false, action: "REJECTED", reason: "INVALID_STH_SIGNATURE" };

  if (policy.requireObserverSignature) {
    if (typeof p.observerPublicKey !== "string" || p.observerPublicKey.length === 0) {
      return { ok: false, action: "REJECTED", reason: "MISSING_FIELD" };
    }
    if (typeof p.observerSignature !== "string" || p.observerSignature.length === 0) {
      return { ok: false, action: "REJECTED", reason: "MISSING_FIELD" };
    }
    const observerPub = base64UrlToBuf(p.observerPublicKey);
    assert(observerPub.length === 32, "observerPublicKey must be 32 bytes base64url");
    const msg = Buffer.from(canonicalPayloadMinusObserverSig(p), "utf8");
    const obsOk = verifyEd25519Signature(observerPub, msg, p.observerSignature);
    if (!obsOk) return { ok: false, action: "REJECTED", reason: "INVALID_OBSERVER_SIGNATURE" };
  }

  const bucketKey = bucketKeyFromObservedAtUtc(p.observedAtUtc);
  const contentHash = "sha256:" + sha256Hex(Buffer.from(canonicalFull, "utf8"));
  const exists = await storage.has(bucketKey, contentHash);
  if (exists) return { ok: false, action: "REJECTED", reason: "REJECT_DUPLICATE" };

  await storage.append(bucketKey, contentHash, p);

  return { ok: true, action: "ACCEPTED", contentHash, bucketKey };
}

export async function summarizeBucket(bucketKey: string, storage: LedgerStorage): Promise<BucketSummary> {
  const entries = await storage.list(bucketKey);

  const sorted = [...entries].sort((a, b) => (a.contentHash < b.contentHash ? -1 : a.contentHash > b.contentHash ? 1 : 0));

  const hashes = sorted.map((e) => e.contentHash);

  const bucketMerkleRoot = "sha256:" + merkleRootSha256Hex(hashes);

  const conflicts: Conflict[] = detectEquivocationConflicts(sorted);

  return {
    bucketKey,
    acceptedCount: sorted.length,
    bucketMerkleRoot,
    conflicts,
  };
}

function detectEquivocationConflicts(sorted: Array<{ contentHash: string; payload: GossipPayload }>): Conflict[] {
  const byKey = new Map<string, Array<{ contentHash: string; payload: GossipPayload }>>();
  for (const e of sorted) {
    const k = `${e.payload.sourceUrl}::${e.payload.treeSize}`;
    const arr = byKey.get(k) || [];
    arr.push(e);
    byKey.set(k, arr);
  }

  const conflicts: Conflict[] = [];
  for (const [k, arr] of byKey.entries()) {
    if (arr.length < 2) continue;
    const roots = new Map<string, { contentHash: string; observedAtUtc: string }>();
    for (const e of arr) {
      const rh = e.payload.rootHash;
      if (!roots.has(rh)) {
        roots.set(rh, { contentHash: e.contentHash, observedAtUtc: e.payload.observedAtUtc });
      }
    }
    if (roots.size <= 1) continue;

    const rootKeys = Array.from(roots.keys()).sort();
    const a = roots.get(rootKeys[0])!;
    const b = roots.get(rootKeys[1])!;

    const [sourceUrl, treeSizeStr] = k.split("::");
    const treeSize = toInt(treeSizeStr);

    conflicts.push({
      conflictType: "EQUIVOCATION",
      treeSize,
      rootHashA: rootKeys[0],
      rootHashB: rootKeys[1],
      observedAtUtcA: a.observedAtUtc,
      observedAtUtcB: b.observedAtUtc,
      sourceUrl,
      evidenceHashes: [a.contentHash, b.contentHash],
    });
  }

  conflicts.sort((x, y) => {
    if (x.sourceUrl !== y.sourceUrl) return x.sourceUrl < y.sourceUrl ? -1 : 1;
    if (x.treeSize !== y.treeSize) return x.treeSize - y.treeSize;
    if (x.rootHashA !== y.rootHashA) return x.rootHashA < y.rootHashA ? -1 : 1;
    return x.rootHashB < y.rootHashB ? -1 : 1;
  });

  return conflicts;
}

function merkleRootSha256Hex(leaves: string[]): string {
  if (leaves.length === 0) return sha256Hex(Buffer.from("", "utf8"));

  let level: Buffer[] = leaves.map((s) => crypto.createHash("sha256").update(Buffer.from(s, "utf8")).digest());

  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : level[i]; 
      const parent = crypto.createHash("sha256").update(Buffer.concat([left, right])).digest();
      next.push(parent);
    }
    level = next;
  }

  return level[0].toString("hex");
}