import { prisma } from '@/lib/prisma';
import { addDays, isWeekend, isBefore } from 'date-fns'; // Standard date math

// ==========================================
// STAGE 2: VALIDATE (Stage 1 is Seeding the DB)
// ==========================================
export function validateRulePayload(rule: any) {
  // In a production environment, this would use Zod
  if (!rule.logicPayload || !rule.calendarPolicy) {
    throw new Error(`Rule ${rule.id} failed validation: Missing core payloads.`);
  }
  return true;
}

// ==========================================
// STAGE 3: FORECAST GENERATION
// ==========================================
export function generateForecast(rule: any, targetYear: number) {
  const forecasts = [];
  const logic = rule.logicPayload as any;
  const calPolicy = rule.calendarPolicy as any;

  // Generate 12 months for this specific rule
  for (let month = 1; month <= 12; month++) {
    const benefitMonth = `${targetYear}-${String(month).padStart(2, '0')}`;
    
    // STRATEGY PATTERN: Dispatch to the correct rule evaluator
    let rawDates: { date: Date; identifierMatch: string }[] = [];
    if (rule.ruleType === "DIGIT_RANGE_BUCKET") {
        // e.g., Alabama: Formula evaluator
        rawDates = evaluateDigitRangeFormula(logic, targetYear, month);
    } else if (rule.ruleType === "POSITIONAL_DIGIT_SEQUENCE") {
        // e.g., Florida: LUT mapped evaluator
        rawDates = evaluatePositionalMap(logic, targetYear, month);
    } // ... other strategies (Texas, CA, NY)

    // CALENDAR ADJUSTER: Apply weekend/holiday shifts
    for (const raw of rawDates) {
      const adjustedDate = applyCalendarPolicy(raw.date, calPolicy);
      forecasts.push({
        scheduleRuleId: rule.id,
        month: benefitMonth,
        depositDate: adjustedDate,
        identifierMatch: raw.identifierMatch
      });
    }
  }
  return forecasts;
}

// --- Strategy Implementations ---
function evaluateDigitRangeFormula(logic: any, year: number, month: number) {
  const results = [];
  // Alabama: 00-99 mapped to 4th-23rd
  for (let i = 0; i <= 99; i += 5) {
    const depositDay = 4 + Math.floor(i / 5);
    const date = new Date(year, month - 1, depositDay);
    const identifierMatch = `${String(i).padStart(2, '0')}-${String(i + 4).padStart(2, '0')}`;
    results.push({ date, identifierMatch });
  }
  return results;
}

function evaluatePositionalMap(logic: any, year: number, month: number) {
  const results = [];
  // Florida: LUT mapped buckets
  for (const bucket of logic.bucketMap) {
    const date = new Date(year, month - 1, bucket.depositDay);
    const identifierMatch = `${String(bucket.lookupMin).padStart(2, '0')}-${String(bucket.lookupMax).padStart(2, '0')}`;
    results.push({ date, identifierMatch });
  }
  return results;
}

function applyCalendarPolicy(date: Date, policy: any): Date {
  // ShiftMode handler
  if (policy.weekendHandling === "no_shift") {
    return date; // Florida rule
  }
  
  if (policy.weekendHandling === "previous_business_day") {
    let adjusted = new Date(date);
    while (isWeekend(adjusted)) {
      adjusted = addDays(adjusted, -1);
    }
    return adjusted;
  }
  
  return date;
}

// ==========================================
// STAGE 4: DATABASE WRITING (Transactional)
// ==========================================
export async function writeForecastsToDb(forecasts: any[]) {
  // For this test phase, we clear old forecasts and bulk insert the new ones
  await prisma.paymentEvent.deleteMany();
  
  return await prisma.paymentEvent.createMany({
    data: forecasts
  });
}