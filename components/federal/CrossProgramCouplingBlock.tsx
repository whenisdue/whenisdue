import React from 'react';
import { COUPLING_COPY, COUPLING_INFERENCE_BOUNDARY, type CouplingId, type CouplingTier } from './PanicProofCopy';

export type CouplingHint = {
  couplingId: CouplingId;
  tier: CouplingTier;
  evidenceRefs: string[]; // already build-validated anchors/labels
};

export type CrossProgramCouplingBlockProps = {
  hints: CouplingHint[];
  className?: string;
};

export function CrossProgramCouplingBlock(props: CrossProgramCouplingBlockProps) {
  const { hints, className } = props;
  if (!Array.isArray(hints) || hints.length === 0) return null;

  const tierRank: Record<CouplingTier, number> = { essential: 0, contextual: 1, technical: 2 };
  const ordered = [...hints].sort((a, b) => (tierRank[a.tier] ?? 9) - (tierRank[b.tier] ?? 9));

  return (
    <section className={className ?? ''} aria-label="Cross-program explanations">
      <div className="space-y-4">
        {ordered.map((h) => {
          const c = COUPLING_COPY[h.couplingId];
          if (!c) return null;

          return (
            <div
              key={h.couplingId}
              role="status"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{c.gist}</p>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-indigo-700 border border-indigo-200 uppercase">
                    {h.tier}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-slate-600">{c.explanation}</p>
                
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                   <p className="text-sm font-medium text-emerald-800">{c.notAnOutageLine}</p>
                </div>

                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-900">Next step:</span> {c.safeNextStep}
                </p>
              </div>

              {Array.isArray(h.evidenceRefs) && h.evidenceRefs.length > 0 ? (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Verified anchors</p>
                  <ul className="mt-2 list-disc pl-5 text-xs text-slate-500 space-y-1">
                    {h.evidenceRefs.slice(0, 4).map((ref, idx) => (
                      <li key={idx} className="break-words leading-relaxed">
                        {ref}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}

        <div role="note" className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-900">{COUPLING_INFERENCE_BOUNDARY.title}</p>
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 space-y-2">
            {COUPLING_INFERENCE_BOUNDARY.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}