// @ts-nocheck
/* eslint-disable no-console */
import crypto from "crypto";

export type HashAlg = "sha256";
export type Serialization = "rfc8785";

export type HealthState = "GREEN" | "AMBER" | "RED" | "CRITICAL";

export type PrimarySTH = {
  origin: string; 
  treeSize: number;
  rootHash: string; 
  timestamp: string; 
  signature: string; 
};

export type QuorumPolicy = {
  required: number; 
  total: number; 
  minWitnessAgeHours: number;
};

export type WitnessEntry = {
  witnessId: string; 
  publicKey: string; 
  endpoint?: string; 
  role?: "WITNESS" | "MONITOR";
  label?: string;
};

export type WitnessSignature = {
  witnessId: string;
  signature: string; 
  observedAtUtc: string; 
};

export type WitnessedSTHArtifact = {
  primarySTH: PrimarySTH;
  quorumPolicy: QuorumPolicy;
  witnesses: Array<
    {
      witnessId: string;
      publicKey: string;
      endpoint?: string;
      label?: string;
      role?: "WITNESS" | "MONITOR";
      signature?: string;
      observedAtUtc?: string;
      signatureValid: boolean;
      eligible: boolean;
      reason?: string;
    }
  >;
  validWitnessCount: number;
  healthState: HealthState;
  healthReason: string;
  hashAlgorithm: HashAlg;
  serialization: Serialization;
};

export type TrustContractSnapshot = {
  registry?: {
    logPublicKey?: string; 
  };
  quorumPolicy?: Partial<QuorumPolicy>;
  witnesses?: WitnessEntry[];
};

export type WitnessQuorumEngineInput = {
  primarySTH: PrimarySTH;
  trust: TrustContractSnapshot;
  witnessSignatures: WitnessSignature[]; 
  nowUtc: string; 
};

export class WitnessQuorumEngine {
  static buildWitnessedArtifact(input: WitnessQuorumEngineInput): WitnessedSTHArtifact {
    const { primarySTH, trust, witnessSignatures, nowUtc } = input;

    const policy: QuorumPolicy = {
      required: clampInt(trust.quorumPolicy?.required ?? 3, 1, 999),
      total: clampInt(trust.quorumPolicy?.total ?? 5, 1, 999),
      minWitnessAgeHours: clampInt(trust.quorumPolicy?.minWitnessAgeHours ?? 24, 0, 9999),
    };

    if (policy.required < 2) policy.required = 2;

    const primaryPub = trust.registry?.logPublicKey;
    if (!primaryPub) {
      return buildCritical(primarySTH, policy, trust.witnesses ?? [], witnessSignatures, "Missing trust.registry.logPublicKey", nowUtc);
    }

    const primaryBlob = WitnessQuorumEngine.primaryStateBlob(primarySTH);

    const primaryOk = verifyEd25519Detached(primaryPub, primaryBlob, primarySTH.signature);
    if (!primaryOk) {
      return buildCritical(primarySTH, policy, trust.witnesses ?? [], witnessSignatures, "Primary STH signature invalid", nowUtc);
    }

    const trustedWitnesses = (trust.witnesses ?? []).slice().sort((a, b) => a.witnessId.localeCompare(b.witnessId));

    const sigById = new Map<string, WitnessSignature>();
    for (const s of witnessSignatures.slice().sort((a, b) => {
      const c = a.witnessId.localeCompare(b.witnessId);
      if (c !== 0) return c;
      return a.observedAtUtc.localeCompare(b.observedAtUtc);
    })) {
      const prev = sigById.get(s.witnessId);
      if (!prev || prev.observedAtUtc < s.observedAtUtc) sigById.set(s.witnessId, s);
    }

    const nowMs = Date.parse(nowUtc);
    const minAgeMs = policy.minWitnessAgeHours * 60 * 60 * 1000;

    let validCount = 0;

    const witnessStatus = trustedWitnesses.map((w) => {
      const s = sigById.get(w.witnessId);

      let eligible = true;
      let reason = "";

      if (!Number.isFinite(nowMs)) {
        eligible = false;
        reason = "Invalid nowUtc";
      }

      let observedMs = NaN;
      if (s?.observedAtUtc) observedMs = Date.parse(s.observedAtUtc);

      if (eligible) {
        if (!s) {
          eligible = false;
          reason = "No signature submitted";
        } else if (!Number.isFinite(observedMs)) {
          eligible = false;
          reason = "Invalid observedAtUtc";
        } else {
          const ageMs = Math.max(0, nowMs - observedMs);
          if (ageMs < minAgeMs) {
            eligible = false;
            reason = `Witness age below min (${policy.minWitnessAgeHours}h)`;
          }
        }
      }

      const sigOk =
        eligible && s
          ? verifyEd25519Detached(w.publicKey, primaryBlob, s.signature)
          : false;

      if (sigOk) validCount += 1;

      return {
        witnessId: w.witnessId,
        publicKey: w.publicKey,
        endpoint: w.endpoint,
        label: w.label,
        role: w.role,
        signature: s?.signature,
        observedAtUtc: s?.observedAtUtc,
        signatureValid: sigOk,
        eligible,
        reason: sigOk ? undefined : reason || "Signature invalid",
      };
    });

    const { state, why } = computeHealthState(primarySTH, witnessStatus, policy);

    return {
      primarySTH,
      quorumPolicy: policy,
      witnesses: witnessStatus,
      validWitnessCount: validCount,
      healthState: state,
      healthReason: why,
      hashAlgorithm: "sha256",
      serialization: "rfc8785",
    };
  }

