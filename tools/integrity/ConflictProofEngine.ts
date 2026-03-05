// @ts-nocheck
/* ConflictProofEngine.ts
 *
 * Phase 15 — Deliverable 1 (File 1)
 * Conflict Proof Artifact generator + verifier
 */

import crypto from "crypto";

/* ----------------------------- Types & Schema ----------------------------- */

export type ConflictType = "EQUIVOCATION" | "ROLLBACK" | "PREFIX_MISMATCH" | "ANCHOR_DRIFT";
export type Severity = "INFO" | "WARN" | "CRITICAL";

export type SthSnapshot = {
  treeSize: number; 
  rootHash: string; 
  timestamp: string; 
  signature: string; 
};

export type ConflictProof = {
  conflictId: string; 
  conflictHash: string; 
  conflictType: ConflictType;
  detectedAtUtc: string; 
  logId: string; 
  sthA: SthSnapshot;
  sthB: SthSnapshot;
  verificationResults: {
    mismatchField: string;
    expected: string;
    actual: string;
  };
  consistencyProofRef: string | null;
  severity: Severity;
  signedByHub: string; 
  signature: {
    pubKey: string; 
    value: string; 
  };
};

export type GenerateConflictProofInput = {
  conflictType: ConflictType;
  detectedAtUtc: string;
  logId: string;
  signedByHub: string;
  sthA: SthSnapshot;
  sthB: SthSnapshot;
  verificationResults: {
    mismatchField: string;
    expected: string;
    actual: string;
  };
  consistencyProofRef?: string | null;
  maxTimestampSkewSeconds?: number; 
};

/* ------------------------------ Guardrails ------------------------------ */

function assert(condition: any, msg: string): asserts condition {
  if (!condition) throw new Error(`ConflictProofEngine: ${msg}`);
}

function isIsoUtc(s: string): boolean {
  if (typeof s !== "string") return false;
  if (!s.endsWith("Z")) return false;
  const t = Date.parse(s);
  return Number.isFinite(t);
}

function toUtcMs(s: string): number {
  const t = Date.parse(s);
  assert(Number.isFinite(t), `Invalid timestamp: ${s}`);
  return t;
}

function isSafeInt(n: any): n is number {
  return typeof n === "number" && Number.isInteger(n) && Number.isSafeInteger(n);
}

function requireEd25519Tag(sig: string, fieldName: string) {
  assert(typeof sig === "string" && sig.startsWith("Ed25519:"), `${fieldName} must start with "Ed25519:"`);
  const b64 = sig.slice("Ed25519:".length);
  assert(b64.length > 0, `${fieldName} missing base64 payload`);
  assert(/^[A-Za-z0-9+/=]+$/.test(b64), `${fieldName} base64 contains invalid characters`);
}

function requireSha256Tag(hash: string, fieldName: string) {
  assert(typeof hash === "string" && hash.startsWith("sha256:"), `${fieldName} must start with "sha256:"`);
  const rest = hash.slice("sha256:".length);
  assert(rest.length > 0, `${fieldName} missing digest payload`);
}

function validateSth(sth: SthSnapshot, label: string) {
  assert(sth && typeof sth === "object", `${label} must be object`);
  assert(isSafeInt(sth.treeSize) && sth.treeSize >= 0, `${label}.treeSize must be a safe integer >= 0`);
  assert(typeof sth.rootHash === "string" && sth.rootHash.length >= 10, `${label}.rootHash invalid`);
  requireSha256Tag(sth.rootHash, `${label}.rootHash`);
  assert(typeof sth.timestamp === "string" && isIsoUtc(sth.timestamp), `${label}.timestamp must be ISO UTC (Z)`);
  assert(typeof sth.signature === "string" && sth.signature.length >= 16, `${label}.signature invalid`);
  requireEd25519Tag(sth.signature, `${label}.signature`);
}

function classifySeverity(conflictType: ConflictType): Severity {
  switch (conflictType) {
    case "EQUIVOCATION":
    case "ROLLBACK":
    case "PREFIX_MISMATCH":
      return "CRITICAL";
    case "ANCHOR_DRIFT":
      return "WARN";
    default:
      return "WARN";
  }
}

/* ----------------------- Deterministic Canonicalization ----------------------- */

function normalizeForCanonicalize(x: any, path: string): any {
  const t = typeof x;

  if (x === null) return null;
  if (t === "string") return x;
  if (t === "number") {
    assert(isSafeInt(x), `Non-integer or unsafe number at ${path}`);
    return x;
  }
  if (t === "boolean") return x;

  if (t === "undefined") {
    throw new Error(`Undefined value at ${path} (not allowed)`);
  }
  if (t === "function" || t === "symbol" || t === "bigint") {
    throw new Error(`Unsupported type at ${path}: ${t}`);
  }

  if (Array.isArray(x)) {
    throw new Error(`Arrays are not allowed at ${path} in ConflictProof canonicalization`);
  }

  assert(t === "object", `Unsupported value at ${path}`);

  const obj = x as Record<string, any>;
  const keys = Object.keys(obj).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const out: Record<string, any> = {};
  for (const k of keys) {
    out[k] = normalizeForCanonicalize(obj[k], `${path}.${k}`);
  }
  return out;
}

