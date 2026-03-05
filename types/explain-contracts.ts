import { z } from "zod";

// Shared Reference Union
const EvidenceRefSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("URL"), value: z.string().url() }),
  z.object({ type: z.literal("SHA256"), value: z.string().regex(/^sha256:[0-9a-f]{64}$/) })
]);

// 1. Explainable Trust Breakdown Schema
export const ExplainableTrustBreakdownSchema = z.object({
  version: z.literal("1.0.0"),
  artifactType: z.literal("ExplainableTrustBreakdown"),
  origin: z.string().url(),
  id: z.string(),
  issuedAtUnix: z.number().int().positive(),
  
  scoreIdentityTuple: z.object({
    contentSha256: z.string().regex(/^sha256:[0-9a-f]{64}$/),
    trustVerdictSha256: z.string().regex(/^sha256:[0-9a-f]{64}$/),
    sthSha256: z.string().regex(/^sha256:[0-9a-f]{64}$/),
    policyHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
    scores: z.object({
      trust: z.number().int().min(0).max(100),
      citeability: z.number().int().min(0).max(100),
      verdict: z.enum(["PASS", "WARN", "FAIL", "CONFLICT"]),
    }),
    quarantineRef: EvidenceRefSchema.optional(),
  }),

  derivation: z.object({
    trustScoreSum: z.object({ computed: z.number().int(), declared: z.number().int() }),
    citeabilityScoreSum: z.object({ computed: z.number().int(), declared: z.number().int() }),
    ruleset: z.object({
      trustVerdictRulesVersion: z.string(),
      aeoContractVersion: z.string(),
      gatewayPolicyHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
    }),
  }),

  factors: z.array(z.object({
    factorId: z.string(),
    dimension: z.enum(["TRUST", "CITEABILITY", "VERDICT_GATES"]),
    status: z.enum(["PASS", "PARTIAL", "FAIL", "COLLAPSED"]),
    pointsAwarded: z.number().int(),
    maxPoints: z.number().int(),
    reasonCode: z.string(),
    evidenceRefs: z.array(EvidenceRefSchema),
  })),

  collapse: z.object({
    isCollapsed: z.boolean(),
    collapseReasonCode: z.enum(["CONFLICT_ACTIVE", "SIGNATURE_INVALID", "POLICY_FAIL", "STALE", "OTHER", "NONE"]),
    proofRef: EvidenceRefSchema.optional(),
  }),

  bundleHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  signature: z.object({
    alg: z.literal("Ed25519"),
    kid: z.string(),
    value: z.string(),
  }),
});