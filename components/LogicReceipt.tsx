"use client";

import { motion } from "framer-motion";
import { Info, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { NextDepositDetails, formatReasonLabel } from "@/lib/engine/ui-helpers";

interface LogicReceiptProps {
  details: NextDepositDetails;
  finalDate: string;
}

export default function LogicReceipt({ details, finalDate }: LogicReceiptProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-2xl p-5 relative shadow-sm"
    >
      <div className="absolute -right-4 -top-4 opacity-[0.04] pointer-events-none text-slate-900">
        <ShieldCheck size={140} />
      </div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
          <Calendar size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-slate-900 font-semibold text-sm">Issuance Logic Receipt</h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-full uppercase tracking-tight border border-blue-100">
              Verified
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-slate-100/40 p-2.5 rounded-xl border border-slate-200/30">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-bold">Target Day</span>
              <span className="text-slate-700 font-mono text-sm">Day {details.nominalDay}</span>
            </div>
            
            <div className="bg-slate-100/40 p-2.5 rounded-xl border border-slate-200/30">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-bold">Policy Rule</span>
              <span className="text-slate-700 text-[10px] truncate font-medium">
                {formatReasonLabel(details.ruleApplied)}
              </span>
            </div>
          </div>

          {details.wasShifted && (
            <div className="mt-3 p-3 bg-amber-500/5 border border-amber-200/40 rounded-xl flex items-center gap-2.5">
              <Info size={14} className="text-amber-500 shrink-0" />
              <p className="text-[10.5px] text-amber-800/80 leading-snug">
                Date adjusted to ensure delivery on a valid business day.
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Expected Deposit</span>
            <div className="flex items-center gap-2">
               <span className="text-lg font-bold text-slate-900 tracking-tighter">{finalDate}</span>
               <ArrowRight size={16} className="text-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}