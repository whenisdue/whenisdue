import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma"; 
import { STATE_REGISTRY, getStateBySlug } from "@/lib/states-data"; 
import { format } from "date-fns";
import { Calendar, ShieldCheck, MapPin, Landmark, History, AlertTriangle } from "lucide-react";
import { 
  toOffsetStrategy, 
  toTexasCohort, 
  toNewYorkCohort, 
  OffsetStrategy, 
  TexasCohort, 
  NewYorkCohort 
} from "@/lib/smart-dates";
import OfficialResourceLink from "@/components/OfficialResourceLink";
import BenefitAlerts from "@/components/BenefitAlerts";
import FloridaDecoder, { FloridaDecoderRule } from "@/components/FloridaDecoder";
import TexasDecoder, { TexasDecoderRule } from "@/components/TexasDecoder";
import NewYorkUpstateDecoder, { NewYorkDecoderRule } from "@/components/NewYorkUpstateDecoder";

export const revalidate = 60;

type TexasRule = TexasDecoderRule;
type FloridaRule = FloridaDecoderRule;
type NYRule = NewYorkDecoderRule;
type StateRule = TexasRule | FloridaRule | NYRule;

type PageProps = {
  params: Promise<{ stateSlug: string }>;
};

type RawRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: string;
  cohortKey: string | null;
  triggerType: string;
};

// Simple internal component for integrity failures
const IntegrityError = () => (
  <div className="bg-rose-600 p-8 rounded-[2.5rem] text-white border-4 border-rose-400 shadow-2xl">
    <h3 className="text-xl font-black mb-2 flex items-center gap-2">
      <AlertTriangle className="w-6 h-6" /> Integrity Error
    </h3>
    <p className="font-bold text-sm leading-relaxed">
      Data integrity issue detected. Please refer to the manual table below for verified dates.
    </p>
  </div>
);

function validateNumericRuleForClient(r: RawRule, stateSlug: string): StateRule | null {
  const strategy = toOffsetStrategy(r.offsetStrategy);
  const cohort = toTexasCohort(r.cohortKey);
  if (!strategy) return null;

  const isNumeric = (val: string) => /^\d+$/.test(val);
  if (!isNumeric(r.triggerStart)) return null;
  if (r.triggerEnd && !isNumeric(r.triggerEnd)) return null;

  const baseDay = Number(r.baseDay);
  if (isNaN(baseDay) || baseDay < 1 || baseDay > 31) return null;

  if (stateSlug === 'texas') {
    if (!cohort) return null;
    const width = cohort === 'PRE_JUNE_2020' ? 1 : 2;
    if (r.triggerStart.length !== width || (r.triggerEnd && r.triggerEnd.length !== width)) return null;
    return { ...r, baseDay, offsetStrategy: strategy, cohortKey: cohort } as TexasRule;
  }
  return { ...r, baseDay, offsetStrategy: strategy } as FloridaRule;
}

function validateNYUpstateRuleForClient(r: RawRule): NYRule | null {
  const strategy = toOffsetStrategy(r.offsetStrategy);
  const cohort = toNewYorkCohort(r.cohortKey);
  if (cohort !== 'UPSTATE' || r.triggerType !== 'ALPHABETIC_RANGE' || !strategy) return null;
  const isSingleLetter = (val: string) => /^[A-Z]$/i.test(val);
  if (!isSingleLetter(r.triggerStart)) return null;
  if (r.triggerEnd && !isSingleLetter(r.triggerEnd)) return null;

  return {
    triggerStart: r.triggerStart.toUpperCase(),
    triggerEnd: r.triggerEnd ? r.triggerEnd.toUpperCase() : null,
    baseDay: Number(r.baseDay),
    offsetStrategy: strategy,
    cohortKey: cohort
  } as NYRule;
}

function verifyTexasIntegrity(rules: TexasRule[]): boolean {
  const pre = rules.filter(r => r.cohortKey === 'PRE_JUNE_2020');
  const post = rules.filter(r => r.cohortKey === 'POST_JUNE_2020');
  const check = (set: TexasRule[], max: number) => {
    const map = new Array(max + 1).fill(0);
    set.forEach(r => {
      for (let i = parseInt(r.triggerStart); i <= parseInt(r.triggerEnd || r.triggerStart); i++) {
        if (i >= 0 && i <= max) map[i]++;
      }
    });
    return map.every(count => count === 1);
  };
  return check(pre, 9) && check(post, 99);
}

