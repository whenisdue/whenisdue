import { DateOffsetStrategy } from "@prisma/client";
import { 
  addDays, 
  subDays, 
  isWeekend, 
  isSameDay, 
  lastDayOfMonth,
  differenceInCalendarDays
} from "date-fns";

/**
 * 📅 1. Dynamic US Federal Observed Holiday Registry
 * Logic: Saturday holidays -> Friday. Sunday holidays -> Monday.
 */
export function getObservedUSHolidays(year: number): Date[] {
  const fixedHolidays = [
    new Date(year, 0, 1),   // New Year's
    new Date(year, 5, 19),  // Juneteenth
    new Date(year, 6, 4),   // Independence Day
    new Date(year, 10, 11), // Veterans Day
    new Date(year, 11, 25), // Christmas
  ];

  // Floating Holidays (Monday-based, so they never need "observation" shifting)
  const floating = [
    getNthWeekdayOfMonth(year, 0, 1, 3), // MLK (3rd Mon Jan)
    getNthWeekdayOfMonth(year, 1, 1, 3), // Presidents (3rd Mon Feb)
    getLastWeekdayOfMonth(year, 4, 1),   // Memorial (Last Mon May)
    getNthWeekdayOfMonth(year, 8, 1, 1), // Labor (1st Mon Sep)
    getNthWeekdayOfMonth(year, 9, 1, 2), // Columbus (2nd Mon Oct)
    getNthWeekdayOfMonth(year, 10, 4, 4), // Thanksgiving (4th Thu Nov)
  ];

  // Apply Observation Rules to Fixed Holidays
  const observedFixed = fixedHolidays.map(date => {
    const day = date.getDay();
    if (day === 0) return addDays(date, 1); // Sunday -> Monday
    if (day === 6) return subDays(date, 1); // Saturday -> Friday
    return date;
  });

  return [...observedFixed, ...floating];
}

/**
 * 🧠 2. Deterministic Date Calculator
 */
export function calculateSmartDate(rule: { baseDay: number, offsetStrategy: DateOffsetStrategy }, month: number, year: number): Date {
  const holidays = getObservedUSHolidays(year);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = lastDayOfMonth(monthStart);
  const safeDay = Math.min(rule.baseDay, monthEnd.getDate());
  
  const targetDate = new Date(year, month - 1, safeDay);

  if (rule.offsetStrategy === "EXACT_CALENDAR_DATE" || (!isWeekend(targetDate) && !isHoliday(targetDate, holidays))) {
    return targetDate;
  }

  // 🛡️ Deterministic Strategy Selection
  if (rule.offsetStrategy === "PREV_BUSINESS_DAY") {
    return findBusinessDay(targetDate, holidays, "BACKWARD");
  }

  if (rule.offsetStrategy === "NEXT_BUSINESS_DAY") {
    return findBusinessDay(targetDate, holidays, "FORWARD");
  }

  if (rule.offsetStrategy === "NEAREST_BUSINESS_DAY") {
    const prev = findBusinessDay(targetDate, holidays, "BACKWARD");
    const next = findBusinessDay(targetDate, holidays, "FORWARD");
    
    const distPrev = Math.abs(differenceInCalendarDays(targetDate, prev));
    const distNext = Math.abs(differenceInCalendarDays(targetDate, next));

    // Tie-break Rule: If exactly equal distance (e.g. Sunday with Mon holiday), pick PREV
    return distNext < distPrev ? next : prev;
  }

  return targetDate;
}

// --- HELPERS ---

function findBusinessDay(date: Date, holidays: Date[], direction: "FORWARD" | "BACKWARD"): Date {
  let current = date;
  while (isWeekend(current) || isHoliday(current, holidays)) {
    current = direction === "FORWARD" ? addDays(current, 1) : subDays(current, 1);
  }
  return current;
}

function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some(h => isSameDay(date, h));
}

function getNthWeekdayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
  let date = new Date(year, month, 1);
  let count = 0;
  while (count < n) {
    if (date.getDay() === dayOfWeek) count++;
    if (count < n) date = addDays(date, 1);
  }
  return date;
}

function getLastWeekdayOfMonth(year: number, month: number, dayOfWeek: number): Date {
  let date = lastDayOfMonth(new Date(year, month, 1));
  while (date.getDay() !== dayOfWeek) {
    date = subDays(date, 1);
  }
  return date;
}