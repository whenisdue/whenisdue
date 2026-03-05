/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * EligibilityGuardRules.ts
 *
 * Deterministic, fail-closed extraction of Eligibility Expansion Guard blocks
 * based on (a) page context and (b) current UTC window.
 *
 * IMPORTANT GUARDRAILS:
 * - No user case data.
 * - No inference/personalization.
 * - Cohort scoping is page-selected only (program/jurisdiction pages).
 * - If registry entry is malformed or scope mismatch occurs, it does not render.
 */

export type PageKind = "schedule" | "explainer" | "troubleshooting";

export type ConfidenceLabel = "CONFIRMED" | "EXPECTED";

export type ReasonBucket =
  | "RECERTIFICATION_WINDOW"
  | "WAIVER_EXPIRATION"
  | "WORK_REQUIREMENT_UPDATE"
  | "ADDRESS_MAIL_RETURNED"
  | "SYSTEM_OUTAGE_OFFICIAL"
  | "SHUTDOWN_APPROPRIATIONS_CONTEXT";

export type UiBlockId =
  | "BANNER_RECERT_WINDOW"
  | "BANNER_ABAWD_WAIVER_CONTEXT"
  | "BANNER_WORK_REQ_CONTEXT"
  | "BANNER_OFFICIAL_OUTAGE_CONTEXT"
  | "BANNER_SHUTDOWN_CONTEXT";

export interface RegistrySource {
  title: string;
  publisher: string;
  sourceUrl: string;
  lastVerifiedUtc: string; // ISO datetime
}

export interface RegistryScope {
  pagePrograms: string[]; // e.g. ["snap"]
  pageKinds: PageKind[];  // e.g. ["schedule","troubleshooting"]
  jurisdictions: string[]; // e.g. ["US"] or ["NV"]; only applicable if page context includes a jurisdiction
}

export interface ActiveWindowUtc {
  startUtc: string; // ISO datetime
  endUtc: string;   // ISO datetime (exclusive end)
}

export interface EligibilitySignalEntry {
  eligibilitySignalId: string;
  program: string;
  confidenceLabel: ConfidenceLabel;
  reasonBucket: ReasonBucket;
  uiBlockId: UiBlockId;

  scope: RegistryScope;
  activeWindowUtc: ActiveWindowUtc;

  params?: Record<string, string | number | boolean | null>;
  sources: RegistrySource[];
}

export interface EligibilitySignalRegistry {
  registryId: string;
  version: string;
  lastVerifiedUtc: string;
  entries: EligibilitySignalEntry[];
}

export interface PageContext {
  pageProgram: string;          // required
  pageKind: PageKind;           // required
  jurisdiction?: string | null; // optional (only when route implies it)
}

export interface ActiveEligibilityGuard {
  eligibilitySignalId: string;
  program: string;
  confidenceLabel: ConfidenceLabel;
  reasonBucket: ReasonBucket;
  uiBlockId: UiBlockId;
  params: Record<string, any>;
  sources: RegistrySource[];
  activeWindowUtc: ActiveWindowUtc;
}

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

const parseUtcMs = (iso: string): number | null => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
};

const normalizeKey = (s: string): string =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

/**
 * Validate a registry entry with a strict, fail-closed approach.
 * Returns null if invalid.
 */
