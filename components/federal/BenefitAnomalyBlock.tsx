import React from "react";
import { PANIC_PROOF_COPY } from "./PanicProofCopy";

type ProgramKey = "SNAP" | "SSA" | "VA" | string;

type ProvenanceResolved = {
  publisher: string;
  url: string;
  label?: string;
};

export type ResolveProvenanceFn = (key: string) => ProvenanceResolved | null;

export type AnomalyCard = {
  id: string;
  key: string;
  title: string;
  body: string;
  severity: "INFO" | "WARN" | "ACTION";
  requiredProvenanceKeys?: string[];
  runtimeOnly?: boolean;
  officialNotice?: {
    publisherKey: string;
    urlKey: string;
  };
};

export type AnomalyCatalog = {
  schemaVersion: string;
  program: ProgramKey;
  cards: AnomalyCard[];
};

export type BenefitCtx = {
  program: ProgramKey;
  stateCode?: string | null;

  // Deterministic page-level flags (computed server-side)
  isScheduledDateToday: boolean;
  isScheduledDateYesterday: boolean;
  userExpectedDeposit: boolean;

  // Phase 6.2.2 (SSA only): Calendar Trap interceptor (Gap Month)
  gapMonth?: {
    isGapMonth: boolean;
    programLabel: string; // "SSI" or "Social Security"
    benefitMonthLabel: string; // "March 2026"
    issuedOnISO: string; // e.g., "2026-02-27"
    perceivedMissingOnISO: string; // e.g., "2026-03-01"
    nextScheduledISO: string; // e.g., "2026-04-01"
  } | null;

  // Phase 6.2.2 (SSA only): Portal Friction calming line
  portalFriction?: {
    show: boolean;
  } | null;

  // Phase 8: Amount Shock interceptor
  amountFriction?: {
    ssa?: boolean;
    snap?: boolean;
  } | null;

  // For runtime gating: only pass a real officialNoticeKey when the page has a verified official notice.
  officialNoticeKey?: string | null;
};

type StateOverrideRegistry = {
  schemaVersion: string;
  program: "SNAP";
  renderRules: { maxCards: number; maxLinksPerCard: number; failClosed: boolean };
  states: Record<
    string,
    {
      stateCode: string;
      label: string;
      cards: Array<{
        id: string;
        title: string;
        priority: number;
        links: Array<{ id: string; label: string; provenanceKey: string; kind: string }>;
      }>;
    }
  >;
};

