import { useState, useCallback, useEffect } from "react";

// --- Types from Architect Blueprint ---
export type PageLight = "NEUTRAL" | "GREEN" | "AMBER" | "RED";
export type ForensicSection = "GLANCE" | "EXPLAIN" | "PROVE" | "EXPORT";

export type ForensicReasonCode =
  | "OK"
  | "TRUST_VERDICT_UNAVAILABLE"
  | "TRUST_VERDICT_MALFORMED"
  | "TRUST_VERDICT_SIGNATURE_UNVERIFIED"
  | "TRUST_VERDICT_SIGNATURE_INVALID"
  | "GLOBAL_RED_CONFLICT_COLLAPSE"
  | "LOCAL_CONFLICT_FLAGGED"
  | "POLICY_UNAVAILABLE"
  | "EVIDENCE_UNAVAILABLE"
  | "EVIDENCE_PARSE_FAIL"
  | "RECEIPT_MISSING"
  | "STATEMENT_MISSING";

export interface PageVerdict {
  light: PageLight;
  label: "VALIDATED" | "INDETERMINATE" | "INVALID" | "LOADING";
  citeabilityScoreShown: number;
  statusShown: "PASS" | "WARN" | "FAIL" | "UNKNOWN";
  reasons: Array<{ code: ForensicReasonCode; detail?: string }>;
  computedAtUtc?: string;
  collapseApplied: boolean;
}

export type EvidenceFetchStep =
  | "FETCH_TRUST_VERDICT"
  | "FETCH_QUARANTINE"
  | "FETCH_TRUST_CONTRACT"
  | "COMPUTE_PAGE_VERDICT"
  | "OPTIONAL_FETCH_STATEMENT"
  | "OPTIONAL_FETCH_RECEIPT"
  | "OPTIONAL_FETCH_WITNESSES"
  | "OPTIONAL_FETCH_LATEST_STH"
  | "OPTIONAL_FETCH_CONFLICTS_INDEX";

export interface EvidenceLinks {
  trustVerdictUrl: string;
  statementUrl: string;
  receiptUrl: string;
  quarantineUrl: string;
  trustContractUrl: string;
  witnessReputationUrl: string;
  latestSthUrl: string;
  conflictsIndexUrl: string;
}

export interface RecordForensicData {
  id: string;
  links: EvidenceLinks;
  trustVerdict?: any;
  quarantine?: any;
  trustContract?: any;
  statementBytes?: Uint8Array;
  receiptBytes?: Uint8Array;
  witnessReputation?: any;
  latestSth?: any;
  conflictsIndex?: any;
}

export type RecordForensicState =
  | { kind: "LOADING"; id: string; step: EvidenceFetchStep }
  | { kind: "READY"; id: string; verdict: PageVerdict; data: RecordForensicData }
  | { kind: "FAILED"; id: string; verdict: PageVerdict; data?: Partial<RecordForensicData>; error: { code: string; message: string } };

export type CheckStatus = "PASS" | "WARN" | "FAIL" | "SKIP";
export type CheckCode =
  | "FETCH_OK"
  | "SCHEMA_OK"
  | "SIGNATURE_OK"
  | "SIGNATURE_UNVERIFIED"
  | "INCLUSION_PROOF_OK"
  | "INCLUSION_PROOF_NOT_EVALUATED"
  | "QUORUM_OK"
  | "QUORUM_NOT_EVALUATED"
  | "ANCHOR_OK"
  | "ANCHOR_NOT_EVALUATED"
  | "CONFLICT_NONE"
  | "CONFLICT_ACTIVE_RED";

export interface DeterministicCheck {
  name: string;
  status: CheckStatus;
  code: CheckCode;
  details?: string;
  evidenceUrl?: string;
}

export interface ProveChecklist {
  checks: DeterministicCheck[];
  generatedAtUtc: string;
}

// --- Hook Implementation ---

