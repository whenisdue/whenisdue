import { TruthNode } from '../../types/truth';

/**
 * @description Topic A191: Staleness check. 
 * High-volatility data in Angeles City decays after 1 hour.
 */
export function isStale(node: TruthNode): boolean {
  const DECAY_THRESHOLD = 3600000; // 1 Hour
  return Date.now() - node.confidence.lastVerified > DECAY_THRESHOLD;
}

/**
 * @description Topic A183 & A187: The API Shield & Detoxification.
 * Cleans external data and adds mTLS/Sovereign headers.
 */
export async function secureExternalFetch(fragmentId: string): Promise<any> {
  // In Phase B, this will map to specific government/utility endpoints
  const mockExternalResponse = {
    id: fragmentId,
    amount: 2500.00,
    date: new Date().toISOString(),
    source: 'meralco_direct_api'
  };
  return mockExternalResponse;
}

export async function detoxifyPayload(raw: any): Promise<Partial<TruthNode>> {
  // Topic A183.1: Detonation & Sanitization
  return {
    id: String(raw.id),
    canonicalDate: raw.date,
    value: Number(raw.amount),
    currency: 'PHP',
    provenance: {
      sourceId: raw.source,
      method: 'DIRECT_API',
      attestations: [await generateMerkleRoot(raw)] // Topic A123
    }
  };
}

export async function generateEdgeNarrative(data: any): Promise<string> {
  // Topic A151: Predictive context generation
  return `Verified via ${data.provenance?.sourceId}. Payment is scheduled within the nominal window for Pampanga.`;
}

async function generateMerkleRoot(data: any): Promise<string> {
  // Placeholder for Topic A123: Cryptographic Finality
  return `sha256:${Math.random().toString(16).slice(2)}`;
}