function toInt(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function safeBool(x: unknown): boolean {
  return x === true;
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function FailClosed({ reason }: { reason: string }) {
  return (
    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="font-semibold">Verification block unavailable</div>
      <div className="mt-1 opacity-90">{reason}</div>
    </div>
  );
}

function parseISODateLabel(iso: string): { ok: boolean; d?: Date; label?: string } {
  if (!isNonEmptyString(iso)) return { ok: false };
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return { ok: false };
  const label = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);
  return { ok: true, d, label };
}

function renderGapMonthBanner(ctx: BenefitCtx): React.ReactNode {
  if (String(ctx.program).toUpperCase() !== "SSA") return null;

  const gm = ctx.gapMonth;
  if (!gm || gm.isGapMonth !== true) return null;

  if (
    !isNonEmptyString(gm.programLabel) ||
    !isNonEmptyString(gm.benefitMonthLabel) ||
    !isNonEmptyString(gm.issuedOnISO) ||
    !isNonEmptyString(gm.perceivedMissingOnISO) ||
    !isNonEmptyString(gm.nextScheduledISO)
  ) {
    return null;
  }

  const issued = parseISODateLabel(gm.issuedOnISO);
  const missing = parseISODateLabel(gm.perceivedMissingOnISO);
  const next = parseISODateLabel(gm.nextScheduledISO);

  if (!issued.ok || !missing.ok || !next.ok || !issued.label || !missing.label || !next.label) return null;

  const body = PANIC_PROOF_COPY.gapMonthBanner.body({
    programLabel: gm.programLabel,
    benefitMonthLabel: gm.benefitMonthLabel,
    issuedOnLabel: issued.label,
    perceivedMissingOnLabel: missing.label,
    nextScheduledLabel: next.label
  });

  return (
    <div role="status" className="col-span-full rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm mb-2">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-bold text-sky-900">{PANIC_PROOF_COPY.gapMonthBanner.title}</h3>
      </div>
      <p className="text-sm leading-6 text-sky-800">{body}</p>
      <p className="mt-2 text-xs font-semibold text-sky-700">{PANIC_PROOF_COPY.gapMonthBanner.microLine}</p>
    </div>
  );
}

function renderPortalFrictionLine(ctx: BenefitCtx): React.ReactNode {
  if (String(ctx.program).toUpperCase() !== "SSA") return null;

  const pf = ctx.portalFriction;
  if (!pf || safeBool(pf.show) !== true) return null;

  // FIXED: Using fallbackLine instead of offlineFallback to match PanicProofCopy.ts
  const { line, stepsTitle, steps, fallbackLine } = PANIC_PROOF_COPY.portalFriction;

  return (
    <div role="note" className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-semibold text-slate-900">Sign-in help</div>
      <div className="mt-1 text-sm text-slate-700">{line}</div>

      <div className="mt-3 text-xs font-semibold text-slate-700">{stepsTitle}</div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      <div className="mt-3 text-xs text-slate-500">{fallbackLine}</div>
    </div>
  );
}

function renderAmountShockBanner(ctx: BenefitCtx): React.ReactNode {
  let shockData: typeof PANIC_PROOF_COPY.ssaAmountShock | typeof PANIC_PROOF_COPY.snapAmountShock | null = null;

  if (ctx.program === "SSA" && ctx.amountFriction?.ssa) {
    shockData = PANIC_PROOF_COPY.ssaAmountShock;
  } else if (ctx.program === "SNAP" && ctx.amountFriction?.snap) {
    shockData = PANIC_PROOF_COPY.snapAmountShock;
  }

  if (!shockData) return null;

  return (
    <div role={shockData.ariaRole} className="col-span-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm mb-2">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-bold text-slate-900">{shockData.title}</h3>
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {shockData.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">{shockData.footer}</p>
    </div>
  );
}

function SeverityPill({ severity }: { severity: AnomalyCard["severity"] }) {
  const cls =
    severity === "ACTION"
      ? "bg-amber-100 text-amber-900 border-amber-200"
      : severity === "WARN"
      ? "bg-yellow-100 text-yellow-900 border-yellow-200"
      : "bg-slate-100 text-slate-900 border-slate-200";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>{severity}</span>;
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500" href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function shouldRenderCardForCtx(card: AnomalyCard, ctx: BenefitCtx): boolean {
  if (card.runtimeOnly === true) {
    return isNonEmptyString(ctx.officialNoticeKey);
  }
  if (card.severity === "ACTION") {
    return safeBool(ctx.userExpectedDeposit);
  }
  return true;
}

function renderStateOverride(
  stateOverrides: StateOverrideRegistry | null | undefined,
  ctx: BenefitCtx,
  resolveProvenance: ResolveProvenanceFn
) {
  if (!stateOverrides || ctx.program !== "SNAP") return null;
  const sc = (ctx.stateCode || "").toUpperCase();
  if (!isNonEmptyString(sc)) return null;

  const state = stateOverrides.states?.[sc];
  if (!state) return null;

  const maxCards = toInt(stateOverrides.renderRules?.maxCards, 0);
  const maxLinks = toInt(stateOverrides.renderRules?.maxLinksPerCard, 0);
  const failClosed = stateOverrides.renderRules?.failClosed === true;

  if (maxCards <= 0 || maxLinks <= 0 || failClosed !== true) {
    return <FailClosed reason="State override registry is not configured for fail-closed rendering." />;
  }

  const cards = (state.cards || []).slice(0, maxCards);

  for (const c of cards) {
    const links = (c.links || []).slice(0, maxLinks);
    for (const l of links) {
      const pv = resolveProvenance(l.provenanceKey);
      if (!pv || !isNonEmptyString(pv.url) || !isNonEmptyString(pv.publisher)) {
        return <FailClosed reason={`Missing provenance for state override link: ${l.provenanceKey}`} />;
      }
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">{state.label} quick checks</div>
        <div className="text-xs text-slate-500">official tools</div>
      </div>

      <div className="mt-3 space-y-3">
        {cards.map((c) => {
          const links = (c.links || []).slice(0, maxLinks);
          return (
            <div key={c.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-semibold text-slate-900">{c.title}</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {links.map((l) => {
                  const pv = resolveProvenance(l.provenanceKey)!;
                  return (
                    <li key={l.id}>
                      <ExternalLink href={pv.url}>{l.label}</ExternalLink>
                      <span className="ml-2 text-xs text-slate-500">({pv.publisher})</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BenefitAnomalyBlock({
  catalog,
  ctx,
  resolveProvenance,
  stateOverrides
}: {
  catalog: AnomalyCatalog;
  ctx: BenefitCtx;
  resolveProvenance: ResolveProvenanceFn;
  stateOverrides?: StateOverrideRegistry | null;
}) {
  if (!catalog || !ctx || typeof resolveProvenance !== "function") {
    return <FailClosed reason="Missing required inputs." />;
  }
  if (!isNonEmptyString(catalog.schemaVersion) || !isNonEmptyString(String(catalog.program))) {
    return <FailClosed reason="Invalid catalog schema." />;
  }
  if (catalog.program !== ctx.program) {
    return <FailClosed reason="Program mismatch between catalog and page context." />;
  }
  if (!Array.isArray(catalog.cards) || catalog.cards.length === 0) {
    return <FailClosed reason="Catalog has no cards." />;
  }

  for (const card of catalog.cards) {
    if (Array.isArray(card.requiredProvenanceKeys)) {
      for (const pk of card.requiredProvenanceKeys) {
        const pv = resolveProvenance(pk);
        if (!pv || !isNonEmptyString(pv.url) || !isNonEmptyString(pv.publisher)) {
          return <FailClosed reason={`Missing provenance for required key: ${pk}`} />;
        }
      }
    }
  }

  const stateOverrideNode = renderStateOverride(stateOverrides, ctx, resolveProvenance);

  const expected = safeBool(ctx.userExpectedDeposit);
  const today = safeBool(ctx.isScheduledDateToday);
  const yday = safeBool(ctx.isScheduledDateYesterday);

  const headerLine = expected
    ? "If your benefits are expected but not showing yet, these are the most common verified reasons."
    : "If you expected benefits today, confirm your schedule window first. If you are inside your window, these checks help.";

  const flags = [
    { label: "Scheduled today", v: today },
    { label: "Scheduled yesterday", v: yday },
    { label: "Within issuance window", v: expected }
  ];

  const visibleCards = catalog.cards.filter((c) => shouldRenderCardForCtx(c, ctx));

  if (visibleCards.length === 0) {
    return <FailClosed reason="No applicable verification cards for this context." />;
  }

  return (
    <section className="mt-8">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-900">Panic‑Proof Verification</div>
            <div className="mt-1 text-sm text-slate-600">{headerLine}</div>
          </div>

          <div className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-xs font-semibold text-slate-700">Context</div>
            <div className="mt-1 space-y-1 text-xs text-slate-600">
              {flags.map((f) => (
                <div key={f.label} className="flex items-center justify-between gap-2">
                  <span>{f.label}</span>
                  <span className={`font-semibold ${f.v ? "text-emerald-700" : "text-slate-400"}`}>{f.v ? "YES" : "NO"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {stateOverrideNode}

        {renderGapMonthBanner(ctx)}
        {renderAmountShockBanner(ctx)}
        {renderPortalFrictionLine(ctx)}

        <div className="mt-6 grid gap-3">
          {visibleCards.map((card) => (
            <div key={card.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">{card.title}</div>
                <SeverityPill severity={card.severity} />
              </div>

              <div className="mt-2 text-sm leading-6 text-slate-700">{card.body}</div>

              {Array.isArray(card.requiredProvenanceKeys) && card.requiredProvenanceKeys.length > 0 && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="text-xs font-semibold text-slate-700">Official references</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {card.requiredProvenanceKeys.map((pk) => {
                      const pv = resolveProvenance(pk)!;
                      return (
                        <li key={pk}>
                          <ExternalLink href={pv.url}>{pv.label || pk}</ExternalLink>
                          <span className="ml-2 text-xs text-slate-500">({pv.publisher})</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-xs text-slate-500">
          We do not guess outages. If an outage is confirmed, this page will show a clearly labeled official notice with a direct government link.
        </div>
      </div>
    </section>
  );
}

export default BenefitAnomalyBlock;