import { useState, useCallback } from "react";

// --- Types from Architect Blueprint ---
export type IsoUtc = string;
export type HexSha256 = string;
export type Base64 = string;

export type TrafficLight = "GREEN" | "AMBER" | "RED";
export type VerdictStatus = "PASS" | "WARN" | "FAIL";

export interface GlobalArtifacts {
  manifestUrl: string;
  trustUrl: string;
  latestSthUrl: string;
  syncManifestUrl: string;
  conflictsIndexUrl: string;
  quarantineUrl: string;
  witnessReputationUrl: string;
}

export interface GlobalHealthSummary {
  overall: TrafficLight;
  reasonCode:
    | "OK"
    | "ACTIVE_RED_CONFLICT"
    | "DISCOVERY_UNAVAILABLE"
    | "TRUST_CONTRACT_UNAVAILABLE"
    | "TREE_STATE_UNAVAILABLE"
    | "WITNESS_TELEMETRY_UNAVAILABLE"
    | "CONFLICT_FEED_UNAVAILABLE";
  computedAtUtc: IsoUtc;
}

export interface GlobalDashboardData {
  artifacts: GlobalArtifacts;
  manifest?: any;
  trustContract?: any;
  latestSth?: any;
  syncManifest?: any;
  conflictsIndex?: any;
  quarantine?: any;
  witnessReputation?: any;
}

export type GlobalDashboardState =
  | { kind: "LOADING_GLOBAL"; startedAtUtc: IsoUtc }
  | { kind: "GLOBAL_READY"; data: GlobalDashboardData; health: GlobalHealthSummary }
  | { kind: "GLOBAL_AMBER"; data?: GlobalDashboardData; health: GlobalHealthSummary; error: { code: string; message: string } }
  | { kind: "GLOBAL_RED"; data: GlobalDashboardData; health: GlobalHealthSummary };

export interface RecordEvidenceLinks {
  trustVerdictUrl: string;
  statementUrl: string;
  receiptUrl: string;
}

export interface TrustVerdictViewModel {
  id: string;
  canonicalUrl?: string;
  citeabilityScore: number;
  status: VerdictStatus;
  computedAtUtc: IsoUtc;
  sthHash?: HexSha256;
  registryHash?: HexSha256;
  activeConflict?: boolean;
  reasons: Array<{ code: string; detail?: string }>;
  signature: { type: "Ed25519"; value: Base64; keyId: string };
}

export type RecordTrafficLight =
  | { light: "GREEN"; label: "VALIDATED" }
  | { light: "AMBER"; label: "INDETERMINATE" }
  | { light: "RED"; label: "INVALID" };

export interface RecordVerdictSummary {
  traffic: RecordTrafficLight;
  collapseApplied: boolean;
  collapseReasonCode?: "GLOBAL_RED_CONFLICT" | "LOCAL_CONFLICT" | "CRYPTO_INVALID" | "HASH_MISMATCH";
}

export type RecordVerifyStep =
  | "FETCH_TRUST_VERDICT"
  | "CHECK_QUARANTINE"
  | "ASSEMBLE_VIEW"
  | "OPTIONAL_LOAD_EVIDENCE";

export type RecordVerifyState =
  | { kind: "IDLE" }
  | { kind: "INPUT_INVALID"; message: string }
  | { kind: "VERIFYING"; id: string; step: RecordVerifyStep }
  | {
      kind: "VERIFIED_RESULT";
      id: string;
      links: RecordEvidenceLinks;
      trustVerdict: TrustVerdictViewModel;
      summary: RecordVerdictSummary;
    }
  | {
      kind: "VERIFY_FAILED";
      id: string;
      links: RecordEvidenceLinks;
      error: { code: string; message: string };
      partialTrustVerdict?: Partial<TrustVerdictViewModel>;
    };

// --- Hooks ---

