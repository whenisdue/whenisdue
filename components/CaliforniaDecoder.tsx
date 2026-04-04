'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSmartDate } from '@/lib/smart-dates';
import { format, setDate } from 'date-fns';
import { Landmark, Info, ExternalLink } from 'lucide-react';

export default function CaliforniaDecoder({ rules }: { rules: any[] }) {
  const router = useRouter();
  const [digits, setDigits] = useState('');

  const currentMonth = new Date().getMonth() + 1; // 4 (April)
  const currentYear = 2026;

  const resultDate = useMemo(() => {
    if (digits.length < 1) return null;
    const targetDigit = digits.slice(-1);
    
    // Attempt to find in database rules first
    const matched = rules?.find(r => r.triggerStart === targetDigit);
    if (matched) {
      return calculateSmartDate(matched, currentMonth, currentYear);
    }

    // Fallback: Standard California 1-Digit Logic (Digit = Day)
    const day = targetDigit === '0' ? 10 : parseInt(targetDigit);
    const baseDate = new Date(currentYear, currentMonth - 1, 1);
    return setDate(baseDate, day);
  }, [digits, rules, currentMonth]);

  const handleDeepLink = () => {
    if (digits.length >= 1) {
      const targetDigit = digits.slice(-1);
      const monthKey = currentMonth.toString().padStart(2, '0');
      const slug = `california-snap-d${targetDigit}-m${monthKey}-${currentYear}`;
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
          <p className="text-xs font-black text-orange-600 uppercase tracking-widest">Sovereign 1-Digit Model</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black uppercase text-slate-500 tracking-widest px-1">
          Last Digit of Case ID
        </label>
        <input
          type="text"
          maxLength={1}
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
          placeholder="0"
          className="w-full bg-slate-50 border-4 border-slate-200 rounded-2xl p-6 text-5xl font-black text-slate-900 focus:border-orange-600 outline-none transition-all placeholder:text-slate-200"
        />
      </div>

      {resultDate && (
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
          <button onClick={handleDeepLink} className="w-full group text-left">
            <div className="bg-orange-600 rounded-[2.5rem] p-8 text-white text-center shadow-2xl shadow-orange-500/20 hover:bg-orange-700 transition-all border-b-8 border-orange-800/50">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-200 mb-2">Sovereign Verification</p>
              <p className="text-4xl font-black tracking-tighter mb-1">{format(resultDate, 'EEEE')}</p>
              <p className="text-2xl font-black text-orange-100 opacity-90">{format(resultDate, 'MMMM d, yyyy')}</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
                <ExternalLink className="w-3 h-3" />
                <span>Expand Full Audit Trail</span>
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