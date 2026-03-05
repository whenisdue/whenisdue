// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TrustVerdictEngine.ts
 * Deterministic citeability scoring (0–100) + signed trustVerdict.json emission.
 */

import crypto from "crypto";

export type TrustStatus = "PASS" | "WARN" | "FAIL";

export type AnchorSource = "TRANSPARENCY_LOG" | "DNS" | "GITHUB" | "REKOR" | "OTHER";

export interface TrustVerdictInputs {
  recordId: string;
  registryVersion: number; 
  computedAtUtc: string; 

  witnessValidCount: number;
  witnessThreshold: number; 
  witnessTotal: number; 

  hasTransparencyInclusionProof: boolean; 
  hasPrimarySystemAnchor: boolean; 
  hasRedundantAnchor: boolean; 
  activeAnchorSources: AnchorSource[]; 

  rfc3161PresentAndValid: boolean;
  ltvEvidencePresent: boolean;

  mirrorCount: number;
  diversityCoefficient: number; 

  secondsSinceLastCheck: number; 

  hasActiveConflictProof: boolean;

  evidenceRefs?: {
    sth?: string;
    quorum?: string;
    anchors?: string[];
    tsas?: string;
    conflicts?: string | null;
    mirrors?: string[];
  };
}

export interface TrustVerdict {
  recordId: string;
  registryVersion: number;

  citeabilityScore: number; 
  status: TrustStatus;

  factors: {
    witnessQuorum: { pointsEarned: number; count: number; threshold: number; total: number };
    anchors: { pointsEarned: number; activeSources: AnchorSource[] };
    temporalIntegrity: { pointsEarned: number; rfc3161Present: boolean; ltvEvidencePresent: boolean };
    persistence: { pointsEarned: number; diversityCoefficient: number; mirrorCount: number };
    verificationRecency: { pointsEarned: number; secondsSinceLastCheck: number };
  };

  tieBreakers: {
    timePoints: number; 
    lastVerifiedRank: number; 
    sthHashTie?: string; 
  };

  evidenceRefs: {
    sth: string | null;
    quorum: string | null;
    anchors: string[];
    tsas: string | null;
    conflicts: string | null;
    mirrors: string[];
  };

  computedAtUtc: string;

  signature?: {
    type: "Ed25519";
    value: string;
    trustServiceId: string;
    keyId?: string;
  };
}

export interface SignOptions {
  ed25519PrivateKeyPem: string; 
  trustServiceId: string;
  keyId?: string;
}

export function computeTrustVerdict(input: TrustVerdictInputs): TrustVerdict {
  const witnessCount = toInt0(input.witnessValidCount);
  const witnessThreshold = Math.max(1, toInt0(input.witnessThreshold));
  const witnessTotal = Math.max(0, toInt0(input.witnessTotal));

  const diversity = clamp01(input.diversityCoefficient);
  const secondsSince = Math.max(0, toInt0(input.secondsSinceLastCheck));

  let quorumPoints = 30 * Math.min(1, witnessCount / witnessThreshold);
  quorumPoints = clamp0_100(quorumPoints);

  let anchorPoints = 0;
  if (input.hasTransparencyInclusionProof) anchorPoints += 10;
  if (input.hasPrimarySystemAnchor) anchorPoints += 10;
  if (input.hasRedundantAnchor) anchorPoints += 5;

  let timePoints = 0;
  if (input.rfc3161PresentAndValid) timePoints += 10;
  if (input.ltvEvidencePresent) timePoints += 10;

  let persistencePoints = 15 * diversity;
  persistencePoints = clamp0_100(persistencePoints);

  const recencyPoints = Math.max(0, 10 - Math.floor(secondsSince / 3600));

  let scorePre =
    roundToInt(quorumPoints) +
    roundToInt(anchorPoints) +
    roundToInt(timePoints) +
    roundToInt(persistencePoints) +
    roundToInt(recencyPoints);

  scorePre = clamp0_100(scorePre);

  if (input.hasActiveConflictProof) {
    scorePre = 0;
  } else {
    if (witnessCount < 1) scorePre = Math.min(scorePre, 40);
    if (anchorPoints === 0) scorePre = Math.max(0, scorePre - 20);
  }

  let status: TrustStatus;
  if (input.hasActiveConflictProof || scorePre < 50) status = "FAIL";
  else if (scorePre >= 70) status = "PASS";
  else status = "WARN";

  const activeSources = uniqAnchors(input.activeAnchorSources || []);

  const verdict: TrustVerdict = {
    recordId: input.recordId,
    registryVersion: toInt0(input.registryVersion),
    citeabilityScore: clamp0_100(toInt0(scorePre)),
    status,
    factors: {
      witnessQuorum: {
        pointsEarned: roundToInt(quorumPoints),
        count: witnessCount,
        threshold: witnessThreshold,
        total: witnessTotal,
      },
      anchors: { pointsEarned: roundToInt(anchorPoints), activeSources },
      temporalIntegrity: {
        pointsEarned: roundToInt(timePoints),
        rfc3161Present: !!input.rfc3161PresentAndValid,
        ltvEvidencePresent: !!input.ltvEvidencePresent,
      },
      persistence: {
        pointsEarned: roundToInt(persistencePoints),
        diversityCoefficient: diversity,
        mirrorCount: Math.max(0, toInt0(input.mirrorCount)),
      },
      verificationRecency: {
        pointsEarned: roundToInt(recencyPoints),
        secondsSinceLastCheck: secondsSince,
      },
    },
    tieBreakers: {
      timePoints: roundToInt(timePoints),
      lastVerifiedRank: deriveLastVerifiedRank(secondsSince),
      sthHashTie: input.evidenceRefs?.sth ? stableHexTie(input.evidenceRefs.sth) : undefined,
    },
    evidenceRefs: {
      sth: input.evidenceRefs?.sth ?? null,
      quorum: input.evidenceRefs?.quorum ?? null,
      anchors: input.evidenceRefs?.anchors ?? [],
      tsas: input.evidenceRefs?.tsas ?? null,
      conflicts: input.evidenceRefs?.conflicts ?? null,
      mirrors: input.evidenceRefs?.mirrors ?? [],
    },
    computedAtUtc: input.computedAtUtc,
  };

  return verdict;
}