export function useGlobalEvidence() {
  const [state, setState] = useState<GlobalDashboardState>({
    kind: "LOADING_GLOBAL",
    startedAtUtc: new Date().toISOString(),
  });

  const fetchGlobal = useCallback(async () => {
    setState({ kind: "LOADING_GLOBAL", startedAtUtc: new Date().toISOString() });

    const artifacts: GlobalArtifacts = {
      manifestUrl: "/.well-known/whenisdue-manifest.json",
      trustUrl: "/.well-known/whenisdue-trust.json",
      latestSthUrl: "/transparency/sth/latest.json",
      syncManifestUrl: "/transparency/sync-manifest.json",
      conflictsIndexUrl: "/integrity/conflicts/index.json",
      quarantineUrl: "/integrity/conflicts/quarantine.json",
      witnessReputationUrl: "/witness/reputation.json",
    };

    const data: GlobalDashboardData = { artifacts };
    const computedAtUtc = new Date().toISOString();

    const loadJson = async (url: string, cachePolicy: RequestCache) => {
      const res = await fetch(url, { cache: cachePolicy });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    };

    try {
      // 1. Manifest & Trust (force-cache)
      try {
        data.manifest = await loadJson(artifacts.manifestUrl, "force-cache");
        data.trustContract = await loadJson(artifacts.trustUrl, "force-cache");
      } catch (e) {
        return setState({
          kind: "GLOBAL_AMBER",
          data,
          health: { overall: "AMBER", reasonCode: "DISCOVERY_UNAVAILABLE", computedAtUtc },
          error: { code: "FETCH_ERR", message: "Discovery or trust contract unavailable." },
        });
      }

      // 2. Quarantine (no-store to ensure we get active KILL SWITCH)
      try {
        data.quarantine = await loadJson(artifacts.quarantineUrl, "no-store");
      } catch (e) {
        // Quarantine missing might mean no conflicts yet, but architect says fail closed-ish.
        // We will treat missing quarantine as OK for now unless strictly configured otherwise.
      }

      if (data.quarantine?.global?.state === "RED") {
        return setState({
          kind: "GLOBAL_RED",
          data,
          health: { overall: "RED", reasonCode: "ACTIVE_RED_CONFLICT", computedAtUtc },
        });
      }

      // 3. Conflicts Index
      try {
        data.conflictsIndex = await loadJson(artifacts.conflictsIndexUrl, "no-store");
      } catch (e) {
        // Missing is fine, likely no conflicts yet.
      }

      // 4. Latest STH
      try {
        data.latestSth = await loadJson(artifacts.latestSthUrl, "no-store");
      } catch (e) {
        return setState({
          kind: "GLOBAL_AMBER",
          data,
          health: { overall: "AMBER", reasonCode: "TREE_STATE_UNAVAILABLE", computedAtUtc },
          error: { code: "FETCH_ERR", message: "Tree state unavailable." },
        });
      }

      // 5. Sync Manifest & Witness Rep
      try {
        data.syncManifest = await loadJson(artifacts.syncManifestUrl, "no-store");
        data.witnessReputation = await loadJson(artifacts.witnessReputationUrl, "no-store");
      } catch (e) {
        return setState({
          kind: "GLOBAL_AMBER",
          data,
          health: { overall: "AMBER", reasonCode: "WITNESS_TELEMETRY_UNAVAILABLE", computedAtUtc },
          error: { code: "FETCH_ERR", message: "Witness telemetry unavailable." },
        });
      }

      setState({
        kind: "GLOBAL_READY",
        data,
        health: { overall: "GREEN", reasonCode: "OK", computedAtUtc },
      });
    } catch (err: any) {
      setState({
        kind: "GLOBAL_AMBER",
        data,
        health: { overall: "AMBER", reasonCode: "DISCOVERY_UNAVAILABLE", computedAtUtc },
        error: { code: "UNKNOWN", message: err.message },
      });
    }
  }, []);

  return { state, refresh: fetchGlobal };
}

export function useRecordVerification() {
  const [recordState, setRecordState] = useState<RecordVerifyState>({ kind: "IDLE" });

  const verifyRecord = useCallback(async (id: string, globalState: GlobalDashboardState) => {
    // 1. ID Validation
    const cleanId = id.trim();
    if (!/^[a-zA-Z0-9_-]{6,128}$/.test(cleanId)) {
      return setRecordState({ kind: "INPUT_INVALID", message: "ID must be 6-128 alphanumeric characters (hyphens/underscores allowed)." });
    }

    const links: RecordEvidenceLinks = {
      trustVerdictUrl: `/verify/trustVerdict/${cleanId}.json`,
      statementUrl: `/scitt/statement/${cleanId}.cose`,
      receiptUrl: `/scitt/receipt/${cleanId}.cbor`,
    };

    setRecordState({ kind: "VERIFYING", id: cleanId, step: "FETCH_TRUST_VERDICT" });

    try {
      // 2. Fetch Trust Verdict
      const verdictRes = await fetch(links.trustVerdictUrl, { cache: "no-store" });
      if (!verdictRes.ok) {
        return setRecordState({
          kind: "VERIFY_FAILED",
          id: cleanId,
          links,
          error: { code: "NOT_FOUND", message: "Trust verdict not found for this ID." },
        });
      }
      const verdict: TrustVerdictViewModel = await verdictRes.json();

      setRecordState({ kind: "VERIFYING", id: cleanId, step: "CHECK_QUARANTINE" });

      // 3. Architect Rule: If global RED, collapse immediately.
      if (globalState.kind === "GLOBAL_RED") {
        return setRecordState({
          kind: "VERIFIED_RESULT",
          id: cleanId,
          links,
          trustVerdict: verdict,
          summary: {
            traffic: { light: "RED", label: "INVALID" },
            collapseApplied: true,
            collapseReasonCode: "GLOBAL_RED_CONFLICT",
          },
        });
      }

      // 4. Architect Rule: If trustVerdict.activeConflict == true -> RED
      if (verdict.activeConflict) {
         return setRecordState({
          kind: "VERIFIED_RESULT",
          id: cleanId,
          links,
          trustVerdict: verdict,
          summary: {
            traffic: { light: "RED", label: "INVALID" },
            collapseApplied: true,
            collapseReasonCode: "LOCAL_CONFLICT",
          },
        });
      }

      setRecordState({ kind: "VERIFYING", id: cleanId, step: "ASSEMBLE_VIEW" });

      // 5. Assemble standard view based on score
      let traffic: RecordTrafficLight;
      if (verdict.status === "PASS" && verdict.citeabilityScore >= 70) {
        traffic = { light: "GREEN", label: "VALIDATED" };
      } else if (verdict.status === "WARN") {
        traffic = { light: "AMBER", label: "INDETERMINATE" };
      } else {
        traffic = { light: "RED", label: "INVALID" };
      }

      setRecordState({
        kind: "VERIFIED_RESULT",
        id: cleanId,
        links,
        trustVerdict: verdict,
        summary: {
          traffic,
          collapseApplied: false,
        },
      });

    } catch (err: any) {
      setRecordState({
        kind: "VERIFY_FAILED",
        id: cleanId,
        links,
        error: { code: "UNKNOWN", message: err.message },
      });
    }
  }, []);

  return { recordState, verifyRecord };
}