"use client";

import { ShieldCheck, CalendarClock, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ExactAnswerResponse, ShiftCause, AppliedPolicy } from "@/lib/search/types";

const SHIFT_LABELS: Record<ShiftCause, string> = {
  WEEKEND: "Weekend Adjustment",
  HOLIDAY: "State Holiday Shift",
  BUSINESS_DAY: "Business Day Rule",
  NONE: ""
};

const POLICY_LABELS: Record<AppliedPolicy, string> = {
  PREVIOUS_BUSINESS_DAY: "Previous Business Day",
  NEXT_BUSINESS_DAY: "Next Business Day",
  SAME_DAY: "Same Day Issuance",
  NO_SHIFT: "Standard Issuance"
};

export default function TransparencyCard(props: ExactAnswerResponse) {
  return (
    <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <ShieldCheck className={`w-5 h-5 ${props.verificationStatus === 'VERIFIED' ? 'text-green-600' : 'text-slate-400'}`} />
          <div className="text-sm">
            <p className="text-[10px] font-black uppercase text-slate-400">Official Source</p>
            <a href={props.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-bold flex items-center gap-1 hover:text-blue-600 group">
              {props.sourceAuthority} <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
            </a>
          </div>
        </div>
        <div className="text-right text-xs font-bold text-slate-900">
          {props.verificationStatus === 'VERIFIED' && props.lastVerifiedAt 
            ? `Verified ${format(parseISO(props.lastVerifiedAt), 'MMM d')}` 
            : 'Audit Pending'}
        </div>
      </div>

      {props.isShifted && props.originalDate && (
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
          <CalendarClock className="w-6 h-6 text-amber-600 shrink-0" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">Automatic Date Adjustment</p>
            <p className="text-amber-800 mt-1">
              Standard date: <span className="font-black underline">{format(parseISO(props.originalDate), 'MMMM do')}</span>.
              <br />
              Reason: <span className="font-black">{SHIFT_LABELS[props.shiftCause]}</span>. 
              Rule: <span className="font-black italic">{POLICY_LABELS[props.appliedPolicy]}</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}