export function signTrustVerdict(verdict: TrustVerdict, opts: SignOptions): TrustVerdict {
  const unsigned = { ...verdict };
  delete (unsigned as any).signature;

  const canonical = canonicalizeJson(unsigned);
  const msg = Buffer.from(canonical, "utf8");

  const sig = crypto.sign(null, msg, opts.ed25519PrivateKeyPem);
  const value = sig.toString("base64");

  return {
    ...verdict,
    signature: {
      type: "Ed25519",
      value,
      trustServiceId: opts.trustServiceId,
      keyId: opts.keyId,
    },
  };
}

export function verifyTrustVerdictSignature(
  verdict: TrustVerdict,
  ed25519PublicKeyPem: string
): boolean {
  if (!verdict.signature?.value) return false;
  const sig = Buffer.from(verdict.signature.value, "base64");

  const unsigned = { ...verdict };
  delete (unsigned as any).signature;

  const canonical = canonicalizeJson(unsigned);
  const msg = Buffer.from(canonical, "utf8");
  return crypto.verify(null, msg, ed25519PublicKeyPem, sig);
}

/* ----------------------------- Deterministic helpers ----------------------------- */

function toInt0(n: any): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.trunc(x);
}

function clamp01(x: any): number {
  const n = typeof x === "number" ? x : Number(x);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function clamp0_100(x: any): number {
  const n = typeof x === "number" ? x : Number(x);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function roundToInt(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.round(x);
}

function uniqAnchors(arr: AnchorSource[]): AnchorSource[] {
  const seen = new Set<string>();
  const out: AnchorSource[] = [];
  for (const a of arr) {
    const k = String(a);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(a);
    }
  }
  out.sort(); 
  return out;
}

function deriveLastVerifiedRank(secondsSinceLastCheck: number): number {
  if (secondsSinceLastCheck < 3600) return 0;
  if (secondsSinceLastCheck < 86400) return 1;
  if (secondsSinceLastCheck < 86400 * 7) return 2;
  return 3;
}

function stableHexTie(s: string): string {
  return String(s).trim().toLowerCase();
}

export function canonicalizeJson(value: any): string {
  return canonicalizeAny(value);
}

function canonicalizeAny(v: any): string {
  if (v === null) return "null";

  const t = typeof v;
  if (t === "boolean") return v ? "true" : "false";
  if (t === "string") return JSON.stringify(v);

  if (t === "number") {
    if (!Number.isFinite(v)) throw new Error("Non-finite number rejected by canonicalizeJson()");
    return String(v);
  }

  if (Array.isArray(v)) {
    let out = "[";
    for (let i = 0; i < v.length; i++) {
      if (i) out += ",";
      out += canonicalizeAny(v[i]);
    }
    out += "]";
    return out;
  }

  if (t === "object") {
    const keys = Object.keys(v).sort();
    let out = "{";
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (i) out += ",";
      out += JSON.stringify(k);
      out += ":";
      out += canonicalizeAny(v[k]);
    }
    out += "}";
    return out;
  }

  throw new Error(`Unsupported type in canonicalizeJson(): ${t}`);
}

export function sha256HexOfCanonicalJson(value: any): string {
  const canon = canonicalizeJson(value);
  return crypto.createHash("sha256").update(Buffer.from(canon, "utf8")).digest("hex");
}