// RESEARCH APPLIED: Batch 3, Tab 3 (Reusable server utility for data access)
// RESEARCH APPLIED: Batch 3, Tab 1 & 5 (Forward-looking horizon, fetch current month)
// RESEARCH APPLIED: Batch 3, Tab 2 (Index-friendly Prisma query shape)

import { prisma } from "@/lib/prisma";
import { buildScheduleRows } from "./normalizer";

export async function getUpcomingSchedule(stateCode: string, programCode: string) {
  // Use the server's current date to determine the "Horizon"
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Fetch the Rule Metadata
  const rule = await prisma.scheduleRule.findFirst({
    where: { state: stateCode, program: programCode }
  });

  if (!rule) {
    return null;
  }

  // 2. Fetch the specific Payment Events for the target month
  // We use strict equality on 'month' and sort by date for DB index efficiency
  const events = await prisma.paymentEvent.findMany({
    where: {
      scheduleRuleId: rule.id,
      month: currentMonthStr 
    },
    orderBy: [
      { depositDate: 'asc' },
      { id: 'asc' }
    ]
  });

  // 3. Normalize atomic DB rows into the UI View Model
  const rows = buildScheduleRows(events, "America/New_York"); // Timezone fallback

  // Generate a human-readable month label (e.g., "March 2026")
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);

  return {
    rule,
    rows,
    monthLabel
  };
}