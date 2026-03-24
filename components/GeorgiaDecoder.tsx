'use client';

import React, { useState, useEffect } from 'react';
import { calculateSmartDate } from '@/lib/smart-dates';
import { format } from 'date-fns';
import { Search, Info } from 'lucide-react';

export default function GeorgiaDecoder({ rules }: { rules: any[] }) {
  const [digits, setDigits] = useState('');
  const [resultDate, setResultDate] = useState<Date | null>(null);

  useEffect(() => {
    if (digits.length === 2) {
      const inputNum = parseInt(digits);
      const matched = rules.find(r => {
        const s = parseInt(r.triggerStart);
        const e = parseInt(r.triggerEnd || r.triggerStart);
        return inputNum >= s && inputNum <= e;
      });
      if (matched) setResultDate(calculateSmartDate(matched, 4, 2026));
    } else {
      setResultDate(null);
    }
  }, [digits, rules]);

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 shadow-2xl p-8 max-w-md w-full flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="bg-red-600 p-3 rounded-xl text-white shadow-lg shadow-red-100">
          <Search className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">Georgia Finder</h3>
          <p className="text-xs font-black text-red-600 uppercase tracking-widest">20-Day Stagger</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black uppercase text-slate-500 tracking-widest px-1">
          Last 2 Digits of Case ID
        </label>
        <input
          type="text"
          maxLength={2}
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
          placeholder="00"
          className="w-full bg-slate-50 border-4 border-slate-200 rounded-2xl p-6 text-5xl font-black text-slate-900 focus:border-red-600 outline-none transition-all placeholder:text-slate-200"
        />
      </div>

      {resultDate && (
        <div className="bg-red-600 rounded-3xl p-8 text-white text-center shadow-xl shadow-red-100 animate-in zoom-in-95 duration-300">
          <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Deposit Expected</p>
          <p className="text-3xl font-black">{format(resultDate, 'EEEE, MMMM d')}</p>
          <p className="text-[10px] font-black uppercase mt-2 opacity-60">Weekend Adjusted</p>
        </div>
      )}
    </div>
  );
}