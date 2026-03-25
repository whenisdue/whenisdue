'use client';

import React, { useState, useEffect } from 'react';
// 🛡️ CRITICAL FIX: Must import from next/navigation for App Router
import { useRouter } from 'next/navigation'; 
import { calculateSmartDate } from '@/lib/smart-dates';
import { format } from 'date-fns';
import { Search, Info, ExternalLink } from 'lucide-react';

export default function GeorgiaDecoder({ rules }: { rules: any[] }) {
  const router = useRouter();
  const [digits, setDigits] = useState('');
  const [resultDate, setResultDate] = useState<Date | null>(null);

  const year = 2026;

  useEffect(() => {
    if (digits.length === 2) {
      const inputNum = parseInt(digits);
      const matched = rules.find(r => {
        const s = parseInt(r.triggerStart);
        const e = parseInt(r.triggerEnd || r.triggerStart);
        return inputNum >= s && inputNum <= e;
      });
      // Verification: Engine uses April (4) for the 2026 anchor logic
      if (matched) setResultDate(calculateSmartDate(matched, 4, 2026));
    } else {
      setResultDate(null);
    }
  }, [digits, rules]);

  const handleDeepLink = () => {
    if (digits.length === 2) {
      // 🛡️ Logic: Navigates to the unique, indexable slug in the database
      const slug = `georgia-snap-d${digits}-m04-${year}`;
      router.push(`/s/snap/${slug}`);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 shadow-2xl p-8 max-w-md w-full flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="bg-red-600 p-3 rounded-xl text-white shadow-lg shadow-red-100">
          <Search className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">Georgia Finder</h3>
          <p className="text-xs font-black text-red-600 uppercase tracking-widest">100-Digit Model</p>
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
        <button 
          onClick={handleDeepLink}
          className="bg-red-600 rounded-3xl p-8 text-white text-center shadow-xl shadow-red-100 animate-in zoom-in-95 duration-300 w-full hover:bg-red-700 transition-colors group"
        >
          <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Deposit Expected</p>
          <p className="text-3xl font-black">{format(resultDate, 'EEEE, MMMM d')}</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] font-black uppercase opacity-60 group-hover:opacity-100 transition-opacity">
            View Official Schedule <ExternalLink className="w-3 h-3" />
          </div>
        </button>
      )}
    </div>
  );
}