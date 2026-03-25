'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { calculateSmartDate } from '@/lib/smart-dates';
import { format } from 'date-fns';
import { Search, ExternalLink } from 'lucide-react';

export default function PennsylvaniaDecoder({ rules }: { rules: any[] }) {
  const router = useRouter();
  const [digit, setDigit] = useState('');
  const [resultDate, setResultDate] = useState<Date | null>(null);

  const currentMonth = new Date().getMonth() + 1; 
  const currentYear = 2026; 

  useEffect(() => {
    if (digit.length === 1) {
      const matched = rules.find(r => r.triggerStart === digit);
      if (matched) setResultDate(calculateSmartDate(matched, currentMonth, currentYear));
    } else {
      setResultDate(null);
    }
  }, [digit, rules, currentMonth]);

  const handleDeepLink = () => {
    if (digit.length === 1) {
      const monthKey = String(currentMonth).padStart(2, '0');
      const slug = `pennsylvania-snap-d${digit}-m${monthKey}-${currentYear}`;
      router.push(`/s/snap/${slug}`);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 shadow-2xl p-8 max-w-md w-full flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-100">
          <Search className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">PA Benefit Finder</h3>
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest">10-Digit Cycle</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black uppercase text-slate-500 tracking-widest px-1">
          Last Digit of Case ID
        </label>
        <input
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => setDigit(e.target.value.replace(/\D/g, ''))}
          placeholder="0"
          className="w-full bg-slate-50 border-4 border-slate-200 rounded-2xl p-6 text-5xl font-black text-slate-900 focus:border-blue-600 outline-none transition-all placeholder:text-slate-200"
        />
      </div>

      {resultDate && (
        <button 
          onClick={handleDeepLink}
          className="bg-blue-600 rounded-3xl p-8 text-white text-center shadow-xl shadow-blue-100 animate-in zoom-in-95 duration-300 w-full hover:bg-blue-700 transition-colors group"
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