export async function getUpcomingSchedule(stateCode: string, programCode: string) {
  // 1. Traverse through RuleIdentity to find the ACTIVE RuleSet
  const ruleSet = await prisma.scheduleRuleSet.findFirst({
    where: {
      identity: {
        stateCode: stateCode.toUpperCase(),
        programCode: programCode.toUpperCase(),
      },
      status: 'ACTIVE', // The new Phase 5.1 status enum
    },
    include: {
      // 2. Fetch all those beautiful pre-computed events we just seeded
      paymentEvents: {
        where: {
          benefitYear: 2026, 
        },
        orderBy: [
          { benefitMonth: 'asc' },
          { nominalDepositDay: 'asc' }
        ]
      }
    }
  });

  return ruleSet;
}