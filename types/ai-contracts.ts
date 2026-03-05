import { z } from "zod";

// --- 1. AI Discovery Manifest (/.well-known/whenisdue-ai.json) ---
export const AiManifestSchema = z.object({
  version: z.string(), // e.g., "1.0.0"
  issuer: z.string(), // Canonical domain identity
  didDocumentUrl: z.string().url(),
  artifacts: z.object({
    trustSummaryTemplate: z.string(),
    proofBundleTemplate: z.string(),
    trustVerdictTemplate: z.string(),
    receiptTemplate: z.string(),
    statementTemplate: z.string(),
  }),
  verificationPolicy: z.object({
    minTrustScoreByDomain: z.record(z.string(), z.number().int().min(0).max(100)),
    maxAgeSecondsByDomain: z.record(z.string(), z.number().int().positive()),
    requiredSignals: z.array(z.string()),
    hashAlgorithmsAllowed: z.array(z.string()),
    signatureAlgorithmsAllowed: z.array(z.string()),
    conflictEndpoint: z.string(),
    sthEndpoint: z.string(),
  })
});

export type AiManifest = z.infer<typeof AiManifestSchema>;

// --- 2. AI Trust Summary V2 (/ai/trust-summary/{id}.json) ---

const AiVerdictEnum = z.enum(["PASS", "WARN", "FAIL", "CONFLICT"]);

export const AiTrustSummarySchema = z.object({
  v: z.literal("2.0.0"),
  id: z.string(),
  url: z.string().url(),
  origin: z.string(),
  issuedAtUtc: z.string().datetime(), // ISO8601
  issuedAtUnix: z.number().int().positive(),
  domain: z.string(),
  
  scores: z.object({
    trust: z.number().int().min(0).max(100),
    citeability: z.number().int().min(0).max(100),
    quorumCount: z.number().int().min(0),
    diversityScore: z.number().int().min(0).max(100),
    verdict: AiVerdictEnum,
  }),
  
  hashes: z.object({
    contentSha256: z.string().startsWith("sha256:"),
    trustVerdictSha256: z.string().startsWith("sha256:"),
    receiptSha256: z.string().startsWith("sha256:").optional(),
    sthSha256: z.string().startsWith("sha256:"),
    registrySha256: z.string().startsWith("sha256:").optional(),
  }),
  
  refs: z.object({
    trustVerdictUrl: z.string().url(),
    proofBundleUrl: z.string().url(),
    statementUrl: z.string().url().optional(),
    receiptUrl: z.string().url().optional(),
  }),
  
  signals: z.array(z.string()),
  
  sig: z.object({
    alg: z.literal("Ed25519"),
    kid: z.string(),
    value: z.string(), // base64 or hex
  }),

  supersedes: z.string().optional(),
  expiresAtUtc: z.string().datetime().optional(),
  notes: z.string().max(256).optional(), // Strictly bounded length
});

export type AiTrustSummary = z.infer<typeof AiTrustSummarySchema>;