export function canonicalizeUnsignedPayload(unsignedPayload: Record<string, any>): string {
  const normalized = normalizeForCanonicalize(unsignedPayload, "$");
  return JSON.stringify(normalized);
}

/* ------------------------------ UUID v5 (deterministic) ------------------------------ */

const UUID_V5_NAMESPACE_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; 

function uuidToBytes(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, "");
  assert(hex.length === 32, `Invalid UUID: ${uuid}`);
  return Buffer.from(hex, "hex");
}

function bytesToUuid(bytes: Buffer): string {
  assert(bytes.length === 16, "UUID bytes must be 16");
  const hex = bytes.toString("hex");
  return (
    hex.slice(0, 8) +
    "-" +
    hex.slice(8, 12) +
    "-" +
    hex.slice(12, 16) +
    "-" +
    hex.slice(16, 20) +
    "-" +
    hex.slice(20)
  );
}

function uuidV5(name: string, namespaceUuid: string): string {
  const ns = uuidToBytes(namespaceUuid);
  const nameBytes = Buffer.from(name, "utf8");
  const sha1 = crypto.createHash("sha1").update(ns).update(nameBytes).digest();

  const bytes = Buffer.from(sha1.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return bytesToUuid(bytes);
}

/* ------------------------------ Hashing & Signing ------------------------------ */

export function sha256Hex(inputUtf8: string): string {
  return crypto.createHash("sha256").update(Buffer.from(inputUtf8, "utf8")).digest("hex");
}

export type HubKeyMaterial = {
  privateKeyPem: string; 
  publicKeySpkiPem?: string; 
};

function exportPublicKeySpkiBase64(privateKeyPem: string, publicKeySpkiPem?: string): string {
  const pubKeyObj = publicKeySpkiPem
    ? crypto.createPublicKey(publicKeySpkiPem)
    : crypto.createPublicKey(crypto.createPrivateKey(privateKeyPem));
  const spkiDer = pubKeyObj.export({ type: "spki", format: "der" }) as Buffer;
  return spkiDer.toString("base64");
}

function signEd25519Base64(privateKeyPem: string, messageUtf8: string): string {
  const keyObj = crypto.createPrivateKey(privateKeyPem);
  const sig = crypto.sign(null, Buffer.from(messageUtf8, "utf8"), keyObj);
  return sig.toString("base64");
}

function verifyEd25519(publicKeySpkiBase64: string, messageUtf8: string, signatureBase64: string): boolean {
  const spkiDer = Buffer.from(publicKeySpkiBase64, "base64");
  const pub = crypto.createPublicKey({ key: spkiDer, format: "der", type: "spki" });
  return crypto.verify(null, Buffer.from(messageUtf8, "utf8"), pub, Buffer.from(signatureBase64, "base64"));
}

/* ------------------------------ Core Engine ------------------------------ */

export function generateConflictProof(input: GenerateConflictProofInput, hubKey: HubKeyMaterial): ConflictProof {
  const maxSkewSec = isSafeInt(input.maxTimestampSkewSeconds as any)
    ? (input.maxTimestampSkewSeconds as number)
    : 24 * 60 * 60;

  assert(typeof input.logId === "string" && input.logId.length >= 3, "logId required");
  assert(typeof input.signedByHub === "string" && input.signedByHub.length >= 3, "signedByHub required");

  assert(isIsoUtc(input.detectedAtUtc), "detectedAtUtc must be ISO UTC (Z)");
  validateSth(input.sthA, "sthA");
  validateSth(input.sthB, "sthB");

  const nowMs = Date.now();
  const detectedMs = toUtcMs(input.detectedAtUtc);
  const skewMs = Math.abs(nowMs - detectedMs);
  assert(skewMs <= maxSkewSec * 1000, `detectedAtUtc out of allowed skew (${maxSkewSec}s)`);

  if (input.conflictType === "EQUIVOCATION") {
    assert(input.sthA.treeSize === input.sthB.treeSize, "EQUIVOCATION requires same treeSize");
    assert(input.sthA.rootHash !== input.sthB.rootHash, "EQUIVOCATION requires different rootHash");
  }
  if (input.conflictType === "ROLLBACK") {
    assert(input.sthB.treeSize < input.sthA.treeSize, "ROLLBACK requires treeSize_B < treeSize_A");
  }
  if (input.conflictType === "PREFIX_MISMATCH") {
    assert(input.sthB.treeSize > input.sthA.treeSize, "PREFIX_MISMATCH requires treeSize_B > treeSize_A");
  }

  assert(
    input.verificationResults &&
      typeof input.verificationResults.mismatchField === "string" &&
      typeof input.verificationResults.expected === "string" &&
      typeof input.verificationResults.actual === "string",
    "verificationResults must include mismatchField/expected/actual strings"
  );

  const severity = classifySeverity(input.conflictType);
  const consistencyProofRef = input.consistencyProofRef ?? null;

  const unsignedPayload = {
    conflictType: input.conflictType,
    detectedAtUtc: input.detectedAtUtc,
    logId: input.logId,
    sthA: {
      treeSize: input.sthA.treeSize,
      rootHash: input.sthA.rootHash,
      timestamp: input.sthA.timestamp,
      signature: input.sthA.signature,
    },
    sthB: {
      treeSize: input.sthB.treeSize,
      rootHash: input.sthB.rootHash,
      timestamp: input.sthB.timestamp,
      signature: input.sthB.signature,
    },
    verificationResults: {
      mismatchField: input.verificationResults.mismatchField,
      expected: input.verificationResults.expected,
      actual: input.verificationResults.actual,
    },
    consistencyProofRef,
    severity,
    signedByHub: input.signedByHub,
  } as const;

  const canonicalUnsigned = canonicalizeUnsignedPayload(unsignedPayload as any);
  const conflictHashHex = sha256Hex(canonicalUnsigned);
  const conflictIdUuid = uuidV5(`whenisdue:conflict:${conflictHashHex}`, UUID_V5_NAMESPACE_DNS);

  assert(typeof hubKey.privateKeyPem === "string" && hubKey.privateKeyPem.includes("PRIVATE KEY"), "privateKeyPem invalid");
  const pubKeyB64 = exportPublicKeySpkiBase64(hubKey.privateKeyPem, hubKey.publicKeySpkiPem);
  const sigB64 = signEd25519Base64(hubKey.privateKeyPem, canonicalUnsigned);

  const proof: ConflictProof = {
    conflictId: `urn:uuid:${conflictIdUuid}`,
    conflictHash: `sha256:${conflictHashHex}`,
    conflictType: input.conflictType,
    detectedAtUtc: input.detectedAtUtc,
    logId: input.logId,
    sthA: input.sthA,
    sthB: input.sthB,
    verificationResults: input.verificationResults,
    consistencyProofRef,
    severity,
    signedByHub: input.signedByHub,
    signature: {
      pubKey: `Ed25519:${pubKeyB64}`,
      value: `Ed25519:${sigB64}`,
    },
  };

  assert(
    verifyConflictProof(proof),
    "Self-verification failed (this should never happen; indicates key/canonicalization mismatch)"
  );

  return proof;
}

export function verifyConflictProof(proof: ConflictProof): boolean {
  try {
    assert(proof && typeof proof === "object", "proof must be object");
    assert(typeof proof.conflictHash === "string" && proof.conflictHash.startsWith("sha256:"), "conflictHash invalid");
    assert(typeof proof.conflictId === "string" && proof.conflictId.startsWith("urn:uuid:"), "conflictId invalid");
    assert(typeof proof.logId === "string" && proof.logId.length >= 3, "logId invalid");
    assert(isIsoUtc(proof.detectedAtUtc), "detectedAtUtc invalid");
    validateSth(proof.sthA, "sthA");
    validateSth(proof.sthB, "sthB");

    requireEd25519Tag(proof.signature?.pubKey, "signature.pubKey");
    requireEd25519Tag(proof.signature?.value, "signature.value");

    const unsignedPayload = {
      conflictType: proof.conflictType,
      detectedAtUtc: proof.detectedAtUtc,
      logId: proof.logId,
      sthA: {
        treeSize: proof.sthA.treeSize,
        rootHash: proof.sthA.rootHash,
        timestamp: proof.sthA.timestamp,
        signature: proof.sthA.signature,
      },
      sthB: {
        treeSize: proof.sthB.treeSize,
        rootHash: proof.sthB.rootHash,
        timestamp: proof.sthB.timestamp,
        signature: proof.sthB.signature,
      },
      verificationResults: {
        mismatchField: proof.verificationResults.mismatchField,
        expected: proof.verificationResults.expected,
        actual: proof.verificationResults.actual,
      },
      consistencyProofRef: proof.consistencyProofRef ?? null,
      severity: proof.severity,
      signedByHub: proof.signedByHub,
    } as const;

    const canonicalUnsigned = canonicalizeUnsignedPayload(unsignedPayload as any);
    const conflictHashHex = sha256Hex(canonicalUnsigned);

    const expectedHash = `sha256:${conflictHashHex}`;
    if (proof.conflictHash !== expectedHash) return false;

    const expectedUuid = uuidV5(`whenisdue:conflict:${conflictHashHex}`, UUID_V5_NAMESPACE_DNS);
    const expectedId = `urn:uuid:${expectedUuid}`;
    if (proof.conflictId !== expectedId) return false;

    const pubKeyB64 = proof.signature.pubKey.slice("Ed25519:".length);
    const sigB64 = proof.signature.value.slice("Ed25519:".length);

    return verifyEd25519(pubKeyB64, canonicalUnsigned, sigB64);
  } catch {
    return false;
  }
}

export function parseConflictProof(jsonText: string): ConflictProof {
  const obj = JSON.parse(jsonText);
  return obj as ConflictProof;
}

export function serializeConflictProof(proof: ConflictProof): string {
  const normalized = normalizeForCanonicalize(proof, "$");
  return JSON.stringify(normalized);
}