'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSmartDate, TexasCohort } from '@/lib/smart-dates';
import { format } from 'date-fns';
import { Search, Calendar, ArrowRight, ExternalLink } from 'lucide-react';

export type TexasDecoderRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: any;
  cohortKey: TexasCohort | null;
};

interface Props {
  rules: TexasDecoderRule[];
}

export default function TexasDecoder({ rules }: Props) {
  const router = useRouter();
  const [cohort, setCohort] = useState<TexasCohort | null>(null);
  const [digits, setDigits] = useState('');
  const [resultDate, setResultDate] = useState<Date | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = 2026;

  useEffect(() => {
    const expectedLength = cohort === 'PRE_JUNE_2020' ? 1 : 2;
    if (cohort && digits.length === expectedLength) {
      const matched = rules.find(r => r.cohortKey === cohort && r.triggerStart === digits);
      if (matched) {
        setResultDate(calculateSmartDate(matched, currentMonth, currentYear));
      }
    } else {
      setResultDate(null);
    }
  }, [digits, cohort, rules, currentMonth]);

  const handleDeepLink = () => {
    if (!cohort || !digits) return;
    const cohortSlug = cohort === 'PRE_JUNE_2020' ? 'standard' : 'modern';
    const monthKey = currentMonth.toString().padStart(2, '0');
    const slug = `texas-snap-${cohortSlug}-d${digits}-m${monthKey}-${currentYear}`;
    router.push(`/s/snap/${slug}`);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 shadow-2xl p-8 max-w-md w-full flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="bg-blue-700 p-3 rounded-xl text-white shadow-lg shadow-blue-100">
          <Search className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">Texas Case Finder</h3>
          <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Lone Star Card Schedule</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">1. When were you certified?</p>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => { setCohort('PRE_JUNE_2020'); setDigits(''); }}
              className={`p-4 rounded-2xl text-left border-4 transition-all ${cohort === 'PRE_JUNE_2020' ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
            >
              <p className="font-black text-slate-900 leading-none">Before June 1, 2020</p>
              <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">Legacy Schedule</p>
            </button>
            <button 
              onClick={() => { setCohort('POST_JUNE_2020'); setDigits(''); }}
              className={`p-4 rounded-2xl text-left border-4 transition-all ${cohort === 'POST_JUNE_2020' ? 'border-blue-600 bg-blue-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
            >
              <p className="font-black text-slate-900 leading-none">June 1, 2020 or Later</p>
              <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">Modern Schedule</p>
            </button>
          </div>
        </div>

        {cohort && (
          <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
              2. {cohort === 'PRE_JUNE_2020' ? 'Last Digit' : 'Last Two Digits'} of EDG #
            </p>
            <input
              type="text"
              maxLength={cohort === 'PRE_JUNE_2020' ? 1 : 2}
              value={digits}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
              placeholder={cohort === 'PRE_JUNE_2020' ? '0' : '00'}
              className="w-full bg-slate-50 border-4 border-slate-200 rounded-2xl p-6 text-5xl font-black text-slate-900 focus:border-blue-600 outline-none transition-all placeholder:text-slate-200"
            />
          </div>
        )}

        {resultDate && (
          <button 
            onClick={handleDeepLink}
            className="w-full bg-blue-700 rounded-[2rem] p-8 text-white text-center shadow-xl hover:bg-blue-800 transition-all group animate-in zoom-in-95 duration-300"
          >
            <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Estimated Deposit</p>
            <p className="text-3xl font-black">{format(resultDate, 'EEEE, MMM d')}</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-[10px] font-black uppercase opacity-60 group-hover:opacity-100 transition-opacity">
              View Your Full Schedule <ExternalLink className="w-3 h-3" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}