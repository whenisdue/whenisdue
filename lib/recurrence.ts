export type MonthlyBusinessDayOptions = {
  startDate: Date;
  dayOfMonth: number;
  count?: number;
  includeInaugurationDay?: boolean;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function assertValidDayOfMonth(dayOfMonth: number): void {
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    throw new Error(`dayOfMonth must be an integer from 1 to 31. Received: ${dayOfMonth}`);
  }
}

function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function getUtcYear(date: Date): number { return date.getUTCFullYear(); }
function getUtcMonth(date: Date): number { return date.getUTCMonth(); }
function getUtcWeekday(date: Date): number { return date.getUTCDay(); } // 0=Sun ... 6=Sat

function daysInUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
}

function clampDayToMonth(year: number, monthIndex: number, desiredDay: number): number {
  return Math.min(desiredDay, daysInUtcMonth(year, monthIndex));
}

function nthWeekdayOfMonthUtc(year: number, monthIndex: number, weekday: number, nth: number): Date {
  const first = utcDate(year, monthIndex, 1);
  const firstWeekday = getUtcWeekday(first);
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  return utcDate(year, monthIndex, day);
}

function lastWeekdayOfMonthUtc(year: number, monthIndex: number, weekday: number): Date {
  const lastDay = daysInUtcMonth(year, monthIndex);
  const last = utcDate(year, monthIndex, lastDay);
  const lastWeekday = getUtcWeekday(last);
  const offsetBack = (lastWeekday - weekday + 7) % 7;
  return utcDate(year, monthIndex, lastDay - offsetBack);
}

function observedFixedHolidayUtc(year: number, monthIndex: number, day: number): Date {
  const actual = utcDate(year, monthIndex, day);
  const weekday = getUtcWeekday(actual);
  if (weekday === 6) return addUtcDays(actual, -1);
  if (weekday === 0) return addUtcDays(actual, 1);
  return actual;
}

function getObservedFederalHolidaysUtc(year: number): Date[] {
  return [
    observedFixedHolidayUtc(year, 0, 1),   // New Year's Day
    nthWeekdayOfMonthUtc(year, 0, 1, 3),   // MLK Day
    nthWeekdayOfMonthUtc(year, 1, 1, 3),   // Washington's Birthday
    lastWeekdayOfMonthUtc(year, 4, 1),     // Memorial Day
    observedFixedHolidayUtc(year, 5, 19),  // Juneteenth
    observedFixedHolidayUtc(year, 6, 4),   // Independence Day
    nthWeekdayOfMonthUtc(year, 8, 1, 1),   // Labor Day
    nthWeekdayOfMonthUtc(year, 9, 1, 2),   // Columbus Day
    observedFixedHolidayUtc(year, 10, 11), // Veterans Day
    nthWeekdayOfMonthUtc(year, 10, 4, 4),  // Thanksgiving
    observedFixedHolidayUtc(year, 11, 25), // Christmas Day
  ];
}

function dateKeyUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildHolidaySetForYearSpan(startYear: number, endYear: number): Set<string> {
  const set = new Set<string>();
  for (let year = startYear; year <= endYear; year++) {
    for (const holiday of getObservedFederalHolidaysUtc(year)) {
      set.add(dateKeyUtc(holiday));
    }
  }
  return set;
}

function isWeekendUtc(date: Date): boolean {
  const weekday = getUtcWeekday(date);
  return weekday === 0 || weekday === 6;
}

function shiftBackwardToBusinessDayUtc(date: Date, holidaySet: Set<string>): Date {
  let current = new Date(date.getTime());
  while (isWeekendUtc(current) || holidaySet.has(dateKeyUtc(current))) {
    current = addUtcDays(current, -1);
  }
  return current;
}

export function generateMonthlyBusinessDayRecurrences(options: MonthlyBusinessDayOptions): Date[] {
  const { startDate, dayOfMonth, count = 12 } = options;
  assertValidDayOfMonth(dayOfMonth);

  const startYear = getUtcYear(startDate);
  const startMonth = getUtcMonth(startDate);
  const endYear = startYear + Math.floor((startMonth + count) / 12);

  const holidaySet = buildHolidaySetForYearSpan(startYear - 1, endYear + 1);
  const results: Date[] = [];

  for (let i = 0; i < count; i++) {
    const absoluteMonthIndex = startMonth + i;
    const year = startYear + Math.floor(absoluteMonthIndex / 12);
    const monthIndex = absoluteMonthIndex % 12;

    const safeDay = clampDayToMonth(year, monthIndex, dayOfMonth);
    const nominalDate = utcDate(year, monthIndex, safeDay);
    const adjustedDate = shiftBackwardToBusinessDayUtc(nominalDate, holidaySet);

    results.push(adjustedDate);
  }

  return results;
}