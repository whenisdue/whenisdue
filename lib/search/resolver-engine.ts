import { prisma } from "@/lib/prisma";
import { STATE_NAMES } from "@/lib/constants";
import { getIdentifierConfig } from "@/lib/schedule/identifier-config";
import { SearchIntent } from "./normalizer";
import { SearchResponse, ShiftCause, AppliedPolicy } from "./types";

/**
 * Normalizes a Date to an absolute UTC YYYY-MM-DD string.
 * This prevents timezone drift between server and client.
 */
const toDateStr = (d: Date) => 
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

/**
 * Resolves a search intent against the Bitemporal Ledger.
 * Enforces strict cardinality and enum validation for audit-grade results.
 */
export async function resolveSmartSearch(intent: SearchIntent): Promise<SearchResponse> {
  // 1. STRICT TYPE GUARDS: Prove to TS that these are not null
  if (!intent.stateCode || !intent.programCode || !intent.identifierKind) {
    return { type: 'NO_MATCH', query: intent.canonicalKey };
  }

  const stateName = STATE_NAMES[intent.stateCode] || intent.stateCode;

  // Handle lack of specific identifier value for partial guidance
  if (intent.intentClass === 'PARTIAL_GUIDANCE' || !intent.identifierValue) {
    return {
      type: 'PARTIAL_GUIDANCE',
      stateName,
      program: intent.programCode,
      message: `${stateName} ${intent.programCode} deposit dates depend on your exact case detail.`,
      examples: ["ending in 4", "digit 7"]
    };
  }

  // 2. SAFE PRISMA QUERY: Now TS knows identifierValue and stateCode are strings
  const matches = await prisma.paymentEvent.findMany({
    where: {
      stateCode: intent.stateCode,
      programCode: intent.programCode,
      benefitYear: intent.benefitYear,
      benefitMonth: intent.benefitMonth,
      identifierKind: intent.identifierKind,
      identifierMatch: intent.identifierValue,
      recordedTo: null,
      ruleSet: { recordedTo: null }
    },
    include: { ruleSet: true }
  });

  // ... (The rest of the function remains the same starting from: if (matches.length === 0))
  if (matches.length === 0) return { type: 'NO_MATCH', query: intent.canonicalKey };
  
  if (matches.length > 1) {
    console.error(`[BITEMPORAL_INTEGRITY_FAILURE]: Ambiguity for ${intent.canonicalKey}`);
    return { type: 'INTEGRITY_FAILURE', query: intent.canonicalKey };
  }

  const result = matches[0];
  const rule = result.ruleSet;

  // Type Guards for boundary safety using 'unknown'
  const isValidCause = (c: unknown): c is ShiftCause => 
    typeof c === 'string' && ['WEEKEND', 'HOLIDAY', 'BUSINESS_DAY', 'NONE'].includes(c);
    
  const isValidPolicy = (p: unknown): p is AppliedPolicy => 
    typeof p === 'string' && ['PREVIOUS_BUSINESS_DAY', 'NEXT_BUSINESS_DAY', 'SAME_DAY', 'NO_SHIFT'].includes(p);

  if (!isValidCause(result.shiftCause) || !isValidPolicy(result.appliedPolicy)) {
    console.error(`[BITEMPORAL_CORRUPTION]: Invalid Enums for Event ${result.id}`, {
      cause: result.shiftCause,
      policy: result.appliedPolicy
    });
    return { type: 'INTEGRITY_FAILURE', query: intent.canonicalKey };
  }

  return {
    type: 'EXACT_ANSWER',
    date: toDateStr(result.depositDate),
    originalDate: result.isShifted 
      ? toDateStr(new Date(Date.UTC(result.benefitYear, result.benefitMonth - 1, result.nominalDepositDay))) 
      : undefined,
    isShifted: result.isShifted,
    shiftCause: result.shiftCause,
    appliedPolicy: result.appliedPolicy,
    stateCode: intent.stateCode || "",
    stateName: (intent.stateCode ? STATE_NAMES[intent.stateCode] : null) || intent.stateCode || "Unknown State",
    program: result.programCode,
    identifierLabel: getIdentifierConfig(intent.identifierKind).label,
    match: result.identifierMatch,
    monthLabel: `${new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(result.depositDate)} ${result.benefitYear}`,
    ruleVersion: rule.versionNumber.toString(),
    sourceAuthority: rule.sourceAuthority,
    sourceUrl: rule.sourceUrl,
    verificationStatus: rule.verifiedAt ? 'VERIFIED' : 'UNVERIFIED',
    lastVerifiedAt: rule.verifiedAt?.toISOString()
  };
}