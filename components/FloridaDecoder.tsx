'use client';

import React, { useState, useEffect } from 'react';
import { calculateSmartDate } from '@/lib/smart-dates';
import { OffsetStrategy } from '@/lib/smart-dates';
import { format } from 'date-fns';
import { Search, Info, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export type FloridaDecoderRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: OffsetStrategy;
};

interface Props {
  rules: FloridaDecoderRule[];
  month?: number;
  year?: number;
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
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-200 shrink-0">
          <Search className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">Case Decoder</h3>
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest">
            Official April {year} Schedule
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-black uppercase text-slate-600 tracking-wider mb-3 px-1">
            9th & 8th Digits of Case Number
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            placeholder="00"
            value={digits}
            onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 text-4xl font-black text-slate-900 focus:border-blue-600 focus:bg-white transition-all outline-none placeholder:text-slate-300"
          />
        </div>

        {resultDate && (
          <div className="animate-in zoom-in-95 fade-in duration-300">
            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] p-6 text-center shadow-inner">
              <p className="text-xs font-black uppercase text-emerald-600 tracking-widest mb-2">Expected Deposit Date</p>
              {/* 🚀 FIXED: Added EEEE for day name */}
              <p className="text-2xl md:text-3xl font-black text-emerald-950 leading-tight">
                {format(resultDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-tight">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Schedule</span>
              </div>
            </div>
          </div>
        )}

        {hasError && (
          <div className="animate-in shake-1 duration-300 bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-6 flex flex-col items-center gap-2">
            <XCircle className="w-8 h-8 text-rose-500" />
            <p className="text-base font-black text-rose-900">Invalid Digits</p>
          </div>
        )}

        {!resultDate && !hasError && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 text-center">
            <Info className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-500 leading-relaxed px-4">
              Enter your digits to see your <br/> personalized schedule.
            </p>
          </div>
        )}

        <div className="flex items-start gap-4 bg-slate-900 p-6 rounded-2xl shadow-inner">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed font-bold text-slate-300">
            <span className="text-white font-black uppercase tracking-tighter mr-1">Note:</span> 
            Florida issuance is determined by the 9th and 8th digits of your case number.
          </p>
        </div>
      </div>
    </div>
  );
}