function verifyNewYorkUpstateIntegrity(rules: NYRule[]): boolean {
  const upstate = rules.filter(r => r.cohortKey === 'UPSTATE');
  if (upstate.length === 0) return false;
  const map = new Array(26).fill(0);
  upstate.forEach(r => {
    const s = r.triggerStart.charCodeAt(0) - 65;
    const e = (r.triggerEnd || r.triggerStart).charCodeAt(0) - 65;
    for (let i = s; i <= e; i++) if (i >= 0 && i < 26) map[i]++;
  });
  return map.every(count => count === 1);
}

export default async function StatePage({ params }: PageProps) {
  const { stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) notFound();

  const rawRules = await prisma.rule.findMany({
    where: { program: { state: { slug: stateSlug }, name: { contains: "SNAP", mode: "insensitive" } } },
    select: { triggerStart: true, triggerEnd: true, baseDay: true, offsetStrategy: true, cohortKey: true, triggerType: true },
    orderBy: { triggerStart: 'asc' }
  });

  let flTxRules: StateRule[] = [];
  let nyUpstateRules: NYRule[] = [];
  let isIntegrityOk = true;

  if (stateSlug === 'new-york') {
    nyUpstateRules = rawRules.map(r => validateNYUpstateRuleForClient(r as RawRule)).filter((r): r is NYRule => r !== null);
    isIntegrityOk = verifyNewYorkUpstateIntegrity(nyUpstateRules);
  } else {
    flTxRules = rawRules.map(r => validateNumericRuleForClient(r as RawRule, stateSlug)).filter((r): r is StateRule => r !== null);
    if (stateSlug === 'texas') isIntegrityOk = verifyTexasIntegrity(flTxRules as TexasRule[]);
  }

  const upcomingEvents = await prisma.event.findMany({
    where: { category: "STATE", title: { contains: state.name, mode: "insensitive" }, dueAt: { gte: new Date() } },
    orderBy: { dueAt: 'asc' }, take: 10
  });

  const nextPayment = upcomingEvents[0];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <section className="bg-slate-900 text-white pt-20 pb-32 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
          
          <div className="space-y-8 flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white"><MapPin className="w-5 h-5" /></div>
              <span className="text-sm font-black uppercase tracking-widest text-blue-400">{state.name} Operations</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">{state.name} <span className="text-slate-500">2026</span><br />Benefit Schedule</h1>
            {nextPayment && (
              <div className="inline-flex items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm shadow-xl">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Next Expected Deposit</p>
                  <p className="text-3xl font-black text-white">{format(new Date(nextPayment.dueAt!), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:max-w-md space-y-6">
            {/* CALCULATOR LANE */}
            {stateSlug === 'florida' && flTxRules.length > 0 && <FloridaDecoder rules={flTxRules as FloridaRule[]} />}
            
            {stateSlug === 'texas' && (
              !isIntegrityOk ? <IntegrityError /> : <TexasDecoder rules={flTxRules as TexasRule[]} />
            )}

            {stateSlug === 'new-york' && (
              !isIntegrityOk ? <IntegrityError /> : <NewYorkUpstateDecoder rules={nyUpstateRules} />
            )}

            {/* 🚀 SUBSCRIPTION RESTORED: Appears for Florida, Texas, New York, and all others */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-sm shadow-2xl">
              <BenefitAlerts stateName={state.name} variant="hero" />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden mb-12">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" /> Upcoming Issuance Window
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-xs font-black uppercase text-slate-500 tracking-widest">Date</th>
                  <th className="px-8 py-4 text-xs font-black uppercase text-slate-500 tracking-widest">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50">
                    <td className="px-8 py-6 font-black text-slate-900">{format(new Date(event.dueAt!), 'MMM d, yyyy')}</td>
                    <td className="px-8 py-6 font-bold text-slate-700">{event.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {state.officialUrl && (
          <div className="p-10 rounded-[3rem] bg-blue-50 border-4 border-blue-100 space-y-6">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4"><Landmark className="w-8 h-8 text-blue-600" /> Official {state.name} Portal</h3>
            <p className="text-slate-700 font-bold text-xl leading-relaxed max-w-2xl">Please visit the official government site for case management.</p>
            <OfficialResourceLink url={state.officialUrl} stateName={state.name} />
          </div>
        )}
      </main>
    </div>
  );
}