// @ts-nocheck
/* eslint-disable no-console */
/**
 * ConsistencyProofEngine
 * RFC 6962-style Merkle consistency proof verifier (static-host friendly).
 */

import crypto from "crypto";

export type HashAlg = "sha256";

export type ProofHash = string; 

export interface ConsistencyProofInput {
  hashAlg: HashAlg;
  oldSize: number;
  newSize: number;
  oldRoot: ProofHash;
  newRoot: ProofHash;
  proof: ProofHash[]; 
}

export interface ConsistencyProofResult {
  ok: boolean;
  errorCode:
    | null
    | "INVALID_INPUT"
    | "HASH_ALG_UNSUPPORTED"
    | "SIZE_INVALID"
    | "ROOT_INVALID"
    | "PROOF_INVALID"
    | "CONSISTENCY_FAIL";
  details?: string;
}

function isSafeNonNegativeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && Math.floor(n) === n;
}

function stripAlgPrefix(h: string): string {
  const idx = h.indexOf(":");
  if (idx === -1) return h;
  const maybeAlg = h.slice(0, idx).toLowerCase();
  if (maybeAlg === "sha256") return h.slice(idx + 1);
  return h; 
}

function isHex64(s: string): boolean {
  return /^[a-f0-9]{64}$/i.test(s);
}

function parseHashToBuf(h: ProofHash): Buffer | null {
  if (typeof h !== "string") return null;
  const hex = stripAlgPrefix(h).toLowerCase();
  if (!isHex64(hex)) return null;
  return Buffer.from(hex, "hex");
}

function sha256(buf: Buffer): Buffer {
  return crypto.createHash("sha256").update(buf).digest();
}

function hashNode(left: Buffer, right: Buffer): Buffer {
  return sha256(Buffer.concat([Buffer.from([0x01]), left, right]));
}

function compareBufLex(a: Buffer, b: Buffer): number {
  return a.compare(b);
}

export function verifyConsistencyProof(input: ConsistencyProofInput): ConsistencyProofResult {
  try {
    if (!input || typeof input !== "object") {
      return { ok: false, errorCode: "INVALID_INPUT", details: "Input missing." };
    }
    if (input.hashAlg !== "sha256") {
      return { ok: false, errorCode: "HASH_ALG_UNSUPPORTED", details: "Only sha256 supported." };
    }
    if (!isSafeNonNegativeInt(input.oldSize) || !isSafeNonNegativeInt(input.newSize)) {
      return { ok: false, errorCode: "SIZE_INVALID", details: "Sizes must be safe non-negative integers." };
    }
    if (input.oldSize === 0 || input.newSize === 0) {
      return { ok: false, errorCode: "SIZE_INVALID", details: "Tree sizes must be >= 1." };
    }
    if (input.oldSize > input.newSize) {
      return { ok: false, errorCode: "SIZE_INVALID", details: "oldSize must be <= newSize." };
    }

    const oldRoot = parseHashToBuf(input.oldRoot);
    const newRoot = parseHashToBuf(input.newRoot);
    if (!oldRoot || !newRoot) {
      return { ok: false, errorCode: "ROOT_INVALID", details: "Root hash must be 32-byte hex (sha256)." };
    }

    const proof: Buffer[] = [];
    if (!Array.isArray(input.proof)) {
      return { ok: false, errorCode: "PROOF_INVALID", details: "Proof must be an array." };
    }
    for (const h of input.proof) {
      const b = parseHashToBuf(h);
      if (!b) return { ok: false, errorCode: "PROOF_INVALID", details: "Proof contains invalid hash." };
      proof.push(b);
    }

    if (input.oldSize === input.newSize) {
      const rootsMatch = oldRoot.equals(newRoot);
      const proofEmpty = proof.length === 0;
      if (!rootsMatch) {
        return { ok: false, errorCode: "CONSISTENCY_FAIL", details: "Equal sizes but roots differ." };
      }
      if (!proofEmpty) {
        return { ok: false, errorCode: "PROOF_INVALID", details: "Equal sizes require empty proof." };
      }
      return { ok: true, errorCode: null };
    }

    let first = input.oldSize;
    let second = input.newSize;

    while ((first & 1) === 0) {
      first >>= 1;
      second >>= 1;
    }

    if (proof.length === 0) {
      return { ok: false, errorCode: "PROOF_INVALID", details: "Non-trivial consistency requires non-empty proof." };
    }

    let fr = proof[0];
    let sr = proof[0];

    let idx = 1;

    while (first !== 1) {
      if (idx >= proof.length) {
        return { ok: false, errorCode: "PROOF_INVALID", details: "Proof too short." };
      }
      const p = proof[idx++];

      if ((first & 1) === 1) {
        fr = hashNode(p, fr);
        sr = hashNode(p, sr);
      } else {
        sr = hashNode(sr, p);
      }

      first >>= 1;
      second >>= 1;

      if (first === 0) {
        return { ok: false, errorCode: "SIZE_INVALID", details: "Invalid size progression." };
      }
    }

    while (second !== 1) {
      if (idx >= proof.length) {
        return { ok: false, errorCode: "PROOF_INVALID", details: "Proof too short for second tree." };
      }
      const p = proof[idx++];

      if ((second & 1) === 1) {
        sr = hashNode(p, sr);
      } else {
        sr = hashNode(sr, p);
      }

      second >>= 1;

      if (second === 0) {
        return { ok: false, errorCode: "SIZE_INVALID", details: "Invalid size progression (second)." };
      }
    }

    if (idx !== proof.length) {
      return { ok: false, errorCode: "PROOF_INVALID", details: "Proof has unexpected extra elements." };
    }

    const frOk = fr.equals(oldRoot);
    const srOk = sr.equals(newRoot);

    if (!frOk || !srOk) {
      const hint =
        `fr=${fr.toString("hex").slice(0, 12)}.. ` +
        `sr=${sr.toString("hex").slice(0, 12)}..`;
      return { ok: false, errorCode: "CONSISTENCY_FAIL", details: hint };
    }

    return { ok: true, errorCode: null };
  } catch (err: any) {
    return { ok: false, errorCode: "INVALID_INPUT", details: String(err?.message || err) };
  }
}

export function computeCanonicalConflictHashSha256(params: {
  sthA: { treeSize: number; rootHash: ProofHash; signature: string };
  sthB: { treeSize: number; rootHash: ProofHash; signature: string };
}): { ok: true; hex: string } | { ok: false; error: string } {
  const aRoot = parseHashToBuf(params.sthA.rootHash);
  const bRoot = parseHashToBuf(params.sthB.rootHash);
  if (!aRoot || !bRoot) return { ok: false, error: "Invalid rootHash." };
  if (!isSafeNonNegativeInt(params.sthA.treeSize) || !isSafeNonNegativeInt(params.sthB.treeSize)) {
    return { ok: false, error: "Invalid treeSize." };
  }
  if (typeof params.sthA.signature !== "string" || typeof params.sthB.signature !== "string") {
    return { ok: false, error: "Invalid signature type." };
  }

  const aBytes = Buffer.from(
    `${params.sthA.treeSize}|${stripAlgPrefix(params.sthA.rootHash)}|${params.sthA.signature}`,
    "utf8"
  );
  const bBytes = Buffer.from(
    `${params.sthB.treeSize}|${stripAlgPrefix(params.sthB.rootHash)}|${params.sthB.signature}`,
    "utf8"
  );

  const ordered = compareBufLex(aBytes, bBytes) <= 0 ? [aBytes, bBytes] : [bBytes, aBytes];
  const hex = sha256(Buffer.concat(ordered)).toString("hex");
  return { ok: true, hex };
}