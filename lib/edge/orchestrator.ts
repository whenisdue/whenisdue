/// <reference types="@cloudflare/workers-types" />
import { TruthNode } from '../../types/truth';
import { calculateConfidence } from './confidence';
import { isStale, secureExternalFetch, detoxifyPayload, generateEdgeNarrative } from './utils';

/**
 * @description Topic A200: Sovereign Unified Truth Mesh.
 * Handles the sub-10ms propagation of Truth Fragments using Cloudflare Workers.
 */

// Defining the Cloudflare Platform structure for TypeScript to resolve 'platform' errors
interface CloudflareEnv {
  TRUTH_KV: KVNamespace;
}

export async function resolveTruth(fragmentId: string, platformEnv: CloudflareEnv): Promise<TruthNode> {
  const startTime = performance.now();

  // 1. LATENCY-FIRST ROUTING (Topic A051)
  // Casting to TruthNode to satisfy TypeScript requirements
  const cached = await platformEnv.TRUTH_KV.get(fragmentId, { type: 'json' }) as TruthNode | null;

  // 2. STALE-WHILE-REVALIDATE (Topic A191)
  if (cached && !isStale(cached)) {
    return cached;
  }

  // 3. SOVEREIGN INGESTION (Topic A183 & A187)
  const rawData = await secureExternalFetch(fragmentId);
  const purified = await detoxifyPayload(rawData);

  // 4. AI NARRATIVE (Topic A151)
  // Context-aware explanation generated within the Edge Isolate
  const narrativeText = await generateEdgeNarrative(purified);

  // 5. CONFIDENCE SCORING (Topic 11 & A195)
  const confidenceScore = calculateConfidence(purified);

  const truth: TruthNode = {
    id: purified.id!,
    canonicalDate: purified.canonicalDate!,
    value: purified.value!,
    currency: purified.currency!,
    confidence: {
      score: confidenceScore,
      level: confidenceScore > 0.9 ? 'SOVEREIGN' : 'STABLE',
      lastVerified: Date.now(),
      evidenceCount: 1
    },
    provenance: purified.provenance!,
    narrative: {
      explanation: narrativeText,
      urgency: 'HIGH'
    }
  };

  // 6. ATOMIC COMMIT (Topic A123)
  // Committing to Global KV so users in Hong Kong or Angeles City see parity
  await platformEnv.TRUTH_KV.put(fragmentId, JSON.stringify(truth), {
    expirationTtl: 3600 // 1 hour TTL for high-volatility nodes
  });

  return truth;
}