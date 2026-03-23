'use client';

import React, { useState, useMemo } from 'react';
import { calculateSmartDate } from '@/lib/smart-dates';
import { format } from 'date-fns';
import { Search, Map, Building2 } from 'lucide-react';
import { NYUpstateRule, NYCityRule } from '@/lib/ny-types'; // 🚀 Pointing to the new file

type NYRulesProps = {
  upstateRules: NYUpstateRule[];
  cityRules: NYCityRule[];
};

export default function NewYorkDecoder({ upstateRules, cityRules }: NYRulesProps) {
  const [region, setRegion] = useState<'UPSTATE' | 'NYC'>('UPSTATE');
  const [cycle, setCycle] = useState<'NYC_A_CYCLE' | 'NYC_B_CYCLE'>('NYC_A_CYCLE');
  const [initial, setInitial] = useState('');

  const resultDate = useMemo(() => {
    if (region === 'NYC') {
      const rule = cityRules.find(r => r.cohortKey === cycle);
      return rule ? calculateSmartDate(rule, 4, 2026) : null;
    }

    if (initial) {
      const charCode = initial.toUpperCase().charCodeAt(0);
      const rule = upstateRules.find(r => {
        const start = r.triggerStart.charCodeAt(0);
        const end = (r.triggerEnd || r.triggerStart).charCodeAt(0);
        return charCode >= start && charCode <= end;
      });
      return rule ? calculateSmartDate(rule, 4, 2026) : null;
    }
    return null;
  }, [region, cycle, initial, upstateRules, cityRules]);

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 shadow-2xl p-8 max-w-md w-full flex flex-col gap-6">
      {/* Region Toggle */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200">
        <button 
          onClick={() => { setRegion('UPSTATE'); setInitial(''); }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${region === 'UPSTATE' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
        >
          Upstate
        </button>
        <button 
          onClick={() => { setRegion('NYC'); setCycle('NYC_A_CYCLE'); }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${region === 'NYC' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
        >
          NYC
        </button>
      </div>

      {region === 'UPSTATE' ? (
        <div className="space-y-4">
          <label className="text-xs font-black uppercase text-slate-500 tracking-widest px-1">Last Name Initial</label>
          <select 
            value={initial}
            onChange={(e) => setInitial(e.target.value)}
            className="w-full bg-slate-50 border-4 border-slate-200 rounded-2xl p-5 text-2xl font-black text-slate-900 outline-none focus:border-blue-600 appearance-none"
          >
            <option value="">Select letter...</option>
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="text-xs font-black uppercase text-slate-500 tracking-widest px-1">NYC Payment Cycle</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCycle('NYC_A_CYCLE')}
              className={`p-4 rounded-2xl border-4 font-black transition-all ${cycle === 'NYC_A_CYCLE' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}
            >
              Cycle A
            </button>
            <button
              onClick={() => setCycle('NYC_B_CYCLE')}
              className={`p-4 rounded-2xl border-4 font-black transition-all ${cycle === 'NYC_B_CYCLE' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}
            >
              Cycle B
            </button>
          </div>
        </div>
      )}

      {resultDate && (
        <div className="bg-blue-600 rounded-3xl p-8 text-white text-center shadow-xl shadow-blue-100">
          <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Deposit Expected</p>
          <p className="text-4xl font-black tracking-tight">{format(resultDate, 'MMMM d')}</p>
        </div>
      )}
    </div>
  );
}