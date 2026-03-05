import React from "react";
import type { ActiveEligibilityGuard, UiBlockId } from "../../lib/EligibilityGuardRules";

/**
 * EligibilityExpansionGuardBlock.tsx
 *
 * Deterministic template renderer for Eligibility Expansion Guard.
 * - No free-form copy per entry.
 * - Copy is template-locked by uiBlockId.
 * - Content parameters are limited and safe.
 */

type Props = {
  guards: ActiveEligibilityGuard[];
};

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

const fmtUtcRange = (startUtc: string, endUtc: string): string => {
  // Keep deterministic, locale-stable formatting using UTC ISO date slices.
  const s = startUtc.slice(0, 10);
  const e = endUtc.slice(0, 10);
  return `${s} → ${e}`;
};

const SourcesList: React.FC<{ sources: ActiveEligibilityGuard["sources"] }> = ({ sources }) => {
  return (
    <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
      {sources.map((s, idx) => (
        <li key={`${s.sourceUrl}-${idx}`} className="break-words">
          <a
            className="underline underline-offset-2 hover:no-underline"
            href={s.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            {s.title}
          </a>
          <span className="text-slate-500"> — {s.publisher}</span>
        </li>
      ))}
    </ul>
  );
};

const AlertShell: React.FC<{
  variant: "info" | "warning";
  title: string;
  children: React.ReactNode;
}> = ({ variant, title, children }) => {
  const border = variant === "warning" ? "border-amber-300" : "border-sky-300";
  const bg = variant === "warning" ? "bg-amber-50" : "bg-sky-50";
  const text = variant === "warning" ? "text-amber-900" : "text-sky-900";

  return (
    <div className={`w-full rounded-xl border ${border} ${bg} p-4`}>
      <div className={`text-sm font-semibold ${text}`}>{title}</div>
      <div className="mt-1 text-sm text-slate-800">{children}</div>
    </div>
  );
};

function renderTemplate(guard: ActiveEligibilityGuard): React.ReactNode {
  const p = guard.params ?? {};
  const windowLabel = fmtUtcRange(guard.activeWindowUtc.startUtc, guard.activeWindowUtc.endUtc);

  const templates: Record<UiBlockId, () => React.ReactNode> = {
    BANNER_RECERT_WINDOW: () => {
      const monthLabel = isNonEmptyString(p.monthLabel) ? p.monthLabel : "this month";
      const whatToDoUrl = isNonEmptyString(p.whatToDoUrl) ? p.whatToDoUrl : null;
      const ruleRef = isNonEmptyString(p.ruleRef) ? p.ruleRef : null;

      return (
        <AlertShell variant="info" title={`Renewal Note (SNAP) — ${monthLabel}`}>
          <p>
            Many SNAP households have periodic reviews and recertifications during {monthLabel}. If a benefit amount is
            reduced or temporarily stops, a common cause is missing or late renewal paperwork.
          </p>
          <p className="mt-2">
            This site does not determine eligibility. It only surfaces cohort-level timing and official program rules.
          </p>
          {ruleRef ? <p className="mt-2 text-xs text-slate-600">Rule reference: {ruleRef}</p> : null}
          <p className="mt-2 text-xs text-slate-600">Active window (UTC): {windowLabel}</p>

          {whatToDoUrl ? (
            <p className="mt-2 text-xs">
              <a className="underline underline-offset-2 hover:no-underline" href={whatToDoUrl} target="_blank" rel="noreferrer">
                Official guidance: what to check / what to do
              </a>
            </p>
          ) : null}

          <SourcesList sources={guard.sources} />
        </AlertShell>
      );
    },

    BANNER_ABAWD_WAIVER_CONTEXT: () => {
      const waiverInfoUrl = isNonEmptyString(p.waiverInfoUrl) ? p.waiverInfoUrl : null;
      const ruleRef = isNonEmptyString(p.ruleRef) ? p.ruleRef : null;

      return (
        <AlertShell variant="info" title="Work Rules Context (ABAWD) — SNAP">
          <p>
            Some SNAP work rules and time limits (including ABAWD policies) can change at the state or area level,
            including through waivers. If benefits are reduced or stop, it may be related to work rule status or
            documentation requirements in your area.
          </p>
          <p className="mt-2">
            This is not a personalized determination. For the official status in your area, consult the authoritative
            program guidance.
          </p>
          {ruleRef ? <p className="mt-2 text-xs text-slate-600">Rule reference: {ruleRef}</p> : null}
          <p className="mt-2 text-xs text-slate-600">Active window (UTC): {windowLabel}</p>

          {waiverInfoUrl ? (
            <p className="mt-2 text-xs">
              <a className="underline underline-offset-2 hover:no-underline" href={waiverInfoUrl} target="_blank" rel="noreferrer">
                Official ABAWD guidance (USDA FNS)
              </a>
            </p>
          ) : null}

          <SourcesList sources={guard.sources} />
        </AlertShell>
      );
    },

    BANNER_WORK_REQ_CONTEXT: () => {
      const infoUrl = isNonEmptyString(p.infoUrl) ? p.infoUrl : null;
      const note = isNonEmptyString(p.note) ? p.note : null;

      return (
        <AlertShell variant="warning" title="Program Update Context — SNAP">
          <p>
            Some SNAP policy updates can affect documentation or participation rules at certain times. When official
            guidance is updated, this banner provides a verified link to the authoritative source.
          </p>
          {note ? <p className="mt-2 text-xs text-slate-600">Note: {note}</p> : null}
          <p className="mt-2 text-xs text-slate-600">Active window (UTC): {windowLabel}</p>

          {infoUrl ? (
            <p className="mt-2 text-xs">
              <a className="underline underline-offset-2 hover:no-underline" href={infoUrl} target="_blank" rel="noreferrer">
                Official policy notice / guidance
              </a>
            </p>
          ) : null}

          <SourcesList sources={guard.sources} />
        </AlertShell>
      );
    },

    BANNER_OFFICIAL_OUTAGE_CONTEXT: () => {
      const statusUrl = isNonEmptyString(p.statusUrl) ? p.statusUrl : null;

      return (
        <AlertShell variant="warning" title="Service Status Context — SNAP">
          <p>
            If an agency or state portal reports a verified outage affecting case status or notices, this banner links to
            the official status update. This is separate from individual eligibility.
          </p>
          <p className="mt-2 text-xs text-slate-600">Active window (UTC): {windowLabel}</p>

          {statusUrl ? (
            <p className="mt-2 text-xs">
              <a className="underline underline-offset-2 hover:no-underline" href={statusUrl} target="_blank" rel="noreferrer">
                Official status page / update
              </a>
            </p>
          ) : null}

          <SourcesList sources={guard.sources} />
        </AlertShell>
      );
    },

    BANNER_SHUTDOWN_CONTEXT: () => {
      const shutdownInfoUrl = isNonEmptyString(p.shutdownInfoUrl) ? p.shutdownInfoUrl : null;
      const note = isNonEmptyString(p.note) ? p.note : null;

      return (
        <AlertShell variant="info" title="Funding / Shutdown Context — SNAP">
          <p>
            News about funding deadlines can cause confusion. This banner is only shown when there is a current, official
            program guidance page addressing SNAP operations in that context.
          </p>
          <p className="mt-2">
            This site does not predict service interruptions. It links to official guidance only.
          </p>
          {note ? <p className="mt-2 text-xs text-slate-600">Registry note: {note}</p> : null}
          <p className="mt-2 text-xs text-slate-600">Active window (UTC): {windowLabel}</p>

          {shutdownInfoUrl ? (
            <p className="mt-2 text-xs">
              <a className="underline underline-offset-2 hover:no-underline" href={shutdownInfoUrl} target="_blank" rel="noreferrer">
                Official SNAP shutdown guidance
              </a>
            </p>
          ) : null}

          <SourcesList sources={guard.sources} />
        </AlertShell>
      );
    },
  };

  const render = templates[guard.uiBlockId];
  return render ? render() : null;
}

export const EligibilityExpansionGuardBlock: React.FC<Props> = ({ guards }) => {
  if (!Array.isArray(guards) || guards.length === 0) return null;

  return (
    <section className="w-full">
      <div className="flex flex-col gap-3">
        {guards.map((g) => (
          <div key={g.eligibilitySignalId}>{renderTemplate(g)}</div>
        ))}
      </div>
    </section>
  );
};