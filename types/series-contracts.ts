import { z } from "zod";

// Re-using the locked schemas from Deliverable 1
const Sha256Regex = /^sha256:[0-9a-f]{64}$/;

// 1. The Latest Record Binding
const LatestRecordBindingSchema = z.object({
  id: z.string(),
  tupleHash: z.string().regex(Sha256Regex),
  canonicalUrl: z.string().url(),
});

// 2. The Distribution Binding
const DistributionBindingSchema = z.object({
  distributionHash: z.string().regex(Sha256Regex),
  windowModel: z.enum(["DAY_OF_YEAR", "WEEK_OF_YEAR", "MONTH_DAY"]),
  n: z.number().int().min(1),
  p10: z.any(), // Type varies by windowModel (int or object)
  p50: z.any(), 
  p90: z.any(),
});

// 3. The Page-Level Binding Object
export const SeriesPageBindingSchema = z.object({
  seriesKey: z.string(),
  generatedAtUtc: z.string().datetime(), // Must equal latestSTH.issuedAtUtc
  
  binding: z.discriminatedUnion("isCollapsed", [
    z.object({
      isCollapsed: z.literal(true),
      scoreIdentityTuple: z.object({
        verdict: z.literal("CONFLICT"),
        trustScore: z.literal(0),
        citeabilityScore: z.literal(0),
        tupleHash: z.string().regex(Sha256Regex),
      }),
      quarantineRef: z.object({ type: z.literal("SHA256"), value: z.string().regex(Sha256Regex) }),
      reasonCode: z.undefined(),
    }),
    z.object({
      isCollapsed: z.literal(false),
      scoreIdentityTuple: z.object({
        verdict: z.enum(["PASS", "AMBER", "FAIL"]),
        trustScore: z.number().int().min(0).max(100),
        citeabilityScore: z.number().int().min(0).max(100),
        tupleHash: z.string().regex(Sha256Regex),
      }),
      quarantineRef: z.undefined(),
      reasonCode: z.enum(["NO_ELIGIBLE_RECORDS", "INSUFFICIENT_SAMPLES"]).optional(),
    })
  ]),

  distributionBinding: DistributionBindingSchema,
  latestRecordBinding: LatestRecordBindingSchema,
});

export type SeriesPageBinding = z.infer<typeof SeriesPageBindingSchema>;