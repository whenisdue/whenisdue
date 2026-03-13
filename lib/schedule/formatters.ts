// RESEARCH APPLIED: Batch 2, Tab 10 (Centralized Date Formatting Module)

/**
 * Formats a raw database UTC date into a localized, timezone-aware string.
 * Example: "March 14, 2026"
 */
export function formatDepositDate(date: Date | string, timeZone: string = "America/New_York"): string {
  try {
    const safeDate = new Date(date);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: timeZone,
    }).format(safeDate);
  } catch (e) {
    return "Date Unavailable";
  }
}

/**
 * Generates the "Trust-First" relative UX label.
 * Example: "Expected Today", "Expected Tomorrow", or "March 14, 2026"
 */
export function formatDepositStatusLabel(targetDate: Date | string, timeZone: string): string {
  const safeTarget = new Date(targetDate);
  const now = new Date();

  // We format both dates to the target timezone to compare exact calendar days safely
  const formatter = new Intl.DateTimeFormat("en-US", { 
    timeZone, 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  });

  const targetString = formatter.format(safeTarget);
  const todayString = formatter.format(now);
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = formatter.format(tomorrow);

  if (targetString === todayString) return "Expected Today";
  if (targetString === tomorrowString) return "Expected Tomorrow";
  
  return formatDepositDate(safeTarget, timeZone);
}