const coerceEntry = (raw: any): EligibilitySignalEntry | null => {
  if (!raw || typeof raw !== "object") return null;

  const eligibilitySignalId = isNonEmptyString(raw.eligibilitySignalId)
    ? normalizeKey(raw.eligibilitySignalId)
    : null;

  const program = isNonEmptyString(raw.program) ? normalizeKey(raw.program) : null;

  const confidenceLabel = raw.confidenceLabel as ConfidenceLabel;
  const reasonBucket = raw.reasonBucket as ReasonBucket;
  const uiBlockId = raw.uiBlockId as UiBlockId;

  if (!eligibilitySignalId || !program) return null;

  const scope = raw.scope;
  if (!scope || typeof scope !== "object") return null;
  if (!isStringArray(scope.pagePrograms) || !isStringArray(scope.pageKinds) || !isStringArray(scope.jurisdictions)) {
    return null;
  }

  const activeWindowUtc = raw.activeWindowUtc;
  if (!activeWindowUtc || typeof activeWindowUtc !== "object") return null;
  if (!isNonEmptyString(activeWindowUtc.startUtc) || !isNonEmptyString(activeWindowUtc.endUtc)) return null;

  const startMs = parseUtcMs(activeWindowUtc.startUtc);
  const endMs = parseUtcMs(activeWindowUtc.endUtc);
  if (startMs === null || endMs === null) return null;
  if (!(startMs < endMs)) return null;

  const sources = raw.sources;
  if (!Array.isArray(sources) || sources.length < 1) return null;

  const coercedSources: RegistrySource[] = [];
  for (const s of sources) {
    if (!s || typeof s !== "object") return null;
    if (!isNonEmptyString(s.title) || !isNonEmptyString(s.publisher) || !isNonEmptyString(s.sourceUrl) || !isNonEmptyString(s.lastVerifiedUtc)) {
      return null;
    }
    // Fail-closed: require https
    if (!/^https:\/\//i.test(s.sourceUrl)) return null;
    // Fail-closed: require parseable ISO
    if (parseUtcMs(s.lastVerifiedUtc) === null) return null;

    coercedSources.push({
      title: s.title,
      publisher: s.publisher,
      sourceUrl: s.sourceUrl,
      lastVerifiedUtc: s.lastVerifiedUtc,
    });
  }

  // Fail-closed: basic enum sanity (do not accept unknown strings)
  const allowedConfidence: ConfidenceLabel[] = ["CONFIRMED", "EXPECTED"];
  const allowedBuckets: ReasonBucket[] = [
    "RECERTIFICATION_WINDOW",
    "WAIVER_EXPIRATION",
    "WORK_REQUIREMENT_UPDATE",
    "ADDRESS_MAIL_RETURNED",
    "SYSTEM_OUTAGE_OFFICIAL",
    "SHUTDOWN_APPROPRIATIONS_CONTEXT",
  ];
  const allowedUi: UiBlockId[] = [
    "BANNER_RECERT_WINDOW",
    "BANNER_ABAWD_WAIVER_CONTEXT",
    "BANNER_WORK_REQ_CONTEXT",
    "BANNER_OFFICIAL_OUTAGE_CONTEXT",
    "BANNER_SHUTDOWN_CONTEXT",
  ];
  const allowedKinds: PageKind[] = ["schedule", "explainer", "troubleshooting"];

  if (!allowedConfidence.includes(confidenceLabel)) return null;
  if (!allowedBuckets.includes(reasonBucket)) return null;
  if (!allowedUi.includes(uiBlockId)) return null;

  const pageKinds = scope.pageKinds as string[];
  if (!pageKinds.every((k) => allowedKinds.includes(k as PageKind))) return null;

  // Normalize scope programs/jurisdictions (strict strings)
  const normalizedScope: RegistryScope = {
    pagePrograms: scope.pagePrograms.map((p: string) => normalizeKey(p)),
    pageKinds: scope.pageKinds,
    jurisdictions: scope.jurisdictions.map((j: string) => j.trim().toUpperCase()),
  };

  const params = raw.params && typeof raw.params === "object" ? raw.params : {};

  return {
    eligibilitySignalId,
    program,
    confidenceLabel,
    reasonBucket,
    uiBlockId,
    scope: normalizedScope,
    activeWindowUtc: {
      startUtc: activeWindowUtc.startUtc,
      endUtc: activeWindowUtc.endUtc,
    },
    params,
    sources: coercedSources,
  };
};

const scopeMatches = (entry: EligibilitySignalEntry, ctx: PageContext): boolean => {
  const pageProgram = normalizeKey(ctx.pageProgram);
  const pageKind = ctx.pageKind;
  const jurisdiction = ctx.jurisdiction ? ctx.jurisdiction.trim().toUpperCase() : null;

  if (!entry.scope.pagePrograms.includes(pageProgram)) return false;
  if (!entry.scope.pageKinds.includes(pageKind)) return false;

  // Jurisdiction matching:
  // - If page has no jurisdiction, only allow entries scoped to "US" (national) by default.
  // - If page has a jurisdiction, allow entries scoped to that jurisdiction OR "US" (national context).
  if (!jurisdiction) {
    return entry.scope.jurisdictions.includes("US");
  }
  return entry.scope.jurisdictions.includes(jurisdiction) || entry.scope.jurisdictions.includes("US");
};

const windowIsActive = (entry: EligibilitySignalEntry, nowUtcMs: number): boolean => {
  const startMs = parseUtcMs(entry.activeWindowUtc.startUtc);
  const endMs = parseUtcMs(entry.activeWindowUtc.endUtc);
  if (startMs === null || endMs === null) return false;
  return nowUtcMs >= startMs && nowUtcMs < endMs;
};

/**
 * Public API: fail-closed extraction.
 * If registry is missing/malformed, returns [].
 */
export function getActiveEligibilityGuards(args: {
  registry: EligibilitySignalRegistry | any;
  ctx: PageContext;
  nowUtcMs: number;
}): ActiveEligibilityGuard[] {
  const { registry, ctx, nowUtcMs } = args;

  if (!registry || typeof registry !== "object") return [];
  if (!Array.isArray(registry.entries)) return [];

  const out: ActiveEligibilityGuard[] = [];
  const seen = new Set<string>();

  for (const rawEntry of registry.entries) {
    const entry = coerceEntry(rawEntry);
    if (!entry) continue;

    // Fail-closed: program must match entry.program exactly
    if (normalizeKey(ctx.pageProgram) !== entry.program) continue;

    if (!scopeMatches(entry, ctx)) continue;
    if (!windowIsActive(entry, nowUtcMs)) continue;

    // Fail-closed: prevent duplicates
    if (seen.has(entry.eligibilitySignalId)) continue;
    seen.add(entry.eligibilitySignalId);

    out.push({
      eligibilitySignalId: entry.eligibilitySignalId,
      program: entry.program,
      confidenceLabel: entry.confidenceLabel,
      reasonBucket: entry.reasonBucket,
      uiBlockId: entry.uiBlockId,
      params: entry.params ?? {},
      sources: entry.sources,
      activeWindowUtc: entry.activeWindowUtc,
    });
  }

  // Deterministic ordering: stable sort by id
  out.sort((a, b) => a.eligibilitySignalId.localeCompare(b.eligibilitySignalId));
  return out;
}