'use client';

import React, { useState, useEffect } from 'react';
import { calculateSmartDate } from '@/lib/smart-dates';
import type { OffsetStrategy } from '@/lib/smart-dates';
import { format } from 'date-fns';

// --- STRICT CONTRACT ---
interface TexasDecoderRule {
  identifierFrom?: string;
  identifierTo?: string;
  triggerStart?: string;
  triggerEnd?: string;
  nominalDepositDay?: number;
  baseDay?: number;
  cohortKey: 'PRE_JUNE_2020' | 'POST_JUNE_2020';
  offsetStrategy?: string;
}

interface TexasDecoderProps {
  rules: TexasDecoderRule[];
  month?: number;
  year?: number;
}

/**
 * 🏛️ STRATEGY NORMALIZER
 * Maps database long-form strings to the engine's strict OffsetStrategy type.
 */
const normalizeStrategy = (input?: string): OffsetStrategy => {
  const mapping: Record<string, OffsetStrategy> = {
    'PREVIOUS_BUSINESS_DAY': 'PREV_BUSINESS_DAY', // Aligned to engine key
    'NEXT_BUSINESS_DAY': 'NEXT_BUSINESS_DAY',
    'SAME_DAY': 'EXACT_CALENDAR_DATE',            // Aligned to engine key
    'NO_SHIFT': 'EXACT_CALENDAR_DATE'             // Aligned to engine key
  };

  if (input && mapping[input]) {
    return mapping[input];
  }
  
  return 'EXACT_CALENDAR_DATE'; // Default Sovereign Fallback
};

export default function TexasDecoder({ rules, month = 4, year = 2026 }: TexasDecoderProps) {
  const [cohort, setCohort] = useState<'PRE_JUNE_2020' | 'POST_JUNE_2020'>('POST_JUNE_2020');
  const [digits, setDigits] = useState('');
  const [resultDate, setResultDate] = useState<Date | null>(null);

  useEffect(() => {
    // 1. Length Guard
    const expectedLength = cohort === 'PRE_JUNE_2020' ? 1 : 2;
    if (digits.length !== expectedLength) {
      setResultDate(null);
      return;
    }

    const inputNum = parseInt(digits, 10);

    // 2. Sovereign Range Matching
    const match = rules.find((r) => {
      if (r.cohortKey !== cohort) return false;

      const startStr = r.identifierFrom || r.triggerStart;
      const endStr = r.identifierTo || r.triggerEnd || startStr;

      if (!startStr || !endStr) return false;
      
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      return inputNum >= start && inputNum <= end;
    });

    if (match) {
      // 3. Normalization Gate
      const strategy = normalizeStrategy(match.offsetStrategy);

      const adaptedRule = {
        triggerStart: match.identifierFrom || match.triggerStart || '',
        triggerEnd: match.identifierTo || match.triggerEnd || '',
        baseDay: match.nominalDepositDay || match.baseDay || 1,
        offsetStrategy: strategy
      };
      
      setResultDate(calculateSmartDate(adaptedRule, month, year));
    } else {
      setResultDate(null);
    }
  }, [digits, cohort, rules, month, year]);

  return (
    <div className="bg-[#0f172a] rounded-[2.5rem] p-8 max-w-md w-full text-white shadow-2xl flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">1. When were you certified?</label>
        <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
          <button 
            onClick={() => { setCohort('PRE_JUNE_2020'); setDigits(''); }}
            className={`flex-1 p-4 rounded-xl font-black text-xs transition-all ${cohort === 'PRE_JUNE_2020' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Before June 1, 2020
          </button>
          <button 
            onClick={() => { setCohort('POST_JUNE_2020'); setDigits(''); }}
            className={`flex-1 p-4 rounded-xl font-black text-xs transition-all ${cohort === 'POST_JUNE_2020' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            June 1, 2020 or Later
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
          {cohort === 'PRE_JUNE_2020' ? '2. Last digit of EDG #' : '2. Last two digits of EDG #'}
        </label>
        <input
          type="text"
          maxLength={cohort === 'PRE_JUNE_2020' ? 1 : 2}
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
          placeholder={cohort === 'PRE_JUNE_2020' ? "0" : "00"}
          className="w-full bg-slate-900 border-4 border-slate-800 rounded-2xl p-6 text-5xl font-black text-white focus:border-blue-600 outline-none text-center transition-all placeholder:text-slate-800"
        />
      </div>

      <div className="h-[148px] flex flex-col justify-center">
        {resultDate ? (
          <div className="bg-blue-600 rounded-[2rem] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300 border-b-8 border-blue-800/50">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2">Estimated Deposit</p>
            <p className="text-4xl font-black tracking-tighter mb-1">{format(resultDate, 'EEEE')}</p>
            <p className="text-2xl font-black text-blue-100 opacity-90">{format(resultDate, 'MMMM d, yyyy')}</p>
          </div>
        ) : (
          <div className="h-full border-4 border-dashed border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-700 font-black italic">
            {digits.length > 0 ? 'Finishing digits...' : 'Awaiting Case Digits...'}
          </div>
        )}
      </div>
    </div>
  );
}