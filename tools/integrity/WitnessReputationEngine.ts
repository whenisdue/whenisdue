// @ts-nocheck
/* eslint-disable no-console */
/**
 * WitnessReputationEngine.ts
 *
 * Phase 19 — Deliverable 2 (File 1)
 */

import crypto from "crypto";

export type WitnessStatus = "PENDING" | "QUALIFIED" | "ACTIVE" | "RETIRED";

export type WitnessDirectoryEntry = {
  witnessId: string; 
  publicKey: string; 
  status: WitnessStatus;
  notBeforeUtc?: string | null;
  firstSeenUtc?: string | null;

  infraProvider?: string | null; 
  asn?: string | null; 
  domainRoot?: string | null; 
};

export type WitnessPerformanceCounters = {
  witnessId: string;

  signedCheckpoints: number;
  missedCheckpoints: number;

  conflictFlags: number; 
  anchorParticipationCount: number; 
  lastSeenUtc: string | null; 

  keyContinuityOk?: boolean; 
};

export type ReputationPolicy = {
  schemaVersion: 1;

  lambdaDecayPerDay: number; 
  probationMaxWeight: number; 
  anchorMinEventsForFullWeight: number; 

  providerCapFraction: number; 
  asnCapFraction: number; 
  domainCloneThrottle: boolean; 
  minActiveForQuorum: number; 

  weightDecimals: number; 

  computedAtUtc: string; 
};

export type WitnessWeightResult = {
  witnessId: string;
  status: WitnessStatus;
  weight: number; 
  components: {
    consistency: number; 
    longevity: number; 
    decay: number; 
    raw: number; 
  };
  flags: {
    probationary: boolean;
    collapsed: boolean;
    missingTelemetry: boolean;
  };
};

export type ReputationEpoch = {
  schemaVersion: 1;
  computedAtUtc: string;
  policy: Omit<ReputationPolicy, "computedAtUtc">;
  witnesses: Record<string, number>; 
  results: WitnessWeightResult[]; 
  canonicalHashSha256: string;
};

function toFiniteNonNegInt(n: any): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return x <= 0 ? 0 : Math.floor(x);
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function quantize(x: number, decimals: number): number {
  const d = toFiniteNonNegInt(decimals);
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}

function parseUtcMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

function daysBetween(aMs: number, bMs: number): number {
  const diff = bMs - aMs;
  if (!Number.isFinite(diff)) return 0;
  return diff <= 0 ? 0 : diff / (1000 * 60 * 60 * 24);
}

function sha256HexUtf8(s: string): string {
  return crypto.createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
}

function jcsStringify(value: any): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "string") return JSON.stringify(value);
  if (t === "number") {
    if (!Number.isFinite(value)) return "null";
    return JSON.stringify(value);
  }
  if (t === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `[${value.map(jcsStringify).join(",")}]`;
  if (t === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${jcsStringify(value[k])}`).join(",")}}`;
  }
  return "null";
}

function computeConsistency(signed: number, missed: number): number {
  const s = toFiniteNonNegInt(signed);
  const m = toFiniteNonNegInt(missed);
  const denom = s + m;
  if (denom <= 0) return 0;
  return clamp01(s / denom);
}

function computeLongevity(daysActive: number): number {
  if (!Number.isFinite(daysActive) || daysActive <= 0) return 0;
  const l = Math.log10(daysActive + 1);
  return clamp01(l);
}

function computeDecay(lambda: number, inactivityDays: number): number {
  const lam = Number.isFinite(lambda) && lambda > 0 ? lambda : 0;
  const d = Number.isFinite(inactivityDays) && inactivityDays > 0 ? inactivityDays : 0;
  const v = Math.exp(-lam * d);
  return clamp01(v);
}

