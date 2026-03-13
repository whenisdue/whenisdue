import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateRulePayload, generateForecast, writeForecastsToDb } from '@/lib/compiler/engine';

export async function POST(request: Request) {
  // 1. SECURITY: Explicit Admin Authorization
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return new NextResponse('Unauthorized: Invalid Admin Token', { status: 401 });
  }

  const runId = `run_${Date.now()}`; // Traceability
  const targetYear = 2026;

  try {
    console.log(`[COMPILER START] Run ID: ${runId}`);

    // Fetch all active Schedule Rules from the DB
    const rules = await prisma.scheduleRule.findMany();
    let totalGenerated = 0;
    let failedRules = 0;

    const approvedForecasts = [];

    // 2. ISOLATED EXECUTION PER RULE
    for (const rule of rules) {
      try {
        validateRulePayload(rule);
        const forecasts = generateForecast(rule, targetYear);
        approvedForecasts.push(...forecasts);
        totalGenerated += forecasts.length;
      } catch (err) {
        console.error(`[COMPILER WARNING] Rule ${rule.id} quarantined.`, err);
        failedRules++;
        // Continue compiling other states! Fail closed, not open.
      }
    }

    // 3. TRANSACTIONAL PUBLISH
    if (approvedForecasts.length > 0) {
      await writeForecastsToDb(approvedForecasts);
    }

    // 4. STRUCTURED OBSERVABILITY REPORT
    const summary = {
      runId,
      status: "completed",
      targetYear,
      counts: {
        rulesParsed: rules.length,
        rulesFailed: failedRules,
        eventsGenerated: totalGenerated,
      }
    };

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error(`[COMPILER FATAL] Run ${runId} crashed:`, error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}