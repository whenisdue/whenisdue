import { prisma } from "@/lib/prisma";

export async function getUpcomingSchedule(stateCode: string, programCode: string) {
  return await prisma.scheduleRuleSet.findFirst({
    where: {
      identity: {
        stateCode: stateCode.toUpperCase(),
        programCode: programCode.toUpperCase(),
      },
      status: 'ACTIVE',
    },
    include: {
      identity: true, 
      paymentEvents: {
        where: { benefitYear: 2026 },
        orderBy: [{ benefitMonth: 'asc' }, { nominalDepositDay: 'asc' }]
      }
    }
  });
}