function applyDiversityAdjustments(
  results: WitnessWeightResult[],
  dirById: Map<string, WitnessDirectoryEntry>,
  policy: ReputationPolicy
): WitnessWeightResult[] {
  let adjusted = results.map((r) => ({ ...r, components: { ...r.components }, flags: { ...r.flags } }));

  if (policy.domainCloneThrottle) {
    const domainCounts = new Map<string, number>();
    for (const r of adjusted) {
      const d = dirById.get(r.witnessId)?.domainRoot || null;
      if (!d) continue;
      domainCounts.set(d, (domainCounts.get(d) || 0) + 1);
    }
    adjusted = adjusted.map((r) => {
      const d = dirById.get(r.witnessId)?.domainRoot || null;
      const n = d ? domainCounts.get(d) || 1 : 1;
      if (n <= 1) return r;
      const w = clamp01(r.weight / n);
      return { ...r, weight: w };
    });
  }

  const providerCap = clamp01(policy.providerCapFraction);
  if (providerCap > 0) {
    const total = adjusted.reduce((acc, r) => acc + r.weight, 0);
    if (total > 0) {
      const byProv = new Map<string, number>();
      for (const r of adjusted) {
        const p = dirById.get(r.witnessId)?.infraProvider || null;
        if (!p) continue;
        byProv.set(p, (byProv.get(p) || 0) + r.weight);
      }
      const maxAllowed = total * providerCap;
      for (const [prov, sum] of byProv.entries()) {
        if (sum <= maxAllowed) continue;
        const scale = maxAllowed / sum;
        adjusted = adjusted.map((r) => {
          const p = dirById.get(r.witnessId)?.infraProvider || null;
          if (p !== prov) return r;
          return { ...r, weight: clamp01(r.weight * scale) };
        });
      }
    }
  }

  const asnCap = clamp01(policy.asnCapFraction);
  if (asnCap > 0) {
    const total = adjusted.reduce((acc, r) => acc + r.weight, 0);
    if (total > 0) {
      const byAsn = new Map<string, number>();
      for (const r of adjusted) {
        const a = dirById.get(r.witnessId)?.asn || null;
        if (!a) continue;
        byAsn.set(a, (byAsn.get(a) || 0) + r.weight);
      }
      const maxAllowed = total * asnCap;
      for (const [asn, sum] of byAsn.entries()) {
        if (sum <= maxAllowed) continue;
        const scale = maxAllowed / sum;
        adjusted = adjusted.map((r) => {
          const a = dirById.get(r.witnessId)?.asn || null;
          if (a !== asn) return r;
          return { ...r, weight: clamp01(r.weight * scale) };
        });
      }
    }
  }

  adjusted = adjusted.map((r) => ({ ...r, weight: quantize(clamp01(r.weight), policy.weightDecimals) }));
  return adjusted;
}