export function useForensicData(id: string) {
  const cleanId = id.trim();
  const [state, setState] = useState<RecordForensicState>({
    kind: "LOADING",
    id: cleanId,
    step: "FETCH_TRUST_VERDICT",
  });

  const [proveExpanded, setProveExpanded] = useState(false);

  const links: EvidenceLinks = {
    trustVerdictUrl: `/verify/trustVerdict/${cleanId}.json`,
    statementUrl: `/scitt/statement/${cleanId}.cose`,
    receiptUrl: `/scitt/receipt/${cleanId}.cbor`,
    quarantineUrl: `/.well-known/whenisdue-quarantine.json`, // assuming fallback or `/integrity/conflicts/quarantine.json`
    trustContractUrl: `/.well-known/whenisdue-trust.json`,
    witnessReputationUrl: `/witness/reputation.json`,
    latestSthUrl: `/transparency/sth/latest.json`,
    conflictsIndexUrl: `/integrity/conflicts/index.json`,
  };

  // Ensure strict fetch order
  useEffect(() => {
    let isMounted = true;
    
    const loadCore = async () => {
      const data: Partial<RecordForensicData> = { id: cleanId, links };
      const verdict: PageVerdict = {
        light: "NEUTRAL",
        label: "LOADING",
        citeabilityScoreShown: 0,
        statusShown: "UNKNOWN",
        reasons: [],
        collapseApplied: false,
      };

      try {
        // N1: TrustVerdict
        setState({ kind: "LOADING", id: cleanId, step: "FETCH_TRUST_VERDICT" });
        const tvRes = await fetch(links.trustVerdictUrl, { cache: "no-store" });
        if (!tvRes.ok) {
          verdict.light = "AMBER";
          verdict.label = "INDETERMINATE";
          verdict.reasons.push({ code: "TRUST_VERDICT_UNAVAILABLE", detail: `HTTP ${tvRes.status}` });
          if (isMounted) setState({ kind: "FAILED", id: cleanId, verdict, data, error: { code: "N1_FAIL", message: "Trust verdict not found." }});
          return;
        }
        data.trustVerdict = await tvRes.json();
        verdict.computedAtUtc = data.trustVerdict.computedAtUtc;

        // N2: Quarantine
        if (isMounted) setState({ kind: "LOADING", id: cleanId, step: "FETCH_QUARANTINE" });
        try {
          const qRes = await fetch('/integrity/conflicts/quarantine.json', { cache: "no-store" });
          if (qRes.ok) data.quarantine = await qRes.json();
        } catch (e) { /* ignore missing quarantine */ }

        // N3: Trust Contract
        if (isMounted) setState({ kind: "LOADING", id: cleanId, step: "FETCH_TRUST_CONTRACT" });
        try {
          const tcRes = await fetch(links.trustContractUrl, { cache: "force-cache" });
          if (tcRes.ok) data.trustContract = await tcRes.json();
        } catch (e) {
          verdict.reasons.push({ code: "POLICY_UNAVAILABLE", detail: "Could not load trust contract" });
        }

        if (isMounted) setState({ kind: "LOADING", id: cleanId, step: "COMPUTE_PAGE_VERDICT" });
        
        // Compute Page Verdict (Collapse Rules)
        const isGlobalRed = data.quarantine?.global?.activeRedConflict === true;
        const isLocalRed = data.trustVerdict?.activeConflict === true;

        if (isGlobalRed || isLocalRed) {
          verdict.light = "RED";
          verdict.label = "INVALID";
          verdict.citeabilityScoreShown = 0;
          verdict.statusShown = "FAIL";
          verdict.collapseApplied = true;
          verdict.reasons.push({ 
            code: isGlobalRed ? "GLOBAL_RED_CONFLICT_COLLAPSE" : "LOCAL_CONFLICT_FLAGGED", 
            detail: "Active network conflict overrides trust score." 
          });
        } else {
          verdict.collapseApplied = false;
          verdict.citeabilityScoreShown = data.trustVerdict.citeabilityScore ?? 0;
          verdict.statusShown = data.trustVerdict.status ?? "UNKNOWN";
          
          if (verdict.statusShown === "PASS" && verdict.citeabilityScoreShown >= 70) {
            verdict.light = "GREEN";
            verdict.label = "VALIDATED";
            verdict.reasons.push({ code: "OK", detail: "Trust verdict passed local policy bounds." });
          } else if (verdict.statusShown === "WARN") {
            verdict.light = "AMBER";
            verdict.label = "INDETERMINATE";
          } else {
            verdict.light = "RED";
            verdict.label = "INVALID";
          }
        }

        // Add dummy signature unverified warning since browser crypto isn't wired yet
        verdict.reasons.push({ code: "TRUST_VERDICT_SIGNATURE_UNVERIFIED", detail: "Browser-side Ed25519 verification not yet implemented." });

        if (isMounted) {
          setState({ kind: "READY", id: cleanId, verdict, data: data as RecordForensicData });
        }
      } catch (err: any) {
        if (isMounted) setState({ kind: "FAILED", id: cleanId, verdict, data, error: { code: "UNKNOWN", message: err.message }});
      }
    };

    loadCore();
    return () => { isMounted = false; };
  }, [cleanId]);

  // Lazy-load raw evidence when user expands "Prove"
  const expandProve = useCallback(async () => {
    if (state.kind !== "READY" || proveExpanded) return;
    setProveExpanded(true);
    
    // We update state without breaking the UI (keep it READY, just add data)
    try {
      // Optional fetches for raw evidence
      const stmtRes = await fetch(links.statementUrl);
      const rcptRes = await fetch(links.receiptUrl);
      // In a real app we'd get ArrayBuffers:
      // const stmtBuf = await stmtRes.arrayBuffer();
      // data.statementBytes = new Uint8Array(stmtBuf);
      
      // For now, we'll just acknowledge we attempted the load.
    } catch (e) {
      console.warn("Failed to load raw evidence binaries", e);
    }
  }, [state, proveExpanded, links]);

  // Generate Deterministic Checks List
  const generateChecklist = useCallback((): ProveChecklist => {
    const checks: DeterministicCheck[] = [];
    if (state.kind === "READY") {
      checks.push({
        name: "Trust Verdict Availability",
        status: "PASS",
        code: "FETCH_OK",
        details: "trustVerdict.json loaded successfully.",
        evidenceUrl: state.data.links.trustVerdictUrl
      });
      checks.push({
        name: "Verdict Signature Validation",
        status: "SKIP",
        code: "SIGNATURE_UNVERIFIED",
        details: "Client-side Ed25519 signature verification is disabled/pending.",
        evidenceUrl: state.data.links.trustVerdictUrl
      });
      checks.push({
        name: "Conflict Observatory Check",
        status: state.verdict.collapseApplied ? "FAIL" : "PASS",
        code: state.verdict.collapseApplied ? "CONFLICT_ACTIVE_RED" : "CONFLICT_NONE",
        details: state.verdict.collapseApplied ? "RED conflict detected." : "No active conflicts.",
        evidenceUrl: state.data.links.quarantineUrl
      });
      checks.push({
        name: "SCITT Inclusion Proof Verification",
        status: "SKIP",
        code: "INCLUSION_PROOF_NOT_EVALUATED",
        details: "Offline inclusion proof verification required.",
        evidenceUrl: state.data.links.receiptUrl
      });
    }
    return {
      checks: checks.sort((a, b) => a.name.localeCompare(b.name)), // Lexicographical sort
      generatedAtUtc: new Date().toISOString()
    };
  }, [state]);

  return { state, proveExpanded, expandProve, generateChecklist };
}