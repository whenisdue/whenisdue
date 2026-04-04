'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSmartDate, normalizeFloridaPair } from '@/lib/smart-dates';
import { format } from 'date-fns';
import { Search, Info, ExternalLink, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';

export type FloridaDecoderRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: any;
};

interface Props {
  rules: FloridaDecoderRule[];
  month?: number;
  year?: number;
}

export default function FloridaDecoder({ rules, month = 4, year = 2026 }: Props) {
  const router = useRouter();
  const [digits, setDigits] = useState('');
  const [resultDate, setResultDate] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);

  // --- SURGICAL REPLACEMENT: RANGED RULE MATCHING ---
  useEffect(() => {
    const interpreted = normalizeFloridaPair(digits);
    
    if (interpreted) {
      const numericInput = parseInt(interpreted, 10);

      // Find the rule where the input falls within the start and end range
      const matchedRule = rules.find(r => {
        const start = parseInt(r.triggerStart, 10);
        // If triggerEnd is null, assume it's a single-digit exact match, otherwise use the range
        const end = r.triggerEnd ? parseInt(r.triggerEnd, 10) : start;
        return numericInput >= start && numericInput <= end;
      });

      if (matchedRule) {
        setResultDate(calculateSmartDate(matchedRule, month, year));
        setHasError(false);
      } else {
        setResultDate(null);
        setHasError(true);
      }
    } else {
      setResultDate(null);
      setHasError(digits.length === 2); 
    }
  }, [digits, rules, month, year]);
  // --- END SURGICAL REPLACEMENT ---

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 shadow-2xl p-8 max-w-md w-full flex flex-col gap-6">
      {/* 🛡️ Topic D070: Partial Sync Warning */}
      {rules.length !== 100 && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <p className="text-[10px] font-black uppercase text-amber-600 tracking-tight">
            Topic D070: Partial Sync Active. Verification in progress.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg">
          <Search className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">Florida Finder</h3>
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest">MyACCESS Case Decoder</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black uppercase text-slate-500 tracking-widest px-1">
          9th & 8th Case Digits
        </label>
        <input
          type="text"
          maxLength={2}
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, ''))}
          placeholder="00"
          className="w-full bg-slate-50 border-4 border-slate-200 rounded-2xl p-6 text-5xl font-black text-slate-900 focus:border-blue-600 outline-none transition-all placeholder:text-slate-200"
        />
      </div>

      {resultDate && (
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
          <div className="bg-blue-50 rounded-2xl p-5 text-center border-b-4 border-blue-100">
            <p className="text-[10px] font-black uppercase text-blue-500 mb-1 tracking-widest">Florida Reading Rule</p>
            <p className="text-sm font-bold text-slate-800 leading-tight">
              Case digits <span className="text-blue-600 underline">{digits}</span> are read backward as <span className="text-blue-700 underline">{normalizeFloridaPair(digits)}</span>
            </p>
          </div>

          <button 
            onClick={() => {
              const interpreted = normalizeFloridaPair(digits);
              if (interpreted) {
                router.push(`/s/snap/florida-snap-interpreted-d${interpreted}-m${month.toString().padStart(2, '0')}-2026`);
              }
            }}
            className="w-full group"
          >
            {/* 🏛️ FGO UNIVERSAL RESULT STYLE */}
            <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white text-center shadow-2xl shadow-blue-500/20 hover:bg-blue-700 transition-all border-b-8 border-blue-800/50">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2">Sovereign Verification</p>
              <p className="text-4xl font-black tracking-tighter mb-1">{format(resultDate, 'EEEE')}</p>
              <p className="text-2xl font-black text-blue-100 opacity-90">{format(resultDate, 'MMMM d, yyyy')}</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
                <ExternalLink className="w-3 h-3" />
                <span>View Full Schedule Details</span>
              </div>
            </div>
          </button>
        </div>
      )}

      {hasError && (
        <div className="bg-rose-50 border-4 border-rose-100 rounded-[2rem] p-6 flex flex-col items-center gap-2">
          <XCircle className="w-8 h-8 text-rose-500" />
          <p className="text-base font-black text-rose-900">Please enter 2 digits</p>
        </div>
      )}

      <div className="flex items-start gap-4 bg-slate-900 p-6 rounded-2xl">
        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed font-bold text-slate-300">
          <span className="text-white font-black uppercase tracking-tighter mr-1">Note:</span>
          Per DCF rules, locate your 9th and 8th case digits and read them backward to find your group.
        </p>
      </div>
    </div>
  );
}