export class WitnessReputationEngine {
  static computeEpoch(input: {
    directory: WitnessDirectoryEntry[];
    counters: WitnessPerformanceCounters[];
    policy: ReputationPolicy;
  }): ReputationEpoch {
    const policy = input.policy;

    const dirSorted = [...input.directory].sort((a, b) => a.witnessId.localeCompare(b.witnessId));
    const dirById = new Map<string, WitnessDirectoryEntry>();
    for (const d of dirSorted) dirById.set(d.witnessId, d);

    const countersById = new Map<string, WitnessPerformanceCounters>();
    for (const c of input.counters) countersById.set(c.witnessId, c);

    const nowMs = parseUtcMs(policy.computedAtUtc) ?? Date.now();

    const resultsRaw: WitnessWeightResult[] = [];

    for (const d of dirSorted) {
      const c = countersById.get(d.witnessId);

      const missingTelemetry = !c;
      const signed = toFiniteNonNegInt(c?.signedCheckpoints ?? 0);
      const missed = toFiniteNonNegInt(c?.missedCheckpoints ?? 0);
      const conflictFlags = toFiniteNonNegInt(c?.conflictFlags ?? 0);
      const anchorCount = toFiniteNonNegInt(c?.anchorParticipationCount ?? 0);
      const keyContinuityOk = c?.keyContinuityOk !== false;

      const consistency = computeConsistency(signed, missed);

      const firstSeenMs = parseUtcMs(d.firstSeenUtc ?? null);
      const daysActive = firstSeenMs ? daysBetween(firstSeenMs, nowMs) : 0;
      const longevity = computeLongevity(daysActive);

      const lastSeenMs = parseUtcMs(c?.lastSeenUtc ?? null);
      const inactivityDays = lastSeenMs ? daysBetween(lastSeenMs, nowMs) : 0;
      const decay = computeDecay(policy.lambdaDecayPerDay, inactivityDays);

      let raw = clamp01(consistency * longevity * decay);

      let collapsed = false;
      if (conflictFlags > 0) {
        raw = 0;
        collapsed = true;
      }
      if (!keyContinuityOk) {
        raw = Math.min(raw, policy.probationMaxWeight);
      }

      const probationary = anchorCount < policy.anchorMinEventsForFullWeight;
      if (probationary) {
        raw = Math.min(raw, policy.probationMaxWeight);
      }

      let weight = raw;
      if (d.status === "RETIRED") weight = 0;

      weight = quantize(clamp01(weight), policy.weightDecimals);

      resultsRaw.push({
        witnessId: d.witnessId,
        status: d.status,
        weight,
        components: {
          consistency: quantize(consistency, policy.weightDecimals),
          longevity: quantize(longevity, policy.weightDecimals),
          decay: quantize(decay, policy.weightDecimals),
          raw: quantize(raw, policy.weightDecimals),
        },
        flags: {
          probationary,
          collapsed,
          missingTelemetry,
        },
      });
    }

    const resultsAdjusted = applyDiversityAdjustments(resultsRaw, dirById, policy);

    const witnesses: Record<string, number> = {};
    for (const r of resultsAdjusted) witnesses[r.witnessId] = r.weight;

    const canonical = jcsStringify({
      schemaVersion: 1,
      computedAtUtc: policy.computedAtUtc,
      policy: {
        schemaVersion: 1,
        lambdaDecayPerDay: policy.lambdaDecayPerDay,
        probationMaxWeight: policy.probationMaxWeight,
        anchorMinEventsForFullWeight: policy.anchorMinEventsForFullWeight,
        providerCapFraction: policy.providerCapFraction,
        asnCapFraction: policy.asnCapFraction,
        domainCloneThrottle: policy.domainCloneThrottle,
        minActiveForQuorum: policy.minActiveForQuorum,
        weightDecimals: policy.weightDecimals,
      },
      witnesses,
    });

    const canonicalHashSha256 = sha256HexUtf8(canonical);

    return {
      schemaVersion: 1,
      computedAtUtc: policy.computedAtUtc,
      policy: {
        schemaVersion: 1,
        lambdaDecayPerDay: policy.lambdaDecayPerDay,
        probationMaxWeight: policy.probationMaxWeight,
        anchorMinEventsForFullWeight: policy.anchorMinEventsForFullWeight,
        providerCapFraction: policy.providerCapFraction,
        asnCapFraction: policy.asnCapFraction,
        domainCloneThrottle: policy.domainCloneThrottle,
        minActiveForQuorum: policy.minActiveForQuorum,
        weightDecimals: policy.weightDecimals,
      },
      witnesses,
      results: resultsAdjusted.sort((a, b) => a.witnessId.localeCompare(b.witnessId)),
      canonicalHashSha256,
    };
  }

  static computeWeightedQuorumScore(input: {
    epoch: ReputationEpoch;
    signerIds: string[];
    eligibleStatuses?: WitnessStatus[]; 
  }): { score: number; signedWeight: number; totalEligibleWeight: number } {
    const eligible = input.eligibleStatuses ?? ["ACTIVE", "QUALIFIED"];
    const signerSet = new Set(input.signerIds);

    let signedWeight = 0;
    let total = 0;

    for (const r of input.epoch.results) {
      if (!eligible.includes(r.status)) continue;
      total += r.weight;
      if (signerSet.has(r.witnessId)) signedWeight += r.weight;
    }

    const score = total > 0 ? clamp01(signedWeight / total) : 0;
    return {
      score: quantize(score, 4),
      signedWeight: quantize(signedWeight, 4),
      totalEligibleWeight: quantize(total, 4),
    };
  }
}