'use client';

import React, { useState, useEffect } from 'react';
import { calculateSmartDate } from '@/lib/smart-dates';
import { DateOffsetStrategy } from '@prisma/client';
import { format } from 'date-fns';
import { Search, Info, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

// 🚀 PATH TO GREEN: Narrowed, serializable type contract
export type FloridaDecoderRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: DateOffsetStrategy;
};

interface Props {
  rules: FloridaDecoderRule[];
  month?: number; // Defaults to 4 (April)
  year?: number;  // Defaults to 2026
}

export default function FloridaDecoder({ rules, month = 4, year = 2026 }: Props) {
  const [digits, setDigits] = useState('');
  const [resultDate, setResultDate] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (digits.length === 2) {
      const inputNum = parseInt(digits);
      
      const matchedRule = rules.find(r => {
        const start = parseInt(r.triggerStart);
        const end = parseInt(r.triggerEnd || r.triggerStart);
        return inputNum >= start && inputNum <= end;
      });

      if (matchedRule) {
        const date = calculateSmartDate(matchedRule, month, year);
        setResultDate(date);
        setHasError(false);
      } else {
        setResultDate(null);
        setHasError(true);
      }
    } else {
      setResultDate(null);
      setHasError(false);
    }
  }, [digits, rules, month, year]);

  return (
    <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl p-8 max-w-md w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">Case Decoder</h3>
          {/* 🚀 PATH TO GREEN: Explicit date scope in UI */}
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em]">
            Official April {year} Schedule
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">
            9th & 8th Digits of Case Number
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            placeholder="00"
            value={digits}
            onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-4xl font-black text-slate-900 focus:border-blue-500 focus:bg-white transition-all outline-none placeholder:text-slate-200"
          />
        </div>

        {resultDate && (
          <div className="animate-in zoom-in-95 fade-in duration-300">
            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] p-6 text-center shadow-inner">
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Expected Deposit Date</p>
              <p className="text-3xl font-black text-emerald-950">
                {format(resultDate, 'MMMM d, yyyy')}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-tight">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Weekend & Holiday Adjusted</span>
              </div>
            </div>
          </div>
        )}

        {/* 🚀 PATH TO GREEN: Clear Error State */}
        {hasError && (
          <div className="animate-in shake-1 duration-300 bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-6 flex flex-col items-center gap-2">
            <XCircle className="w-6 h-6 text-rose-500" />
            <p className="text-sm font-black text-rose-900">Invalid Digits</p>
            <p className="text-[10px] font-bold text-rose-400 uppercase">Check your case number and try again</p>
          </div>
        )}

        {!resultDate && !hasError && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] p-10 text-center">
            <Info className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400 leading-relaxed px-4">
              Enter your digits to see your <br/> personalized schedule.
            </p>
          </div>
        )}

        <div className="flex items-start gap-3 bg-slate-900 p-5 rounded-2xl">
          <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[10px] leading-relaxed font-bold text-slate-400">
            <span className="text-white">Note:</span> Florida issuance is determined by the 9th and 8th digits of your case number (skipping the very last digit).
          </p>
        </div>
      </div>
    </div>
  );
}