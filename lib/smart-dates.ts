import { 
  addDays, 
  subDays, 
  isWeekend, 
  isSameDay, 
  lastDayOfMonth,
  differenceInCalendarDays
} from "date-fns";

// 🚀 PATH TO GREEN: Decoupled Plain TS Types
export type OffsetStrategy = 
  | 'PREV_BUSINESS_DAY' 
  | 'NEXT_BUSINESS_DAY' 
  | 'EXACT_CALENDAR_DATE' 
  | 'NEAREST_BUSINESS_DAY';

export type TexasCohort = 'PRE_JUNE_2020' | 'POST_JUNE_2020';

/**
 * 🛠️ Literal Mappers (No Casting)
 */
export function toOffsetStrategy(value: string): OffsetStrategy | null {
  if (value === 'PREV_BUSINESS_DAY') return 'PREV_BUSINESS_DAY';
  if (value === 'NEXT_BUSINESS_DAY') return 'NEXT_BUSINESS_DAY';
  if (value === 'EXACT_CALENDAR_DATE') return 'EXACT_CALENDAR_DATE';
  if (value === 'NEAREST_BUSINESS_DAY') return 'NEAREST_BUSINESS_DAY';
  return null;
}

export function toTexasCohort(value: string | null): TexasCohort | null {
  if (value === 'PRE_JUNE_2020') return 'PRE_JUNE_2020';
  if (value === 'POST_JUNE_2020') return 'POST_JUNE_2020';
  return null;
}

/**
 * 📅 1. Dynamic US Federal Observed Holiday Registry
 */
export function getObservedUSHolidays(year: number): Date[] {
  const fixedHolidays = [
    new Date(year, 0, 1),   // New Year's
    new Date(year, 5, 19),  // Juneteenth
    new Date(year, 6, 4),   // Independence Day
    new Date(year, 10, 11), // Veterans Day
    new Date(year, 11, 25), // Christmas
  ];

  const floating = [
    getNthWeekdayOfMonth(year, 0, 1, 3), // MLK
    getNthWeekdayOfMonth(year, 1, 1, 3), // Presidents
    getLastWeekdayOfMonth(year, 4, 1),   // Memorial
    getNthWeekdayOfMonth(year, 8, 1, 1), // Labor
    getNthWeekdayOfMonth(year, 9, 1, 2), // Columbus
    getNthWeekdayOfMonth(year, 10, 4, 4), // Thanksgiving
  ];

  const observedFixed = fixedHolidays.map(date => {
    const day = date.getDay();
    if (day === 0) return addDays(date, 1);
    if (day === 6) return subDays(date, 1);
    return date;
  });

  return [...observedFixed, ...floating];
}

/**
 * 🧠 2. Deterministic Date Calculator
 */
export function calculateSmartDate(rule: { baseDay: number, offsetStrategy: OffsetStrategy }, month: number, year: number): Date {
  const holidays = getObservedUSHolidays(year);
  const targetDate = new Date(year, month - 1, Math.min(rule.baseDay, lastDayOfMonth(new Date(year, month - 1, 1)).getDate()));

  if (rule.offsetStrategy === "EXACT_CALENDAR_DATE" || (!isWeekend(targetDate) && !isHoliday(targetDate, holidays))) {
    return targetDate;
  }

  if (rule.offsetStrategy === "PREV_BUSINESS_DAY") return findBusinessDay(targetDate, holidays, "BACKWARD");
  if (rule.offsetStrategy === "NEXT_BUSINESS_DAY") return findBusinessDay(targetDate, holidays, "FORWARD");

  if (rule.offsetStrategy === "NEAREST_BUSINESS_DAY") {
    const prev = findBusinessDay(targetDate, holidays, "BACKWARD");
    const next = findBusinessDay(targetDate, holidays, "FORWARD");
    return Math.abs(differenceInCalendarDays(targetDate, next)) < Math.abs(differenceInCalendarDays(targetDate, prev)) ? next : prev;
  }

  return targetDate;
}

// Helpers remain the same...
function findBusinessDay(date: Date, holidays: Date[], dir: "FORWARD" | "BACKWARD"): Date {
  let curr = date;
  while (isWeekend(curr) || isHoliday(curr, holidays)) curr = dir === "FORWARD" ? addDays(curr, 1) : subDays(curr, 1);
  return curr;
}
function isHoliday(date: Date, holidays: Date[]): boolean { return holidays.some(h => isSameDay(date, h)); }
function getNthWeekdayOfMonth(y: number, m: number, dw: number, n: number): Date {
  let d = new Date(y, m, 1); let c = 0;
  while (c < n) { if (d.getDay() === dw) c++; if (c < n) d = addDays(d, 1); } return d;
}
function getLastWeekdayOfMonth(y: number, m: number, dw: number): Date {
  let d = lastDayOfMonth(new Date(y, m, 1)); while (d.getDay() !== dw) d = subDays(d, 1); return d;
}