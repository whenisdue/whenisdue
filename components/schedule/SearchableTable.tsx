"use client";

import { useState, useRef, useEffect } from "react";
import { format, isWeekend } from "date-fns";

type EventRow = {
  id: string;
  identifierMatch: string;
  depositDate: Date;
};

export default function SearchableTable({ events, identifierKind }: { events: EventRow[], identifierKind: string }) {
  const [query, setQuery] = useState("");
  const activeRowRef = useRef<HTMLTableRowElement>(null);

  const checkMatch = (rangeStr: string, input: string) => {
    if (!input) return false;
    
    const cleanInput = input.trim().toUpperCase();
    const parts = rangeStr.split("-").map(p => p.trim().toUpperCase());
    
    if (parts.length === 2) {
      const [min, max] = parts;
      let formattedInput = cleanInput;
      if (!isNaN(Number(cleanInput)) && min.length > cleanInput.length) {
        formattedInput = cleanInput.padStart(min.length, '0');
      }
      return formattedInput >= min && formattedInput <= max;
    }
    return cleanInput === parts[0];
  };

  useEffect(() => {
    if (query && activeRowRef.current) {
      activeRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [query]);

  const kindLabel = identifierKind.replace(/_/g, ' ');

  return (
    <div>
      {/* Search Input Box - Mobile Optimized & Sticky */}
      <div className="mb-6 sticky top-2 z-20 px-1 md:px-0">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
            <span className="text-slate-400">🔍</span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Enter your ${kindLabel}...`}
            className="w-full bg-slate-900/80 backdrop-blur-2xl border border-white/10 text-white placeholder-slate-500 rounded-2xl pl-12 pr-4 py-5 md:py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] text-lg md:text-base"
          />
        </div>
      </div>

      {/* Caseworker-Grade Data Table */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/[0.03] border-b border-white/10">
            <tr>
              <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                Identifier Group
              </th>
              <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] text-right">
                Deposit Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((event) => {
              const dateObj = new Date(event.depositDate);
              const isSatSun = isWeekend(dateObj);
              const isHighlighted = checkMatch(event.identifierMatch, query);

              return (
                <tr 
                  key={event.id} 
                  ref={isHighlighted ? activeRowRef : null}
                  className={`group transition-all duration-300 ${
                    isHighlighted 
                      ? "bg-blue-500/20 shadow-[inset_4px_0_0_0_#3b82f6]" 
                      : query ? "opacity-30" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <td className="p-6">
                    <span className={`font-mono text-sm tracking-tight ${isHighlighted ? "text-blue-300 font-bold" : "text-slate-300"}`}>
                      {event.identifierMatch}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-base transition-colors ${isHighlighted ? "font-black text-white" : "font-bold text-white group-hover:text-blue-400"}`}>
                        {format(dateObj, "EEEE, MMMM do")}
                      </span>
                      {isSatSun && (
                        <span className="text-[10px] font-bold text-amber-500/80 uppercase mt-1">
                          Bank processing may vary
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}