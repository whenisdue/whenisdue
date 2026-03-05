import { encode } from 'cbor-x';
import { ScoreIdentityTuple } from './score-binder';
import { sha256 } from 'js-sha256';

// Map the string verdicts to the Architect's strict integer enum
const VERDICT_TO_INT = {
  FAIL: 0,
  PASS: 1,
  WARN: 2,
  CONFLICT: 3,
} as const;

export interface ProofBundleInputs {
  tuple: ScoreIdentityTuple;
  origin: string;
  canonicalUrl: string;
  contentSha256Hex: string;
  sthRef: string; 
  receiptRef?: string;
  issuedAtUnix: number;
}

/**
 * Packages the trust data into a minimal CBOR binary payload.
 * This is the exact payload that will be COSE-signed in the next step.
 */
export function buildAiProofBundlePayload(inputs: ProofBundleInputs): Buffer {
  // Convert hex strings to actual byte buffers for maximum compression in CBOR
  const contentBytes = Buffer.from(inputs.contentSha256Hex.replace('sha256:', ''), 'hex');
  const verdictBytes = Buffer.from(inputs.tuple.trustVerdictHash.replace('sha256:', ''), 'hex');
  const conflictBytes = inputs.tuple.conflictSnapshotHash 
    ? Buffer.from(inputs.tuple.conflictSnapshotHash.replace('sha256:', ''), 'hex')
    : null;

  // The Architect's strict numeric-key map
  const payloadMap = new Map<number, any>();
  
  payloadMap.set(1, inputs.tuple.id);
  payloadMap.set(2, inputs.origin);
  payloadMap.set(3, inputs.canonicalUrl);
  payloadMap.set(4, inputs.issuedAtUnix);
  payloadMap.set(5, contentBytes);
  payloadMap.set(6, VERDICT_TO_INT[inputs.tuple.verdict]);
  payloadMap.set(7, inputs.tuple.trustScore);
  payloadMap.set(8, inputs.tuple.citeabilityScore);
  payloadMap.set(9, verdictBytes);
  payloadMap.set(10, inputs.sthRef);
  
  if (inputs.receiptRef) {
    payloadMap.set(11, inputs.receiptRef);
  }

  // Quorum summary (Key 12) - omitting for MIN profile simplicity, 
  // but handled here if we expand to STD profile.

  if (conflictBytes) {
    payloadMap.set(13, conflictBytes);
  }

  // Profile marker (Key 15): 0 for MIN, 1 for STD
  payloadMap.set(15, 0); 

  // Encode the map to a binary CBOR buffer
  const cborBuffer = encode(payloadMap);
  
  // Calculate the deterministic hash of this exact binary payload (Key 14)
  // We have to append it to a wrapper map to satisfy the blueprint's "bundleHash" requirement
  const payloadHash = Buffer.from(sha256.arrayBuffer(cborBuffer));
  
  const finalMap = new Map(payloadMap);
  finalMap.set(14, payloadHash);
  
  return encode(finalMap);
}