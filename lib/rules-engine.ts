import { toOffsetStrategy, toTexasCohort, toNewYorkCohort } from "./smart-dates";
import { NYUpstateRule, NYCityRule } from "./ny-types";

export type RawRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: string;
  cohortKey: string | null;
  triggerType: string;
};

type NumericRule = RawRule & {
  baseDay: number;
  offsetStrategy: NonNullable<ReturnType<typeof toOffsetStrategy>>;
  cohortKey: ReturnType<typeof toTexasCohort> | null;
};

export type ProcessedRules =
  | NumericRule[]
  | {
      upstate: NYUpstateRule[];
      city: NYCityRule[];
    };

export function validateRulesForState(stateSlug: string, rawRules: RawRule[]): ProcessedRules {
  switch (stateSlug) {
    case "florida":
    case "california":
    case "georgia":
    case "pennsylvania":
    case "texas":
      return rawRules
        .map((r) => normalizeNumericRule(r, stateSlug))
        .filter((r): r is NumericRule => r !== null);

    case "new-york":
      return {
        upstate: rawRules.map(validateNYUpstate).filter((r): r is NYUpstateRule => r !== null),
        city: rawRules.map(validateNYCity).filter((r): r is NYCityRule => r !== null),
      };

    default:
      return rawRules
        .map((r) => {
          const strategy = toOffsetStrategy(r.offsetStrategy);
          if (!strategy) return null;
          return {
            ...r,
            triggerStart: r.triggerStart.trim(),
            triggerEnd: r.triggerEnd?.trim() || null,
            baseDay: Number(r.baseDay),
            offsetStrategy: strategy,
          };
        })
        .filter((r): r is NumericRule => r !== null);
  }
}

// --- SURGICAL REPLACEMENT: DIAGNOSTIC NORMALIZER (D107.4) ---
// Locate the 'normalizeNumericRule' function and replace it with this version:

function normalizeNumericRule(r: RawRule, stateSlug: string): NumericRule | null {
  const strategy = toOffsetStrategy(r.offsetStrategy);

  if (!strategy) {
    console.error(`[ENGINE][${stateSlug}] DROP: Invalid Strategy -> "${r.offsetStrategy}"`);
    return null;
  }

  const cleanStart = r.triggerStart.trim();
  const cleanEnd = r.triggerEnd?.trim() || null;

  if (!/^\d+$/.test(cleanStart)) {
    console.error(`[ENGINE][${stateSlug}] DROP: Non-numeric Start -> "${cleanStart}"`);
    return null;
  }

  if (cleanEnd && !/^\d+$/.test(cleanEnd)) {
    console.error(`[ENGINE][${stateSlug}] DROP: Non-numeric End -> "${cleanEnd}"`);
    return null;
  }

  const baseDay = Number(r.baseDay);
  if (!Number.isFinite(baseDay) || baseDay < 1 || baseDay > 31) {
    console.error(`[ENGINE][${stateSlug}] DROP: Invalid BaseDay -> ${baseDay}`);
    return null;
  }

  const txCohort = stateSlug === "texas" ? toTexasCohort(r.cohortKey) : null;
  if (stateSlug === "texas" && !txCohort) {
    console.error(`[ENGINE][texas] DROP: Invalid Cohort -> "${r.cohortKey}"`);
    return null;
  }

  const width =
    stateSlug === "florida" || stateSlug === "georgia"
      ? 2
      : stateSlug === "texas"
        ? txCohort === "PRE_JUNE_2020"
          ? 1
          : 2
        : 1;

  return {
    ...r,
    triggerStart: cleanStart.padStart(width, "0"),
    triggerEnd: cleanEnd ? cleanEnd.padStart(width, "0") : null,
    baseDay,
    offsetStrategy: strategy,
    cohortKey: txCohort,
  };
}
// --- END SURGICAL REPLACEMENT ---