  static primaryStateBlob(primary: Pick<PrimarySTH, "origin" | "treeSize" | "rootHash" | "timestamp">): Uint8Array {
    const obj = {
      origin: String(primary.origin),
      treeSize: toSafeInt(primary.treeSize),
      rootHash: String(primary.rootHash),
      timestamp: String(primary.timestamp),
    };
    const jcs = jcsSerialize(obj);
    return Buffer.from(jcs, "utf8");
  }
}

/* ----------------------------- Health Logic ----------------------------- */

function computeHealthState(
  primary: PrimarySTH,
  witnessRows: Array<{ witnessId: string; signatureValid: boolean; eligible: boolean } & Record<string, unknown>>,
  policy: QuorumPolicy
): { state: HealthState; why: string } {
  const validWitnesses = witnessRows.filter((w) => w.signatureValid && w.eligible);

  if (policy.total !== witnessRows.length) {
    return {
      state: "AMBER",
      why: `Trust contract witness count (${witnessRows.length}) != quorumPolicy.total (${policy.total})`,
    };
  }

  if (validWitnesses.length >= policy.required) {
    return { state: "GREEN", why: `Quorum met: ${validWitnesses.length} of ${policy.total} witnesses validated` };
  }

  if (validWitnesses.length >= 1) {
    return {
      state: "AMBER",
      why: `Quorum not met: ${validWitnesses.length} of ${policy.required} required witnesses validated`,
    };
  }

  return {
    state: "AMBER",
    why: "No eligible witness signatures validated (primary STH valid)",
  };
}

function buildCritical(
  primarySTH: PrimarySTH,
  policy: QuorumPolicy,
  trustedWitnesses: WitnessEntry[],
  witnessSignatures: WitnessSignature[],
  reason: string,
  nowUtc: string
): WitnessedSTHArtifact {
  const sigById = new Map<string, WitnessSignature>();
  for (const s of witnessSignatures.slice().sort((a, b) => {
    const c = a.witnessId.localeCompare(b.witnessId);
    if (c !== 0) return c;
    return a.observedAtUtc.localeCompare(b.observedAtUtc);
  })) {
    const prev = sigById.get(s.witnessId);
    if (!prev || prev.observedAtUtc < s.observedAtUtc) sigById.set(s.witnessId, s);
  }

  const witnessRows = trustedWitnesses
    .slice()
    .sort((a, b) => a.witnessId.localeCompare(b.witnessId))
    .map((w) => {
      const s = sigById.get(w.witnessId);
      return {
        witnessId: w.witnessId,
        publicKey: w.publicKey,
        endpoint: w.endpoint,
        label: w.label,
        role: w.role,
        signature: s?.signature,
        observedAtUtc: s?.observedAtUtc,
        signatureValid: false,
        eligible: false,
        reason: "Engine CRITICAL state",
      };
    });

  return {
    primarySTH,
    quorumPolicy: policy,
    witnesses: witnessRows,
    validWitnessCount: 0,
    healthState: "CRITICAL",
    healthReason: `${reason} (nowUtc=${nowUtc})`,
    hashAlgorithm: "sha256",
    serialization: "rfc8785",
  };
}

/* ------------------------------ Crypto Utils ----------------------------- */

export function verifyEd25519Detached(pubKey: string, message: Uint8Array, signature: string): boolean {
  try {
    const pubRaw = decodeEd25519(pubKey);
    const sigRaw = decodeEd25519(signature);

    if (pubRaw.length !== 32) return false;
    if (sigRaw.length !== 64) return false;

    const pem = ed25519RawPublicKeyToSpkiPem(pubRaw);
    const key = crypto.createPublicKey(pem);

    return crypto.verify(null, Buffer.from(message), key, Buffer.from(sigRaw));
  } catch {
    return false;
  }
}

function decodeEd25519(v: string): Buffer {
  const s = v.startsWith("ed25519:") ? v.slice("ed25519:".length) : v;
  return Buffer.from(s, "base64");
}

function ed25519RawPublicKeyToSpkiPem(raw32: Buffer): string {
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  const der = Buffer.concat([prefix, raw32]);
  const b64 = der.toString("base64");
  const lines = b64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----\n`;
}

/* ------------------------------ RFC 8785 JCS ----------------------------- */

export function jcsSerialize(value: unknown): string {
  return jcsStringify(value);
}

function jcsStringify(value: unknown): string {
  if (value === null) return "null";

  const t = typeof value;

  if (t === "string") return JSON.stringify(value);
  if (t === "boolean") return value ? "true" : "false";

  if (t === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite number not allowed in JCS");
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const parts = value.map((v) => jcsStringify(v));
    return `[${parts.join(",")}]`;
  }

  if (t === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const parts: string[] = [];
    for (const k of keys) {
      const v = obj[k];
      if (v === undefined) throw new Error("Undefined not allowed in JCS");
      parts.push(`${JSON.stringify(k)}:${jcsStringify(v)}`);
    }
    return `{${parts.join(",")}}`;
  }

  throw new Error(`Unsupported type in JCS: ${t}`);
}

/* ------------------------------ Small Helpers ---------------------------- */

function toSafeInt(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.trunc(x);
}

function clampInt(n: unknown, min: number, max: number): number {
  const x = toSafeInt(n);
  return Math.min(max, Math.max(min, x));
}