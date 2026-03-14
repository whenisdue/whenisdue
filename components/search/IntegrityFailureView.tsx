"use client";

import { AlertTriangle, ShieldAlert, ArrowRight } from "lucide-react";

export default function IntegrityFailureView() {
  return (
    <div className="mt-8 animate-in zoom-in duration-300">
      <div className="bg-white rounded-3xl border-2 border-amber-200 shadow-xl overflow-hidden">
        {/* 1. STATUS HEADER */}
        <div className="bg-amber-50 px-8 py-4 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Audit Intercept Active</span>
          </div>
          <span className="text-[10px] font-bold text-amber-600 bg-white px-2 py-0.5 rounded border border-amber-200">
            Error Code: M2C1_CONFLICT
          </span>
        </div>

        {/* 2. CORE MESSAGE */}
        <div className="p-8 text-center">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">
            Manual Audit in Progress
          </h2>
          <p className="text-slate-500 mt-4 leading-relaxed max-w-sm mx-auto">
            Our bitemporal ledger has detected a scheduling update that requires manual verification. 
            To ensure 100% accuracy, this result is temporarily locked.
          </p>
        </div>

        {/* 3. ACTION FOOTER */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-white border border-slate-200 hover:border-blue-400 py-3 rounded-xl font-bold text-slate-600 transition-all flex items-center justify-center gap-2 group"
          >
            Check back later
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}