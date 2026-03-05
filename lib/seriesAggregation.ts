import { calculateCci, type CciResult } from "./patternAggregation";

export type SeriesStats = {
  totalOccurrences: number;
  mostCommonMonth: string;
  monthFrequency: string;
  typicalWindow: string;
  cci?: CciResult;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function aggregateSeries(
  events: any[],
  targetSeriesKey: string
): SeriesStats | null {
  if (!Array.isArray(events)) return null;

  // 1. Filter for events where seriesKey === targetSeriesKey and status is 'CONFIRMED'
  const confirmed = events.filter((e) => {
    if (!e || typeof e !== "object") return false;
    if (e.seriesKey !== targetSeriesKey) return false;

    const label = typeof e.statusLabel === "string" ? e.statusLabel : "";
    return label.trim().toUpperCase() === "CONFIRMED";
  });

  // Filter for valid dates to ensure deterministic math
  const validEvents = confirmed.filter((e) => {
    // Check common date fields
    const iso = e.dueAt ?? e.dueDate ?? e.dateISO;
    if (typeof iso !== "string" || !iso.trim()) return false;

    const d = new Date(iso);
    return Number.isFinite(d.getTime());
  });

  // 2. If there are fewer than 3 confirmed events, return null.
  if (validEvents.length < 3) return null;

  const totalOccurrences = validEvents.length;

  // 3. Calculate stats
  const monthCounts: Record<number, number> = {};
  const dates: Date[] = [];

  for (const e of validEvents) {
    const iso = e.dueAt ?? e.dueDate ?? e.dateISO;
    const d = new Date(iso);
    dates.push(d);

    const m = d.getUTCMonth(); // 0-11
    const current = monthCounts[m] ?? 0;
    monthCounts[m] = current + 1;
  }

  // Find most common month
  let maxMonthIndex = -1;
  let maxCount = -1;

  // Deterministic iteration order for 0-11 keys
  for (let m = 0; m < 12; m++) {
    const count = monthCounts[m];
    if (Number.isFinite(count) && count > maxCount) {
      maxCount = count;
      maxMonthIndex = m;
    }
  }

  const mostCommonMonth = MONTH_NAMES[maxMonthIndex] ?? "";
  const monthFrequency = `${maxCount}/${totalOccurrences}`;

  // Typical Window: earliest and latest calendar days
  // Sort by Month index, then Day index
  dates.sort((a, b) => {
    const mA = a.getUTCMonth();
    const mB = b.getUTCMonth();
    if (mA !== mB) return mA - mB;
    return a.getUTCDate() - b.getUTCDate();
  });

  const earliest = dates[0];
  const latest = dates[dates.length - 1];

  const formatDay = (d: Date) => {
    const m = MONTH_NAMES[d.getUTCMonth()];
    const day = d.getUTCDate();
    return `${m} ${day}`;
  };

  const typicalWindow = `${formatDay(earliest)} – ${formatDay(latest)}`;

  // Calculate Cadence Confidence Index (CCI)
  const dateStrings = validEvents
    .map((e) => e.dueAt ?? e.dueDate ?? e.dateISO)
    .filter((s): s is string => typeof s === "string");
  const cci = calculateCci(dateStrings, targetSeriesKey);

  return {
    totalOccurrences,
    mostCommonMonth,
    monthFrequency,
    typicalWindow,
    cci,
  };
}