"use client";

import { useState } from "react";
import { format, parseISO, addMinutes } from "date-fns";
import TransparencyCard from "./TransparencyCard";
import IntegrityFailureView from "./IntegrityFailureView";
import { SearchResponse } from "@/lib/search/types";

/**
 * UTC-Safe Date Formatter
 */
const formatDateUTC = (isoString: string, pattern: string) => {
  const date = parseISO(isoString);
  const utcDate = addMinutes(date, date.getTimezoneOffset());
  return format(utcDate, pattern);
};

export default function SmartSearchBox() {
  const [result, setResult] = useState<SearchResponse | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* ... [Search Input UI remains here] ... */}

      {result && (
        <div className="mt-8 space-y-6">
          {(() => {
            switch (result.type) {
              case 'EXACT_ANSWER':
                return (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
                      <p className="text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase mb-3">
                        Confirmed Deposit Date
                      </p>
                      <h2 className="text-6xl font-black text-slate-900 tracking-tighter">
                        {formatDateUTC(result.date, 'MMMM do')}
                      </h2>
                      <div className="mt-4 mb-6 flex flex-col items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 uppercase">
                          {result.stateName} • {result.program}
                        </span>
                        <p className="text-sm text-slate-400 font-medium italic">
                          Derived from {result.identifierLabel} <span className="text-slate-900 font-bold">"{result.match}"</span>
                        </p>
                      </div>

                      <TransparencyCard {...result} />
                    </div>
                    
                    <div className="mt-6 text-center">
                      <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.15em]">
                        Schedule Rule Version: {result.ruleVersion}
                      </p>
                    </div>
                  </div>
                );

              case 'PARTIAL_GUIDANCE':
                return (
                  <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 animate-in fade-in">
                    <h3 className="font-bold text-blue-900">{result.message}</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.examples.map((ex, i) => (
                        <span key={i} className="bg-white px-3 py-1 rounded-lg text-xs font-bold text-blue-600 border border-blue-200">
                          e.g., {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                );

              case 'INVALID_IDENTIFIER':
                return (
                  <div className="bg-red-50 border border-red-100 rounded-3xl p-8 animate-in head-shake">
                    <h3 className="font-bold text-red-900">Format Required</h3>
                    <p className="text-red-700 text-sm mt-1">{result.message}</p>
                    <p className="text-red-500 text-[10px] font-black uppercase mt-4 tracking-wider">
                      Expected: {result.expectedKind.replace(/_/g, ' ')}
                    </p>
                  </div>
                );

              case 'INTEGRITY_FAILURE':
                return <IntegrityFailureView />;

              case 'NO_MATCH':
                return (
                  <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                    <p className="text-slate-500 font-medium">No record found. Please check your case info.</p>
                  </div>
                );

              case 'SERVER_ERROR':
                return (
                  <div className="p-4 bg-red-900 text-white rounded-xl text-center font-bold text-xs uppercase tracking-widest">
                    System Unavailable • {result.message}
                  </div>
                );

              default:
                // TypeScript exhaustiveness guard
                const _exhaustiveCheck: never = result;
                return null;
            }
          })()}
        </div>
      )}
    </div>
  );
}