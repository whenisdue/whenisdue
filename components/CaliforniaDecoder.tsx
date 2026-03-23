'use client';

import React, { useState, useMemo } from 'react';
import { calculateSmartDate } from '@/lib/smart-dates';
import { format } from 'date-fns';
import { Landmark, Info } from 'lucide-react';

export default function CaliforniaDecoder({ rules }: { rules: any[] }) {
  const [digit, setDigit] = useState('');

  const resultDate = useMemo(() => {
    if (digit !== '') {
      const rule = rules.find(r => r.triggerStart === digit);
      return rule ? calculateSmartDate(rule, 4, 2026) : null;
    }
    return null;
  }, [digit, rules]);

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 shadow-2xl p-8 max-w-md w-full flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="bg-orange-600 p-3 rounded-xl text-white shadow-lg shadow-orange-100">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">CalFresh Finder</h3>
          <p className="text-xs font-black text-orange-600 uppercase tracking-widest">Case-Based Schedule</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black uppercase text-slate-500 tracking-widest px-1">
          Last Digit of your Case Number
        </label>
        <div className="grid grid-cols-5 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((num) => (
            <button
              key={num}
              onClick={() => setDigit(num)}
              className={`py-4 rounded-xl font-black text-xl transition-all border-4 ${
                digit === num ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              {num === "0" ? "0 (10th)" : num}
            </button>
          ))}
        </div>
      </div>

      {resultDate && (
        <div className="bg-orange-600 rounded-3xl p-8 text-white text-center shadow-xl shadow-orange-100 animate-in zoom-in-95 duration-300">
          <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Expected Deposit Date</p>
          <p className="text-3xl font-black">{format(resultDate, 'EEEE, MMMM d')}</p>
        </div>
      )}

      <div className="bg-slate-50 p-4 rounded-2xl flex gap-3 items-start border border-slate-100">
        <Info className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
          California issues benefits on the same day every month, including weekends and holidays.
        </p>
      </div>
    </div>
  );
}