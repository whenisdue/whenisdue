import { useState, useEffect, useCallback } from "react";

// --- Shared Types ---
export type PageLight = "NEUTRAL" | "GREEN" | "AMBER" | "RED";
export type ConflictSeverity = "RED" | "AMBER" | "RESOLVED" | "UNKNOWN";
export type ConflictReasonCode =
  | "OK"
  | "CONFLICT_INDEX_UNAVAILABLE"
  | "CONFLICT_PROOF_UNAVAILABLE"
  | "CONFLICT_PROOF_MALFORMED"
  | "CONFLICT_HASH_MISMATCH"
  | "STH_SIGNATURE_UNVERIFIED"
  | "STH_SIGNATURE_INVALID"
  | "QUARANTINE_UNAVAILABLE"
  | "TRUST_CONTRACT_UNAVAILABLE"
  | "CONSISTENCY_PROOF_MISSING"
  | "CONSISTENCY_PROOF_FAIL"
  | "IMPACT_UNKNOWN";

// --- Directory Types ---
export interface DirectoryBannerModel {
  light: PageLight;
  activeRedCount: number;
  activeAmberCount: number;
  resolvedCount?: number;
  updatedAtUtc?: string;
  message: string;
}

export interface ConflictRowModel {
  conflictId: string;
  conflictType: "EQUIVOCATION" | "ROLLBACK" | "PREFIX_MISMATCH" | "UNKNOWN";
  severity: ConflictSeverity;
  detectedAtUtc?: string;
  detectedBy?: string;
  logId?: string;
  href: string;
}

export type ConflictsDirectoryState =
  | { kind: "LOADING"; step: "FETCH_INDEX" | "FETCH_QUARANTINE" | "FETCH_TRUST" | "COMPUTE" }
  | {
      kind: "READY";
      banner: DirectoryBannerModel;
      table: ConflictRowModel[];
      quarantine: any; // QuarantineUi subset
      reasons: Array<{ code: ConflictReasonCode; detail?: string }>;
    }
  | {
      kind: "FAILED";
      banner: DirectoryBannerModel;
      reasons: Array<{ code: ConflictReasonCode; detail?: string }>;
      error: { code: string; message: string };
    };

// --- Detail Types ---
export interface ConflictVerdictModel {
  severity: ConflictSeverity;
  light: PageLight;
  label: "VALIDATED_CONFLICT" | "INDETERMINATE" | "INVALID_PROOF";
  conflictType: "EQUIVOCATION" | "ROLLBACK" | "PREFIX_MISMATCH" | "UNKNOWN";
  canonicalConflictHash?: string;
  collapseRuleApplies: boolean;
  message: string;
}

export interface SthCardModel {
  treeSize: number | null;
  rootHash: string | null;
  signature: string | null;
  signatureStatus: "PASS" | "FAIL" | "UNVERIFIED";
}

export interface SideBySideCompareModel {
  sthA: SthCardModel;
  sthB: SthCardModel;
  highlights: Array<{ field: "treeSize" | "rootHash" | "signature"; note: string }>;
  divergenceRule: "SAME_SIZE_DIFF_ROOT" | "ROLLBACK" | "CONSISTENCY_FAIL" | "UNKNOWN";
}

export type ConflictDetailState =
  | { kind: "LOADING"; step: string }
  | {
      kind: "READY";
      conflictId: string;
      verdict: ConflictVerdictModel;
      compare: SideBySideCompareModel;
      impact: any;
      export: any;
      reasons: Array<{ code: ConflictReasonCode; detail?: string }>;
      raw: { conflictProof?: any; quarantine?: any; trustContract?: any; };
    }
  | { kind: "FAILED"; conflictId: string; reasons: any[]; error: any; verdict?: any; };

// --- Hooks ---

