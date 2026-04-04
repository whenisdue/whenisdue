import { 
  OffsetStrategy, 
  TexasCohort, 
  NewYorkCohort, 
  toOffsetStrategy, 
  toTexasCohort, 
  toNewYorkCohort 
} from "./smart-dates";
import { NYUpstateRule, NYCityRule } from "./ny-types";

export type RawRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: string;
  cohortKey: string | null;
  triggerType: string;
};

/**
 * 🏛️ STATE DISPATCHER
 * Routes rules to their specific family validators.
 */
export function validateRulesForState(stateSlug: string, rawRules: RawRule[]) {
  switch (stateSlug) {
    case "florida":
    case "california":
    case "georgia":
    case "pennsylvania":
    case "texas":
      return rawRules
        .map(r => normalizeNumericRule(r, stateSlug))
        .filter((r): r is NonNullable<typeof r> => r !== null);

    case "new-york":
      return {
        upstate: rawRules.map(validateNYUpstate).filter((r): r is NYUpstateRule => r !== null),
        city: rawRules.map(validateNYCity).filter((r): r is NYCityRule => r !== null),
      };

    default:
      return rawRules.map(r => ({
        ...r,
        offsetStrategy: toOffsetStrategy(r.offsetStrategy)
      })).filter(r => r.offsetStrategy !== null);
  }
}

function normalizeNumericRule(r: RawRule, stateSlug: string) {
  const strategy = toOffsetStrategy(r.offsetStrategy);
  if (!strategy) return null;

  const cleanStart = r.triggerStart.trim();
  const cleanEnd = r.triggerEnd?.trim() || null;
  if (!/^\d+$/.test(cleanStart) || (cleanEnd && !/^\d+$/.test(cleanEnd))) return null;

  const baseDay = Number(r.baseDay);
  if (isNaN(baseDay) || baseDay < 1 || baseDay > 31) return null;

  // HARDENED: Texas Cohort Resolution
  const txCohort = stateSlug === "texas" ? toTexasCohort(r.cohortKey) : null;
  if (stateSlug === "texas" && !txCohort) return null;

  // WIDTH LOGIC: Numeric precision per state
  const width = (stateSlug === 'florida' || stateSlug === 'georgia') 
    ? 2 
    : (stateSlug === 'texas' && txCohort !== 'PRE_JUNE_2020') 
      ? 2 
      : 1;

  const paddedStart = cleanStart.padStart(width, '0');
  const paddedEnd = cleanEnd ? cleanEnd.padStart(width, '0') : null;

  return { ...r, triggerStart: paddedStart, triggerEnd: paddedEnd, baseDay, offsetStrategy: strategy, cohortKey: txCohort };
}

function validateNYUpstate(r: RawRule): NYUpstateRule | null {
  const strategy = toOffsetStrategy(r.offsetStrategy);
  const cohort = toNewYorkCohort(r.cohortKey);
  if (cohort !== 'UPSTATE' || r.triggerType !== 'ALPHABETIC_RANGE' || !strategy) return null;
  if (r.baseDay < 1 || r.baseDay > 31) return null;
  if (!/^[A-Z]$/i.test(r.triggerStart) || (r.triggerEnd && !/^[A-Z]$/i.test(r.triggerEnd))) return null;

  return {
    triggerStart: r.triggerStart.trim().toUpperCase(),
    triggerEnd: r.triggerEnd?.trim().toUpperCase() || null,
    baseDay: r.baseDay,
    offsetStrategy: strategy,
    cohortKey: 'UPSTATE'
  };
}

function validateNYCity(r: RawRule): NYCityRule | null {
  const strategy = toOffsetStrategy(r.offsetStrategy);
  if (r.triggerType !== 'MONTHLY_STATIC' || r.triggerStart !== 'STATIC' || !strategy || r.baseDay < 1 || r.baseDay > 31) return null;
  if (r.cohortKey === 'NYC_A_CYCLE' || r.cohortKey === 'NYC_B_CYCLE') {
    return { triggerStart: 'STATIC', triggerEnd: null, baseDay: r.baseDay, offsetStrategy: strategy, cohortKey: r.cohortKey };
  }
  return null;
}

/**
 * 🏛️ COVERAGE ORACLE
 * Verifies logical continuity, not just row counts.
 */
export function verifyIntegrity(stateSlug: string, rules: any): boolean {
  if (stateSlug === 'new-york') {
    const upstateOk = rules.upstate.length > 0 && checkAlphabeticCoverage(rules.upstate);
    const cityOk = rules.city.filter((r: any) => r.cohortKey === 'NYC_A_CYCLE').length === 1 &&
                   rules.city.filter((r: any) => r.cohortKey === 'NYC_B_CYCLE').length === 1;
    return upstateOk && cityOk;
  }

  if (rules.length === 0) return false;
  if (stateSlug === 'florida') return true;

  const checkContinuous = (set: any[], max: number) => {
    const map = new Array(max + 1).fill(0);
    set.forEach(r => {
      const s = parseInt(r.triggerStart);
      const e = parseInt(r.triggerEnd || r.triggerStart);
      for (let i = s; i <= e; i++) if (i >= 0 && i <= max) map[i]++;
    });
    return map.every(count => count === 1);
  };

  switch (stateSlug) {
    case 'california': return rules.length === 10 && checkContinuous(rules, 9);
    case 'pennsylvania': return rules.length === 10 && checkContinuous(rules, 9);
    case 'georgia': return rules.length === 100 && checkContinuous(rules, 99);
    case 'texas': return checkContinuous(rules.filter((r: any) => r.cohortKey === 'PRE_JUNE_2020'), 9) && 
                         checkContinuous(rules.filter((r: any) => r.cohortKey === 'POST_JUNE_2020'), 99);
    default: return true;
  }
}

function checkAlphabeticCoverage(rules: NYUpstateRule[]): boolean {
  const map = new Array(26).fill(0);
  rules.forEach(r => {
    const s = r.triggerStart.charCodeAt(0) - 65;
    const e = (r.triggerEnd || r.triggerStart).charCodeAt(0) - 65;
    for (let i = s; i <= e; i++) if (i >= 0 && i < 26) map[i]++;
  });
  return map.every(count => count === 1);
}