export type CciResult = {
  eligible: boolean;
  cci: number;
  tier: "Very High" | "High" | "Medium" | "Low" | "None";
  cycleCount: number;
  concentration: number;
  windowDays: number;
  p10: number;
  p90: number;
  p10DoY: number;
  p50DoY: number;
  p90DoY: number;
  p10Date: string;
  p50Date: string;
  p90Date: string;
  topMonth: number;
  lowEvidence: boolean;
};

function getUtcDayOfYear(d: Date): number {
  const year = d.getUTCFullYear();
  // Date.UTC(year, 0, 0) is Dec 31 of previous year
  const start = new Date(Date.UTC(year, 0, 0));
  const diff = d.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getPercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  // Sort numerically
  const sorted = [...values].sort((a, b) => a - b);
  // Using linear interpolation (0-based index)
  // rank = p * (N - 1)
  const rank = p * (sorted.length - 1);
  const lowerIndex = Math.floor(rank);
  const fraction = rank - lowerIndex;

  if (lowerIndex >= sorted.length - 1) {
    return sorted[sorted.length - 1];
  }

  const v0 = sorted[lowerIndex];
  const v1 = sorted[lowerIndex + 1];
  return v0 + fraction * (v1 - v0);
}

function doYToDate(doy: number, year: number): string {
  const date = new Date(Date.UTC(year, 0, 0));
  date.setUTCDate(date.getUTCDate() + Math.round(doy));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function calculateCci(
  dates: string[],
  seriesLabel?: string
): CciResult {
  // 1. Parse and filter dates
  const validDates: Date[] = [];
  for (const ds of dates) {
    if (!ds || typeof ds !== "string") continue;
    const d = new Date(ds.trim());
    if (Number.isFinite(d.getTime())) {
      validDates.push(d);
    }
  }

  const n = validDates.length;

  // 7. Edge rule: n === 0
  if (n === 0) {
    return {
      eligible: false,
      cci: 0,
      tier: "None",
      cycleCount: 0,
      concentration: 0,
      windowDays: 0,
      p10: 0,
      p90: 0,
      p10DoY: 0,
      p50DoY: 0,
      p90DoY: 0,
      p10Date: "",
      p50Date: "",
      p90Date: "",
      topMonth: -1,
      lowEvidence: true,
    };
  }

  // 1. Convert to Day of Year
  const doys = validDates.map(getUtcDayOfYear);

  // 3. Compute month counts and concentration
  const monthCounts = new Array(12).fill(0);
  for (const d of validDates) {
    monthCounts[d.getUTCMonth()]++;
  }

  let maxCount = 0;
  let topMonth = 0;
  for (let m = 0; m < 12; m++) {
    if (monthCounts[m] > maxCount) {
      maxCount = monthCounts[m];
      topMonth = m;
    }
  }

  const concentration = maxCount / n;

  // 4. Compute p10 and p90
  const p10 = getPercentile(doys, 0.10);
  const p50 = getPercentile(doys, 0.50);
  const p90 = getPercentile(doys, 0.90);

  // 5. Compute windowDays
  const rawWindow = p90 - p10;
  const windowDays = Math.max(1, rawWindow);

  // 6. Compute scores
  // e(n) = 1 - exp(-n/6)
  const evidenceScore = 1 - Math.exp(-n / 6);

  // t(w) = 1 / (1 + (w/14))
  const tightnessScore = 1 / (1 + (windowDays / 14));

  let cciRaw = concentration * tightnessScore * evidenceScore;

  // Clamp [0, 1]
  cciRaw = Math.max(0, Math.min(1, cciRaw));

  // 7. Edge rules
  let lowEvidence = false;
  if (n < 3) {
    lowEvidence = true;
    if (cciRaw > 0.55) cciRaw = 0.55;
  }

  // 8. Tier labels
  let tier: CciResult["tier"] = "Low";
  if (cciRaw >= 0.80) tier = "Very High";
  else if (cciRaw >= 0.65) tier = "High";
  else if (cciRaw >= 0.45) tier = "Medium";

  const currentYear = new Date().getUTCFullYear();

  return {
    eligible: true,
    cci: Number(cciRaw.toFixed(4)),
    tier,
    cycleCount: n,
    concentration: Number(concentration.toFixed(4)),
    windowDays: Number(windowDays.toFixed(4)),
    p10: Number(p10.toFixed(4)),
    p90: Number(p90.toFixed(4)),
    p10DoY: Number(p10.toFixed(4)),
    p50DoY: Number(p50.toFixed(4)),
    p90DoY: Number(p90.toFixed(4)),
    p10Date: doYToDate(p10, currentYear),
    p50Date: doYToDate(p50, currentYear),
    p90Date: doYToDate(p90, currentYear),
    topMonth,
    lowEvidence,
  };
}

/*
  Example: Nintendo Direct (June 15, June 18, June 21)
  dates = ["2021-06-15", "2022-06-18", "2023-06-21"]
  
  n = 3
  DoYs approx: [166, 169, 172]
  
  concentration: 3/3 = 1.0
  
  p10 (index 0.2): ~166.6
  p90 (index 1.8): ~171.4
  windowDays: 171.4 - 166.6 = 4.8
  
  e(3) = 1 - exp(-0.5) ≈ 0.393
  t(4.8) = 1 / (1 + 4.8/14) ≈ 0.746
  
  cci = 1.0 * 0.746 * 0.393 ≈ 0.29
  
  Result:
  {
    eligible: true,
    cci: 0.2935,
    tier: "Low",
    cycleCount: 3,
    concentration: 1,
    windowDays: 4.8,
    p10: 166.6,
    p90: 171.4,
    topMonth: 5, // June
    lowEvidence: false
  }
*/