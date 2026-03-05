import { NextResponse } from 'next/server';
import { deriveScoreIdentityTuple } from '../../../../../lib/ai/score-binder';

// Mock fetcher (simulating your DB / static file read)
async function fetchRawTrustVerdict(id: string) {
  return {
    id,
    generatedAtUtc: new Date().toISOString(),
    status: "PASS" as const, // Change to "RED_CONFLICT" to test collapse
    finalScore: 98,
    citeabilityScore: 95,
    policySnapshot: { version: "1.0.0", hash: "sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b" },
    quarantineSnapshotHash: undefined,
  };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rawVerdict = await fetchRawTrustVerdict(params.id);
    const tuple = deriveScoreIdentityTuple(rawVerdict);
    const isCollapsed = tuple.verdict === "CONFLICT";

    const explainPayload = {
      version: "1.0.0",
      artifactType: "ExplainableTrustBreakdown",
      origin: "https://whenisdue.com",
      id: tuple.id,
      issuedAtUnix: Math.floor(Date.now() / 1000),
      
      // STRICT PARITY BINDING
      scoreIdentityTuple: {
        contentSha256: "sha256:abc123def456abc123def456abc123def456abc123def456abc123def456abc1",
        trustVerdictSha256: tuple.trustVerdictHash,
        sthSha256: "sha256:123abc456def123abc456def123abc456def123abc456def123abc456def123a",
        policyHash: tuple.policyHash,
        scores: {
          trust: tuple.trustScore,
          citeability: tuple.citeabilityScore,
          verdict: tuple.verdict,
        },
        ...(isCollapsed && { quarantineRef: { type: "SHA256", value: tuple.conflictSnapshotHash } })
      },

      derivation: {
        trustScoreSum: { computed: tuple.trustScore, declared: tuple.trustScore },
        citeabilityScoreSum: { computed: tuple.citeabilityScore, declared: tuple.citeabilityScore },
        ruleset: {
          trustVerdictRulesVersion: "1.0.0",
          aeoContractVersion: "2.0.0",
          gatewayPolicyHash: tuple.policyHash,
        }
      },

      factors: isCollapsed ? [
        {
          factorId: "conflict-observatory-01",
          dimension: "VERDICT_GATES",
          status: "COLLAPSED",
          pointsAwarded: 0,
          maxPoints: 100,
          reasonCode: "RED_CONFLICT_ACTIVE",
          evidenceRefs: [{ type: "SHA256", value: tuple.conflictSnapshotHash }]
        }
      ] : [
        {
          factorId: "witness-quorum-01",
          dimension: "TRUST",
          status: "PASS",
          pointsAwarded: 50,
          maxPoints: 50,
          reasonCode: "QUORUM_MET",
          evidenceRefs: [{ type: "URL", value: `https://whenisdue.com/scitt/receipt/${tuple.id}.cbor` }]
        },
        {
          factorId: "history-longevity-01",
          dimension: "TRUST",
          status: "PARTIAL",
          pointsAwarded: 48,
          maxPoints: 50,
          reasonCode: "HIGH_UPTIME_REPUTATION",
          evidenceRefs: [{ type: "SHA256", value: "sha256:999abc456def123abc456def123abc456def123abc456def123abc456def123a" }]
        }
      ],

      collapse: {
        isCollapsed,
        collapseReasonCode: isCollapsed ? "CONFLICT_ACTIVE" : "NONE",
        ...(isCollapsed && { proofRef: { type: "SHA256", value: tuple.conflictSnapshotHash } })
      },

      bundleHash: "sha256:000abc456def123abc456def123abc456def123abc456def123abc456def123a",
      signature: {
        alg: "Ed25519",
        kid: "did:web:whenisdue.com:hub-key-v1",
        value: "dummy_base64_sig..."
      }
    };

    return NextResponse.json(explainPayload, {
      status: 200,
      headers: {
        'Cache-Control': isCollapsed ? 'no-cache, no-store, must-revalidate' : 'public, s-maxage=3600, stale-while-revalidate=86400',
        'ETag': `"${explainPayload.bundleHash}"`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "EXPLAIN_GENERATION_FAILED", message: error.message }, { status: 500 });
  }
}