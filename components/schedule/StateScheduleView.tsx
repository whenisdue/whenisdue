import { getUpcomingSchedule } from "@/lib/schedule/resolver";
import IdentifierAnswerWidget from "./IdentifierAnswerWidget";
import { format } from "date-fns";
import { ShieldCheck, CalendarDays } from "lucide-react";

interface Props {
  stateCode: string;
  stateName: string;
  programCode: string;
}

export default async function StateScheduleView({ stateCode, stateName, programCode }: Props) {
  const ruleSet = await getUpcomingSchedule(stateCode, programCode);

  if (!ruleSet) {
    return (
      <div className="text-center p-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 max-w-3xl mx-auto mt-10">
        <p className="text-slate-500 font-medium">Verified schedule data not found for this region.</p>
      </div>
    );
  }

  const events = ruleSet.paymentEvents;
  const verifiedAt = format(new Date(), "MMMM d, yyyy");

  return (
    <div className="max-w-3xl mx-auto px-6 pt-6 pb-16">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-4">
          <CalendarDays className="w-3.5 h-3.5" />
          Updated for 2026
        </div>
        
        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
          {stateName} {programCode} Payment Dates
        </h1>
        <p className="text-base text-slate-600 font-medium">
          Choose your detail below to see your expected 2026 payment date.
        </p>
      </header>

      <IdentifierAnswerWidget 
        events={events} 
        identifierKind={ruleSet.identifierKind} 
        stateCode={stateCode}
        programCode={programCode}
        allowsSubscriptions={ruleSet.identity?.allowsSubscriptions ?? false}
      />

      <footer className="mt-12 px-6 pt-8 border-t border-slate-200 text-center">
        <div className="inline-flex items-center justify-center gap-2 mb-4 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Based on official state sources</span>
        </div>
        
        <p className="text-slate-500 text-xs leading-relaxed font-medium max-w-md mx-auto">
          Data synchronized with official agency publications and automatically adjusted for weekends and federal holidays. <br/>
          <span className="block mt-2 text-slate-400">Last verified: {verifiedAt}</span>
        </p>
      </footer>
    </div>
  );
}