// RESEARCH APPLIED: Batch 2, Tab 6 (Return exact match + adjacent ranges)
// RESEARCH APPLIED: Batch 2, Tab 2 (Derived Search resolution)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSearchIntent } from '@/lib/search/parser';
import { formatDepositDate } from '@/lib/schedule/formatters';
import { groupContiguousSlices } from '@/lib/grouping/groupContiguousRules';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }

  // 1. Parse structured intent
  const intent = parseSearchIntent(query);

  if (!intent.stateCode || !intent.programCode || !intent.rawIdentifier) {
    return NextResponse.json({ status: "incomplete_intent", message: "Please include a state and identifier (e.g., 'Texas SNAP 05')" });
  }

  // Determine current month target
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 2. Fetch the Rule
  const rule = await prisma.scheduleRule.findFirst({
    where: { state: intent.stateCode, program: intent.programCode }
  });

  if (!rule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  // 3. Fetch all events for the month (Utilizes our new B-Tree Page Index!)
  const events = await prisma.paymentEvent.findMany({
    where: { scheduleRuleId: rule.id, month: currentMonthStr },
    orderBy: [{ depositDate: 'asc' }, { id: 'asc' }]
  });

  // 4. Run our Contiguous Grouping Algorithm to form the UI ranges (e.g. "04-06")
  const groupedRanges = groupContiguousSlices(events);

  // 5. Find the EXACT match group that contains the user's specific digit
  const matchIndex = groupedRanges.findIndex(group => 
    group.atoms.some(atom => atom.key === intent.rawIdentifier)
  );

  if (matchIndex === -1) {
    return NextResponse.json({ status: "not_found", message: `Identifier ${intent.rawIdentifier} not found in schedule.` });
  }

  const matchedGroup = groupedRanges[matchIndex];
  
  // 6. Build the Context Window (Previous and Next groups)
  const previousGroup = matchIndex > 0 ? groupedRanges[matchIndex - 1] : null;
  const nextGroup = matchIndex < groupedRanges.length - 1 ? groupedRanges[matchIndex + 1] : null;

  const timeZone = "America/New_York"; // simplified

  // 7. Return the Trust-Preserving Response Payload
  return NextResponse.json({
    status: "success",
    query: intent,
    match: {
      sliceKey: intent.rawIdentifier,
      groupLabel: matchedGroup.displayLabel, // e.g., "04-06"
      depositDate: formatDepositDate(matchedGroup.depositDate, timeZone),
      isExact: true
    },
    adjacentGroups: [
      previousGroup ? { position: "previous", groupLabel: previousGroup.displayLabel, depositDate: formatDepositDate(previousGroup.depositDate, timeZone) } : null,
      nextGroup ? { position: "next", groupLabel: nextGroup.displayLabel, depositDate: formatDepositDate(nextGroup.depositDate, timeZone) } : null
    ].filter(Boolean)
  });
}