function validateNYUpstate(r: RawRule): NYUpstateRule | null {
  const strategy = toOffsetStrategy(r.offsetStrategy);
  const cohort = toNewYorkCohort(r.cohortKey);

  if (cohort !== "UPSTATE") return null;
  if (r.triggerType !== "ALPHABETIC_RANGE") return null;
  if (!strategy) return null;

  const start = r.triggerStart.trim().toUpperCase();
  const end = r.triggerEnd?.trim().toUpperCase() || null;

  if (!/^[A-Z]$/.test(start)) return null;
  if (end && !/^[A-Z]$/.test(end)) return null;

  const baseDay = Number(r.baseDay);
  if (!Number.isFinite(baseDay) || baseDay < 1 || baseDay > 31) return null;

  return {
    triggerStart: start,
    triggerEnd: end,
    baseDay,
    offsetStrategy: strategy,
    cohortKey: "UPSTATE",
  };
}

function validateNYCity(r: RawRule): NYCityRule | null {
  const strategy = toOffsetStrategy(r.offsetStrategy);
  const baseDay = Number(r.baseDay);

  if (!strategy) return null;
  if (r.triggerType !== "MONTHLY_STATIC") return null;
  if (r.triggerStart !== "STATIC") return null;
  if (!Number.isFinite(baseDay) || baseDay < 1 || baseDay > 31) return null;

  if (r.cohortKey === "NYC_A_CYCLE" || r.cohortKey === "NYC_B_CYCLE") {
    return {
      triggerStart: "STATIC",
      triggerEnd: null,
      baseDay,
      offsetStrategy: strategy,
      cohortKey: r.cohortKey,
    };
  }

  return null;
}

export function hasRenderableRules(stateSlug: string, rules: ProcessedRules): boolean {
  if (stateSlug === "new-york") {
    const nyRules = rules as Extract<ProcessedRules, { upstate: NYUpstateRule[]; city: NYCityRule[] }>;
    return nyRules.upstate.length > 0 || nyRules.city.length > 0;
  }

  return Array.isArray(rules) && rules.length > 0;
}

export function verifyIntegrity(stateSlug: string, rules: ProcessedRules): boolean {
  if (stateSlug === "new-york") {
    const nyRules = rules as Extract<ProcessedRules, { upstate: NYUpstateRule[]; city: NYCityRule[] }>;
    const upstateOk = nyRules.upstate.length > 0 && checkAlphabeticCoverage(nyRules.upstate);
    const cityOk =
      nyRules.city.filter((r) => r.cohortKey === "NYC_A_CYCLE").length === 1 &&
      nyRules.city.filter((r) => r.cohortKey === "NYC_B_CYCLE").length === 1;
    return upstateOk && cityOk;
  }

  if (!Array.isArray(rules) || rules.length === 0) return false;

  if (stateSlug === "florida") return true;

  switch (stateSlug) {
    case "california":
      return rules.length === 100
        ? checkContinuous(rules, 99)
        : rules.length === 10 && checkContinuous(rules, 9);

    case "pennsylvania":
      return rules.length === 10 && checkContinuous(rules, 9);

    case "georgia":
      return rules.length === 100 && checkContinuous(rules, 99);

    case "texas": {
      const pre = rules.filter((r) => r.cohortKey === "PRE_JUNE_2020");
      const post = rules.filter((r) => r.cohortKey === "POST_JUNE_2020");
      return checkContinuous(pre, 9) && checkContinuous(post, 99);
    }

    default:
      return true;
  }
}

function checkContinuous(
  rules: Array<{
    triggerStart: string;
    triggerEnd: string | null;
  }>,
  max: number
): boolean {
  if (rules.length === 0) return false;

  const coverage = new Array(max + 1).fill(0);

  for (const r of rules) {
    const start = Number.parseInt(r.triggerStart, 10);
    const end = Number.parseInt(r.triggerEnd || r.triggerStart, 10);

    if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
    if (start < 0 || end < 0 || start > max || end > max || start > end) return false;

    for (let i = start; i <= end; i += 1) {
      coverage[i] += 1;
    }
  }

  return coverage.every((count) => count === 1);
}

function checkAlphabeticCoverage(rules: NYUpstateRule[]): boolean {
  const coverage = new Array(26).fill(0);

  for (const r of rules) {
    const start = r.triggerStart.charCodeAt(0) - 65;
    const end = (r.triggerEnd || r.triggerStart).charCodeAt(0) - 65;

    if (start < 0 || end < 0 || start > 25 || end > 25 || start > end) return false;

    for (let i = start; i <= end; i += 1) {
      coverage[i] += 1;
    }
  }

  return coverage.every((count) => count === 1);
}