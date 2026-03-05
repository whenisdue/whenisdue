import React from "react";
import Link from "next/link";

export default function TemporalMesh({ currentEvent, allEvents }: { currentEvent: any; allEvents: any[] }) {
  if (currentEvent.category !== "federal") return null;

  // Extract base series and year from eventId (e.g., ssa-us-payments-2026 -> base: ssa-us-payments, year: 2026)
  const idMatch = currentEvent.eventId?.match(/^(.*)-(\d{4})$/);
  const baseSeries = idMatch ? idMatch[1] : currentEvent.eventId;
  const currentYear = idMatch ? parseInt(idMatch[2]) : 0;

  // 1. Other Years (Same series, different year)
  const otherYears = allEvents
    .filter(e => e.eventId !== currentEvent.eventId && e.eventId?.startsWith(baseSeries))
    .sort((a, b) => a.eventId.localeCompare(b.eventId));

  const prevYear = otherYears.reverse().find(e => parseInt(e.eventId.match(/-(\d{4})$/)?.[1] || "0") < currentYear);
  const nextYear = otherYears.reverse().find(e => parseInt(e.eventId.match(/-(\d{4})$/)?.[1] || "0") > currentYear);

  // 2. Related (Same program prefix like "ssa", different series)
  const programPrefix = baseSeries.split("-")[0]; // e.g., "ssa"
  const related = allEvents
    .filter(e => e.category === "federal" && e.eventId?.startsWith(programPrefix) && !e.eventId?.startsWith(baseSeries))
    .sort((a, b) => {
      // Prioritize same year
      const aYear = parseInt(a.eventId?.match(/-(\d{4})$/)?.[1] || "0");
      const bYear = parseInt(b.eventId?.match(/-(\d{4})$/)?.[1] || "0");
      return Math.abs(aYear - currentYear) - Math.abs(bYear - currentYear);
    }).slice(0, 2); // Max 2 related

  if (!prevYear && !nextYear && related.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-slate-200">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Federal Timeline & Related</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        
        {(prevYear || nextYear) && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500 mb-3">OTHER YEARS</h4>
            <ul className="space-y-2 text-sm">
              {prevYear && <li><Link href={`/${prevYear.canonicalSlug}`} className="text-blue-600 hover:underline">← {prevYear.eventName || prevYear.title}</Link></li>}
              {nextYear && <li><Link href={`/${nextYear.canonicalSlug}`} className="text-blue-600 hover:underline">{nextYear.eventName || nextYear.title} →</Link></li>}
            </ul>
          </div>
        )}

        {related.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500 mb-3">RELATED PROGRAMS</h4>
            <ul className="space-y-2 text-sm">
              {related.map(r => (
                <li key={r.eventId}><Link href={`/${r.canonicalSlug}`} className="text-blue-600 hover:underline">{r.eventName || r.title}</Link></li>
              ))}
              <li><Link href="/federal" className="text-slate-600 hover:underline font-medium block mt-2">View Federal Hub</Link></li>
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}