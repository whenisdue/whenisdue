'use client';

import React, { useState, useEffect } from 'react';
import { calculateSmartDate, NewYorkCohort, OffsetStrategy } from '@/lib/smart-dates';
import { format } from 'date-fns';
import { Search, Info } from 'lucide-react';

export type NewYorkDecoderRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: OffsetStrategy;
  cohortKey: 'UPSTATE';
};

export default function NewYorkUpstateDecoder({ rules }: { rules: NewYorkDecoderRule[] }) {
  const [letter, setLetter] = useState('');
  const [resultDate, setResultDate] = useState<Date | null>(null);

  useEffect(() => {
    if (letter) {
      const charCode = letter.toUpperCase().charCodeAt(0);
      const matched = rules.find(r => {
        const start = r.triggerStart.charCodeAt(0);
        const end = (r.triggerEnd || r.triggerStart).charCodeAt(0);
        return charCode >= start && charCode <= end;
      });

      if (matched) {
        setResultDate(calculateSmartDate(matched, 4, 2026));
      }
    }
  }, [letter, rules]);

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 shadow-2xl p-8 max-w-md w-full">
      <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white"><Search className="w-6 h-6"/></div>
        Upstate NY Finder
      </h3>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-black uppercase text-slate-500 tracking-widest">
            Last Name Starts With:
          </label>
          <select 
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            className="w-full bg-slate-100 border-4 border-slate-200 rounded-2xl p-5 text-2xl font-black appearance-none outline-none focus:border-blue-600"
          >
            <option value="">Select Initial...</option>
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {resultDate && (
          <div className="bg-blue-600 rounded-3xl p-8 text-white text-center animate-in zoom-in-95 duration-300">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 text-blue-200">Expected Deposit Date</p>
            <p className="text-4xl font-black">{format(resultDate, 'MMMM d')}</p>
          </div>
        )}
      </div>
    </div>
  );
}