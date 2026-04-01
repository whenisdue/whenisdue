// web/lib/engine/holidays.ts
import { format, getYear } from 'date-fns';

const HOLIDAY_REGISTRY: Record<number, string[]> = {
  2026: [
    '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25', '2026-06-19',
    '2026-07-03', '2026-09-07', '2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25'
  ],
};

export const isHoliday = (date: Date): boolean => {
  const year = getYear(date);
  const holidays = HOLIDAY_REGISTRY[year];
  if (!holidays) throw new Error(`UNSUPPORTED_YEAR: ${year}`);
  return holidays.includes(format(date, 'yyyy-MM-dd'));
};