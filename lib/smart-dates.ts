import { 
  addDays, 
  subDays, 
  isWeekend, 
  lastDayOfMonth,
  isSameDay
} from "date-fns";

/**
 * 🚀 DOCTOR STRANGE PROTOCOL: BACKWARD-COMPATIBLE SUPER ENGINE (V5)
 * Standardized for all 50 states. 
 * Fix: Added WEEKEND_SENSITIVE for Georgia/Florida logic.
 */

// ==========================================
// 🚀 SHARED TYPES (THE CONTRACTS)
// ==========================================

export type OffsetStrategy = 
  | 'PREV_BUSINESS_DAY' 
  | 'NEXT_BUSINESS_DAY' 
  | 'EXACT_CALENDAR_DATE' 
  | 'NEAREST_BUSINESS_DAY'
  | 'BUSINESS_DAY_STAGGER'
  | 'WEEKEND_SENSITIVE'; // 🛡️ Added for GA/FL

export type TexasCohort = 'PRE_JUNE_2020' | 'POST_JUNE_2020';
export type NewYorkCohort = 'UPSTATE' | 'NYC_A_CYCLE' | 'NYC_B_CYCLE';

// ==========================================
// 🛠️ UTILITY HELPERS (DETERMINISTIC)
// ==========================================

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getNthWeekdayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
  if (n > 0) {
    let date = new Date(year, month, 1);
    let count = 0;
    while (count < n) {
      if (date.getDay() === dayOfWeek) count++;
      if (count < n) date = addDays(date, 1);
    }
    return date;
  } else {
    let date = lastDayOfMonth(new Date(year, month, 1));
    while (date.getDay() !== dayOfWeek) {
      date = subDays(date, 1);
    }
    return date;
  }
}

// ==========================================
// 📅 HOLIDAY REGISTRY (DYNAMIC)
// ==========================================

export function getFederalHolidays(year: number): string[] {
  const rawHolidays: Date[] = [
    new Date(year, 0, 1),
    getNthWeekdayOfMonth(year, 0, 1, 3),
    getNthWeekdayOfMonth(year, 1, 1, 3),
    getNthWeekdayOfMonth(year, 4, 1, -1),
    new Date(year, 5, 19),
    new Date(year, 6, 4),
    getNthWeekdayOfMonth(year, 8, 1, 1),
    getNthWeekdayOfMonth(year, 9, 1, 2),
    new Date(year, 10, 11),
    getNthWeekdayOfMonth(year, 10, 4, 4),
    new Date(year, 11, 25),
  ];

  return rawHolidays.map(date => {
    const d = new Date(date);
    const day = d.getDay();
    if (day === 0) return addDays(d, 1);
    if (day === 6) return subDays(d, 1);
    return d;
  }).map(d => toLocalDateKey(d));
}

// ==========================================
// 🧠 MASTER CALCULATOR
// ==========================================

export function calculateSmartDate(
  rule: { baseDay: number, offsetStrategy: OffsetStrategy }, 
  month: number, 
  year: number
): Date {
  const holidayKeys = getFederalHolidays(year);
  const maxDays = lastDayOfMonth(new Date(year, month - 1, 1)).getDate();
  const safeDay = Math.min(rule.baseDay, maxDays);
  const targetDate = new Date(year, month - 1, safeDay);

  switch (rule.offsetStrategy) {
    // 🛡️ NEW: Georgia/Florida "Preceding Friday" Logic
    case 'WEEKEND_SENSITIVE': {
      const dayOfWeek = targetDate.getDay();
      let result = targetDate;
      
      if (dayOfWeek === 0) result = subDays(targetDate, 2); // Sunday -> Friday
      if (dayOfWeek === 6) result = subDays(targetDate, 1); // Saturday -> Friday
      
      // If the shifted Friday is a holiday, follow standard PREV_BUSINESS_DAY
      while (holidayKeys.includes(toLocalDateKey(result)) || isWeekend(result)) {
        result = subDays(result, 1);
      }
      return result;
    }

    case 'BUSINESS_DAY_STAGGER': {
      let bizDayCount = 0;
      let cursor = new Date(year, month - 1, 1);
      while (bizDayCount < safeDay) {
        if (!isWeekend(cursor) && !holidayKeys.includes(toLocalDateKey(cursor))) {
          bizDayCount++;
        }
        if (bizDayCount < safeDay) cursor = addDays(cursor, 1);
      }
      return cursor;
    }

    case 'PREV_BUSINESS_DAY': {
      let date = targetDate;
      while (isWeekend(date) || holidayKeys.includes(toLocalDateKey(date))) {
        date = subDays(date, 1);
      }
      return date;
    }

    case 'NEXT_BUSINESS_DAY': {
      let date = targetDate;
      while (isWeekend(date) || holidayKeys.includes(toLocalDateKey(date))) {
        date = addDays(date, 1);
      }
      return date;
    }

    case 'NEAREST_BUSINESS_DAY': {
      if (!isWeekend(targetDate) && !holidayKeys.includes(toLocalDateKey(targetDate))) {
        return targetDate;
      }
      let prev = subDays(targetDate, 1);
      while (isWeekend(prev) || holidayKeys.includes(toLocalDateKey(prev))) prev = subDays(prev, 1);
      let next = addDays(targetDate, 1);
      while (isWeekend(next) || holidayKeys.includes(toLocalDateKey(next))) next = addDays(next, 1);
      return (targetDate.getTime() - prev.getTime()) <= (next.getTime() - targetDate.getTime()) ? prev : next;
    }

    case 'EXACT_CALENDAR_DATE':
    default:
      return targetDate;
  }
}

// ==========================================
// 🛠️ LITERAL MAPPERS (MAINTAINING CONTRACTS)
// ==========================================

export function toOffsetStrategy(value: string): OffsetStrategy | null {
  const valid: OffsetStrategy[] = [
    'PREV_BUSINESS_DAY', 
    'NEXT_BUSINESS_DAY', 
    'EXACT_CALENDAR_DATE', 
    'NEAREST_BUSINESS_DAY', 
    'BUSINESS_DAY_STAGGER', 
    'WEEKEND_SENSITIVE'
  ];
  return valid.includes(value as OffsetStrategy) ? (value as OffsetStrategy) : null;
}

// 🛡️ FIX: Added 'export' to make these available to page.tsx
export function toTexasCohort(value: string | null): TexasCohort | null {
  if (value === 'PRE_JUNE_2020') return 'PRE_JUNE_2020';
  if (value === 'POST_JUNE_2020') return 'POST_JUNE_2020';
  return null;
}

// 🛡️ FIX: Added 'export' to make these available to page.tsx
export function toNewYorkCohort(value: string | null): NewYorkCohort | null {
  if (value === 'UPSTATE') return 'UPSTATE';
  if (value === 'NYC_A_CYCLE') return 'NYC_A_CYCLE';
  if (value === 'NYC_B_CYCLE') return 'NYC_B_CYCLE';
  return null;
}