export function useConflictsDirectory() {
  const [state, setState] = useState<ConflictsDirectoryState>({ kind: "LOADING", step: "FETCH_INDEX" });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const reasons: Array<{ code: ConflictReasonCode; detail?: string }> = [];
      let indexData: any = null;
      let quarantineData: any = null;

      try {
        setState({ kind: "LOADING", step: "FETCH_INDEX" });
        try {
          const res = await fetch("/integrity/conflicts/index.json", { cache: "no-store" });
          if (res.ok) indexData = await res.json();
          else reasons.push({ code: "CONFLICT_INDEX_UNAVAILABLE", detail: `HTTP ${res.status}` });
        } catch (e) { reasons.push({ code: "CONFLICT_INDEX_UNAVAILABLE" }); }

        setState({ kind: "LOADING", step: "FETCH_QUARANTINE" });
        try {
          const qRes = await fetch("/integrity/conflicts/quarantine.json", { cache: "no-store" });
          if (qRes.ok) quarantineData = await qRes.json();
          else reasons.push({ code: "QUARANTINE_UNAVAILABLE", detail: `HTTP ${qRes.status}` });
        } catch (e) { reasons.push({ code: "QUARANTINE_UNAVAILABLE" }); }

        setState({ kind: "LOADING", step: "COMPUTE" });

        // Parse Table
        const rawConflicts = Array.isArray(indexData?.conflicts) ? indexData.conflicts : [];
        const table: ConflictRowModel[] = rawConflicts.map((c: any) => ({
          conflictId: c.conflictId || "UNKNOWN",
          conflictType: c.conflictType || "UNKNOWN",
          severity: c.severity || "RED",
          detectedAtUtc: c.detectedAtUtc,
          detectedBy: c.detectedBy,
          logId: c.logId,
          href: `/verify/conflicts/${c.conflictId}`
        }));

        // Deterministic Sort: RED first, then date desc, then ID asc
        table.sort((a, b) => {
          if (a.severity !== b.severity) return a.severity === "RED" ? -1 : 1;
          const dA = a.detectedAtUtc || "";
          const dB = b.detectedAtUtc || "";
          if (dA !== dB) return dB.localeCompare(dA);
          return a.conflictId.localeCompare(b.conflictId);
        });

        // Compute Banner
        const activeRedCount = table.filter(c => c.severity === "RED").length;
        const activeAmberCount = table.filter(c => c.severity === "AMBER").length;
        const qRed = quarantineData?.global?.activeRedConflict === true;
        
        const banner: DirectoryBannerModel = {
          light: (activeRedCount > 0 || qRed) ? "RED" : (activeAmberCount > 0 ? "AMBER" : "GREEN"),
          activeRedCount,
          activeAmberCount,
          updatedAtUtc: indexData?.updatedAtUtc || new Date().toISOString(),
          message: (activeRedCount > 0 || qRed) ? "CRITICAL: Active RED conflicts detected." : "No active critical conflicts."
        };

        if (isMounted) setState({ kind: "READY", banner, table, quarantine: quarantineData, reasons });
      } catch (err: any) {
        if (isMounted) setState({ 
          kind: "FAILED", 
          banner: { light: "AMBER", activeRedCount: 0, activeAmberCount: 0, message: "Failed to load directory." }, 
          reasons, 
          error: { code: "UNKNOWN", message: err.message } 
        });
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  return state;
}

export function useConflictDetail(conflictId: string) {
  const [state, setState] = useState<ConflictDetailState>({ kind: "LOADING", step: "FETCH_PROOF" });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const reasons: Array<{ code: ConflictReasonCode; detail?: string }> = [];
      let proof: any = null;
      let quarantine: any = null;

      try {
        setState({ kind: "LOADING", step: "FETCH_PROOF" });
        const res = await fetch(`/integrity/conflicts/${conflictId}.json`, { cache: "no-store" });
        if (!res.ok) {
          if (isMounted) setState({ kind: "FAILED", conflictId, reasons: [{code: "CONFLICT_PROOF_UNAVAILABLE"}], error: {code: "404", message: "Proof not found"} });
          return;
        }
        proof = await res.json();

        setState({ kind: "LOADING", step: "FETCH_QUARANTINE" });
        try {
          const qRes = await fetch("/integrity/conflicts/quarantine.json", { cache: "no-store" });
          if (qRes.ok) quarantine = await qRes.json();
        } catch (e) { reasons.push({ code: "QUARANTINE_UNAVAILABLE" }); }

        // Compute Verdict
        const isRed = proof.severity === "RED" || proof.conflictType !== "UNKNOWN";
        const verdict: ConflictVerdictModel = {
          severity: isRed ? "RED" : "AMBER",
          light: isRed ? "RED" : "AMBER",
          label: "VALIDATED_CONFLICT",
          conflictType: proof.conflictType || "UNKNOWN",
          canonicalConflictHash: proof.canonicalConflictHash,
          collapseRuleApplies: isRed, // Trust contract defaults to true for RED
          message: isRed ? "Active RED conflict: citeability collapses to 0." : "Indeterminate conflict state."
        };

        // Compute Compare
        const compare: SideBySideCompareModel = {
          sthA: { treeSize: proof.sthA?.treeSize, rootHash: proof.sthA?.rootHash, signature: proof.sthA?.signature, signatureStatus: "UNVERIFIED" },
          sthB: { treeSize: proof.sthB?.treeSize, rootHash: proof.sthB?.rootHash, signature: proof.sthB?.signature, signatureStatus: "UNVERIFIED" },
          highlights: [],
          divergenceRule: proof.conflictType === "EQUIVOCATION" ? "SAME_SIZE_DIFF_ROOT" : proof.conflictType === "ROLLBACK" ? "ROLLBACK" : "UNKNOWN"
        };

        if (compare.sthA.treeSize === compare.sthB.treeSize && compare.sthA.rootHash !== compare.sthB.rootHash) {
          compare.highlights.push({ field: "rootHash", note: "Root hashes diverge at identical tree size." });
        }

        const impact = {
          quarantinedMirrors: quarantine?.quarantine?.mirrors ? Object.keys(quarantine.quarantine.mirrors) : [],
          quorumInvalidated: verdict.collapseRuleApplies,
          impactNotes: [verdict.collapseRuleApplies ? "Quorum globally invalidated." : "Quorum remains active."]
        };

        const exportData = {
          proofUrl: `/integrity/conflicts/${conflictId}.json`,
          offlineSteps: ["Download conflictProof.json", "Extract STH-A and STH-B", "Verify signatures using network public key", "Compute canonical conflict hash to verify match"]
        };

        if (isMounted) setState({ 
          kind: "READY", conflictId, verdict, compare, impact, export: exportData, reasons, 
          raw: { conflictProof: proof, quarantine } 
        });

      } catch (err: any) {
        if (isMounted) setState({ kind: "FAILED", conflictId, reasons, error: { code: "ERR", message: err.message } });
      }
    };
    load();
    return () => { isMounted = false; };
  }, [conflictId]);

  return state;
}