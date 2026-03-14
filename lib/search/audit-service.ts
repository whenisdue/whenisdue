import { prisma } from "@/lib/prisma";

export type AuditContext = {
  asOfDate?: Date;   // System/Recorded Time
  validDate?: Date;  // Effectivity/Valid Time
};

/**
 * RECONSTRUCTION: Finds the specific "Truth" at a precise bitemporal intersection.
 * Uses nested AND/OR arrays to prevent Prisma key overwriting.
 */
export async function getRulesetSnapshot(stateCode: string, programCode: string, ctx: AuditContext) {
  const asOf = ctx.asOfDate || new Date();
  
  const results = await prisma.scheduleRuleSet.findMany({
    where: {
      identity: {
        stateCode,
        programCode,
        ruleFamily: "FULL_SCHEDULE"
      },
      // Uses AND array to allow multiple OR clauses for bitemporal intervals
      AND: [
        // 1. Recorded/System Time Interval [From, To)
        {
          recordedFrom: { lte: asOf },
          OR: [
            { recordedTo: null },
            { recordedTo: { gt: asOf } }
          ]
        },
        // 2. Optional Valid/Effectivity Time Interval [From, To)
        ...(ctx.validDate 
          ? [{
              validFrom: { lte: ctx.validDate },
              OR: [
                { validTo: null },
                { validTo: { gt: ctx.validDate } }
              ]
            }]
          : [])
      ]
    },
    include: { identity: true }
  });

  // Cardinality Enforcement: Fail loud if the ledger has ambiguous truth
  if (results.length > 1) {
    const vDateStr = ctx.validDate ? ` and ValidDate ${ctx.validDate.toISOString()}` : '';
    throw new Error(
      `BITEMPORAL_INTEGRITY_FAILURE: Multiple rules active at As-Of ${asOf.toISOString()}${vDateStr}`
    );
  }

  return results[0] || null;
}

/**
 * COLLISION DETECTION: Prevents overlapping active windows before publish.
 * Implements Allen's Interval Algebra for half-open intervals.
 */
export async function detectCollisions(identityId: string, start: Date, end?: Date) {
  const proposedEnd = end || new Date('9999-12-31');

  return await prisma.scheduleRuleSet.findMany({
    where: {
      identityId,
      recordedTo: null, // Only check currently "Current" truth
      status: 'ACTIVE',
      // Overlap Condition: A starts before B ends AND A ends after B starts
      AND: [
        { validFrom: { lt: proposedEnd } }, 
        {
          OR: [
            { validTo: null }, 
            { validTo: { gt: start } }
          ]
        }
      ]
    }
  });
}

/**
 * LINEAGE: Fetches the version history for a specific state/program.
 */
export async function getRuleLineage(stateCode: string, programCode: string) {
  return await prisma.scheduleRuleSet.findMany({
    where: {
      identity: {
        stateCode,
        programCode,
        ruleFamily: "FULL_SCHEDULE"
      }
    },
    orderBy: { versionNumber: 'asc' },
    include: {
      _count: { select: { paymentEvents: true } }
    }
  });
}