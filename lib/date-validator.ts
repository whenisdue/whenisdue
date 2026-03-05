import { addMonths, nextDay, addWeeks, isWeekend, subDays, addDays, format } from 'date-fns';

// 2026 Federal Holidays
const FEDERAL_HOLIDAYS_2026 = [
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25',
  '2026-06-19', '2026-07-03', '2026-09-07', '2026-10-12',
  '2026-11-11', '2026-11-26', '2026-12-25'
];

export function getAdjustedPaymentDate(year: number, month: number, rule: string): Date {
  // 1. Initialize at NOON local time to completely bypass midnight timezone shifts
  let date = new Date(year, month, 1, 12, 0, 0);

  // --- OPM ANOMALY: Forward Shift Rule ---
  if (rule === 'OPM_FIRST_BUSINESS_DAY') {
    // We use date-fns 'format' to get the exact local date string for the check
    while (isWeekend(date) || FEDERAL_HOLIDAYS_2026.includes(format(date, 'yyyy-MM-dd'))) {
      date = addDays(date, 1);
    }
    // Return locked as Noon UTC to safely save to database
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
  }

  // --- STANDARD RULES: Backward Shift Setup ---
  if (rule === 'VA_FIRST_BUSINESS_DAY_NEXT_MONTH') {
    date = addMonths(date, 1);
  } else if (rule === 'SECOND_WEDNESDAY') {
    date = addWeeks(nextDay(date, 3), 1);
  } else if (rule === 'THIRD_WEDNESDAY') {
    date = addWeeks(nextDay(date, 3), 2);
  } else if (rule === 'FOURTH_WEDNESDAY') {
    date = addWeeks(nextDay(date, 3), 3);
  } else if (rule === 'DAY_3') {
    date = new Date(year, month, 3, 12, 0, 0);
  }

  // --- THE BACKWARD SHIFT ---
  while (isWeekend(date) || FEDERAL_HOLIDAYS_2026.includes(format(date, 'yyyy-MM-dd'))) {
    date = subDays(date, 1);
  }

  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
}