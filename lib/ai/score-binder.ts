import canonicalize from "canonicalize";
import { sha256 } from "js-sha256";

type RawTrustVerdict = {
  id: string;
  generatedAtUtc: string;
  status: "PASS" | "AMBER" | "CAUTION" | "WARN" | "FAIL" | "RED_CONFLICT";
  finalScore: number;
  citeabilityScore: number;
  policySnapshot: { version: string; hash?: string };
  quarantineSnapshotHash?: string;
};

export type ScoreIdentityTuple = {
  id: string;
  trustVerdictHash: string;
  trustScore: number;
  citeabilityScore: number;
  verdict: "PASS" | "WARN" | "FAIL" | "CONFLICT";
  signals: string[];
  policyVersion: string;
  policyHash?: string;
  conflictSnapshotHash?: string;
};

/**
 * Deterministically binds the raw Trust Verdict into the strict AI Score Identity Tuple.
 * Enforces the Conflict-Collapse rule: RED conflicts force scores to 0.
 */
export function deriveScoreIdentityTuple(verdictObj: RawTrustVerdict): ScoreIdentityTuple {
  // 1. Canonicalize and hash the source of truth
  const canonicalString = canonicalize(verdictObj);
  if (typeof canonicalString !== "string") {
    throw new Error("Failed to canonicalize trustVerdict");
  }
  const trustVerdictHash = `sha256:${sha256(canonicalString).toLowerCase()}`;

  // 2. Base mapping
  let verdict: ScoreIdentityTuple["verdict"] = "FAIL";
  let trustScore = Math.min(Math.max(Math.round(verdictObj.finalScore), 0), 100);
  let citeabilityScore = Math.min(Math.max(Math.round(verdictObj.citeabilityScore), 0), 100);
  const signals: string[] = [];

  // 3. Verdict mapping & Conflict Collapse Enforcement
  if (verdictObj.status === "PASS") {
    verdict = "PASS";
  } else if (["AMBER", "CAUTION", "WARN"].includes(verdictObj.status)) {
    verdict = "WARN";
  } else if (verdictObj.status === "RED_CONFLICT") {
    verdict = "CONFLICT";
    trustScore = 0;
    citeabilityScore = 0;
    signals.push("CONFLICT_ACTIVE");
  }

  return {
    id: verdictObj.id,
    trustVerdictHash,
    trustScore,
    citeabilityScore,
    verdict,
    signals,
    policyVersion: verdictObj.policySnapshot.version,
    policyHash: verdictObj.policySnapshot.hash,
    conflictSnapshotHash: verdictObj.quarantineSnapshotHash,
  };
}