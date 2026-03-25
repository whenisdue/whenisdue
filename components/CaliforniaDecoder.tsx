'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSmartDate } from '@/lib/smart-dates';
import { format } from 'date-fns';
import { Landmark, Info, ExternalLink, Search } from 'lucide-react';

export default function CaliforniaDecoder({ rules }: { rules: any[] }) {
  const router = useRouter();
  const [digits, setDigits] = useState('');
  const [resultDate, setResultDate] = useState<Date | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = 2026;

  useEffect(() => {
    if (digits.length === 2) {
      const matched = rules.find(r => r.triggerStart === digits);
      if (matched) {
        setResultDate(calculateSmartDate(matched, currentMonth, currentYear));
      }
    } else {
      setResultDate(null);
    }
  }, [digits, rules, currentMonth]);

  const handleDeepLink = () => {
    if (digits.length === 2) {
      const monthKey = currentMonth.toString().padStart(2, '0');
      const slug = `california-snap-d${digits}-m${monthKey}-${currentYear}`;
      router.push(`/s/snap/${slug}`);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 shadow-2xl p-8 max-w-md w-full flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="bg-orange-600 p-3 rounded-xl text-white shadow-lg shadow-orange-100">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">CalFresh Finder</h3>
          <p className="text-xs font-black text-orange-600 uppercase tracking-widest">100-Digit Model</p>
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
          className="w-full bg-slate-50 border-4 border-slate-200 rounded-2xl p-6 text-5xl font-black text-slate-900 focus:border-orange-600 outline-none transition-all placeholder:text-slate-200"
        />
      </div>

      {resultDate && (
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
          <div className="bg-orange-50 rounded-2xl p-5 text-center border-b-4 border-orange-100">
            <p className="text-[10px] font-black uppercase text-orange-500 mb-1 tracking-widest">California Rule</p>
            <p className="text-sm font-bold text-slate-800 leading-tight">
              Digit <span className="text-orange-600 underline">{digits.slice(-1)}</span> determines your set date.
            </p>
          </div>

          <button 
            onClick={handleDeepLink}
            className="w-full group"
          >
            <div className="bg-orange-600 rounded-[2.5rem] p-6 text-center shadow-xl hover:bg-orange-700 transition-all">
              <p className="text-xs font-black uppercase text-orange-100 mb-1">Expected Deposit</p>
              <p className="text-2xl font-black text-white">{format(resultDate, 'EEEE, MMM d')}</p>
              <div className="mt-3 flex items-center justify-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-widest">
                <ExternalLink className="w-3 h-3" />
                <span>View Full California Schedule</span>
              </div>
            </div>
          </button>
        </div>
      )}

      <div className="bg-slate-900 p-6 rounded-2xl flex gap-4 items-start shadow-inner">
        <Info className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed font-bold text-slate-300">
          <span className="text-white font-black uppercase tracking-tighter mr-1">Note:</span>
          California issues on the same date every month, including weekends and holidays.
        </p>
      </div>
    </div>
  );
}