import canonicalize from 'canonicalize';
import { sha256 } from 'js-sha256';

/**
 * Generates a deterministic DraftId using RFC 8785 (JCS) canonicalization.
 *  * The output is prefixed with "sha256:" and strictly lowercase.
 */
export const generateDraftId = (draftData: object): string => {
  // canonicalize() guarantees consistent key ordering, no extra spaces, 
  // and safe number formatting across any browser/OS.
  const canonicalString = canonicalize(draftData);
  
  if (typeof canonicalString !== 'string') {
    throw new Error("E_CANON_HASH_MISMATCH: Failed to canonicalize draft data");
  }
  
  const hashHex = sha256(canonicalString);
  return `sha256:${hashHex.toLowerCase()}`;
};

/**
 * Generates a deterministic SnapshotHash for the required signers list.
 * This ensures all signers are approving the exact same required quorum.
 */
export const generateSnapshotHash = (signers: string[]): string => {
  // .slice() ensures we don't mutate the original array, then we sort lexicographically
  const sortedSigners = signers.slice().sort();
  const canonicalString = canonicalize(sortedSigners);
  
  if (typeof canonicalString !== 'string') {
    throw new Error("E_CANON_HASH_MISMATCH: Failed to canonicalize signers snapshot");
  }
  
  const hashHex = sha256(canonicalString);
  return `sha256:${hashHex.toLowerCase()}`;
};