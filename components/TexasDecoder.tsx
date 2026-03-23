'use client';

import React, { useState, useEffect } from 'react';
import { calculateSmartDate, TexasCohort, OffsetStrategy } from '@/lib/smart-dates';
import { format } from 'date-fns';
import { Search } from 'lucide-react';

export type TexasDecoderRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: OffsetStrategy;
  cohortKey: TexasCohort | null;
};

interface Props {
  rules: TexasDecoderRule[];
}

export default function TexasDecoder({ rules }: Props) {
  const [cohort, setCohort] = useState<TexasCohort | null>(null);
  const [digits, setDigits] = useState('');
  const [resultDate, setResultDate] = useState<Date | null>(null);

  useEffect(() => {
    const expectedLength = cohort === 'PRE_JUNE_2020' ? 1 : 2;
    
    if (cohort && digits.length === expectedLength) {
      const inputNum = parseInt(digits);
      
      const matchedRules = rules.filter(r => {
        const start = parseInt(r.triggerStart);
        const end = parseInt(r.triggerEnd || r.triggerStart);
        return r.cohortKey === cohort && inputNum >= start && inputNum <= end;
      });

      if (matchedRules.length === 1) {
        setResultDate(calculateSmartDate(matchedRules[0], 4, 2026));
      } else {
        setResultDate(null);
      }
    } else {
      setResultDate(null);
    }
  }, [digits, cohort, rules]);

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 shadow-2xl p-8 max-w-md w-full">
      <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white"><Search className="w-6 h-6"/></div>
        Texas Case Finder
      </h3>

      <div className="space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-black text-slate-600 uppercase tracking-widest">1. When did you apply for SNAP?</p>
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={() => { setCohort('PRE_JUNE_2020'); setDigits(''); }}
              className={`p-5 rounded-2xl text-left border-4 transition-all ${cohort === 'PRE_JUNE_2020' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
            >
              <p className="font-black text-lg text-slate-900">Before June 1, 2020</p>
            </button>
            <button 
              onClick={() => { setCohort('POST_JUNE_2020'); setDigits(''); }}
              className={`p-5 rounded-2xl text-left border-4 transition-all ${cohort === 'POST_JUNE_2020' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
            >
              <p className="font-black text-lg text-slate-900">June 1, 2020 or Later</p>
            </button>
          </div>
        </div>

        {cohort && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4">
            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">
              2. {cohort === 'PRE_JUNE_2020' ? 'Last Digit' : 'Last Two Digits'} of EDG Number
            </p>
            <input
              type="text"
              maxLength={cohort === 'PRE_JUNE_2020' ? 1 : 2}
              value={digits}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-100 border-4 border-slate-200 rounded-2xl px-6 py-5 text-4xl font-black text-slate-900 focus:border-blue-600 outline-none"
            />
          </div>
        )}

        {resultDate && (
          <div className="bg-green-600 rounded-3xl p-8 text-white text-center shadow-xl shadow-green-100 animate-in zoom-in-95 duration-300">
            {/* 🚀 FIXED: Added EEEE for day name */}
            <p className="text-3xl md:text-4xl font-black leading-tight">
              {format(resultDate, 'EEEE, MMMM d')}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-2">Weekend Adjusted</p>
          </div>
        )}
      </div>
    </div>
  );
}