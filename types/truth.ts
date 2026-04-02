/**
 * @description According to Topic A163 & A004: The Sovereign Canonical Schema.
 * This structure ensures deterministic fidelity across the Global Fence.
 */
export type ConfidenceLevel = 'SOVEREIGN' | 'STABLE' | 'SKEPTICAL' | 'UNVERIFIED';

export interface TruthNode {
  id: string; // state:program:identifier (e.g., "ph:meralco:acct_123")
  canonicalDate: string; // ISO 8601
  value: number;
  currency: string;
  confidence: {
    score: number; // 0.0 to 1.0
    level: ConfidenceLevel;
    lastVerified: number; // Unix Timestamp
    evidenceCount: number;
  };
  provenance: {
    sourceId: string;
    method: 'DIRECT_API' | 'AI_EXTRACTION' | 'COMMUNITY_CONSENSUS';
    attestations: string[]; // Merkle-root hashes of external signatures
  };
  narrative: {
    explanation: string; // AI-generated context (Topic A151)
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}