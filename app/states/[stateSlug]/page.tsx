import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma"; 
import { STATE_REGISTRY, getStateBySlug } from "@/lib/states-data"; 
import { format } from "date-fns";
import { Calendar, ShieldCheck, MapPin, Landmark, History, AlertTriangle } from "lucide-react";
import { toOffsetStrategy, toTexasCohort, OffsetStrategy, TexasCohort } from "@/lib/smart-dates";
import OfficialResourceLink from "@/components/OfficialResourceLink";
import BenefitAlerts from "@/components/BenefitAlerts";
import FloridaDecoder, { FloridaDecoderRule } from "@/components/FloridaDecoder";
import TexasDecoder, { TexasDecoderRule } from "@/components/TexasDecoder";

export const revalidate = 60;

/**
 * 🚀 PATH TO GREEN: Strict Type Definitions
 */
type TexasRule = TexasDecoderRule;
type FloridaRule = FloridaDecoderRule;
type StateRule = TexasRule | FloridaRule;

type PageProps = {
  params: Promise<{ stateSlug: string }>;
};

type RawRule = {
  triggerStart: string;
  triggerEnd: string | null;
  baseDay: number;
  offsetStrategy: string;
  cohortKey: string | null;
};

/**
 * 🛡️ BOUNDARY GUARD: Clean data and map to specific Decoder types
 * Eradicates the 'any' return type.
 */
function validateRuleForClient(r: RawRule, stateSlug: string): StateRule | null {
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
    
    return {
      triggerStart: r.triggerStart,
      triggerEnd: r.triggerEnd,
      baseDay,
      offsetStrategy: strategy,
      cohortKey: cohort
    } as TexasRule;
  }

  return {
    triggerStart: r.triggerStart,
    triggerEnd: r.triggerEnd,
    baseDay,
    offsetStrategy: strategy
  } as FloridaRule;
}

/**
 * 🚀 EXCLUSIVITY PROOF: Frequency-based integrity check
 */
function verifyTexasIntegrity(rules: TexasRule[]): boolean {
  const pre = rules.filter(r => r.cohortKey === 'PRE_JUNE_2020');
  const post = rules.filter(r => r.cohortKey === 'POST_JUNE_2020');

  const checkExactCoverage = (set: TexasRule[], max: number) => {
    const frequencyMap = new Array(max + 1).fill(0);
    set.forEach(r => {
      const start = parseInt(r.triggerStart);
      const end = parseInt(r.triggerEnd || r.triggerStart);
      for (let i = start; i <= end; i++) {
        if (i >= 0 && i <= max) frequencyMap[i]++;
      }
    });
    return frequencyMap.every(count => count === 1);
  };

  return checkExactCoverage(pre, 9) && checkExactCoverage(post, 99);
}

// --- MAIN COMPONENT ---

export default async function StatePage({ params }: PageProps) {
  const { stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) notFound();

  const rawRules = await prisma.rule.findMany({
    where: { 
      program: { state: { slug: stateSlug }, name: { contains: "SNAP", mode: "insensitive" } } 
    },
    orderBy: { triggerStart: 'asc' }
  });

  // 🚀 FIXED: Type Guard filter clears the 'any' and 'null' linting errors
  const stateRules = rawRules
    .map(r => validateRuleForClient(r as unknown as RawRule, stateSlug))
    .filter((r): r is StateRule => r !== null);

  const isTexasIntegrityOk = stateSlug === 'texas' 
    ? verifyTexasIntegrity(stateRules as TexasRule[]) 
    : true;

  const upcomingEvents = await prisma.event.findMany({
    where: { 
      category: "STATE",
      title: { contains: state.name, mode: "insensitive" },
      dueAt: { gte: new Date() } 
    },
    orderBy: { dueAt: 'asc' },
    take: 10
  });

  const nextPayment = upcomingEvents[0];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* --- HERO SECTION --- */}
      <section className="bg-slate-900 text-white pt-20 pb-32 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
            
            <div className="space-y-8 flex-1">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl text-white">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-blue-400">
                  {state.name} Operations
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
                {state.name} <span className="text-slate-500">2026</span><br />
                Benefit Schedule
              </h1>

              {nextPayment && (
                <div className="inline-flex items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm shadow-xl">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Next Expected Deposit</p>
                    <p className="text-3xl font-black text-white">{format(new Date(nextPayment.dueAt!), 'MMMM d, yyyy')}</p>
                  </div>
                  <div className="h-12 w-px bg-white/10 hidden md:block" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-green-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-black uppercase tracking-tight">Official 2026 Schedule</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <History className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Verified: March 2026</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full lg:max-w-md">
              {stateSlug === 'florida' && stateRules.length > 0 && (
                <FloridaDecoder rules={stateRules as FloridaRule[]} />
              )}
              
              {stateSlug === 'texas' && (
                !isTexasIntegrityOk ? (
                  <div className="bg-rose-600 p-8 rounded-[2.5rem] text-white border-4 border-rose-400 shadow-2xl">
                    <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6" /> System Error
                    </h3>
                    <p className="font-bold text-sm leading-relaxed">
                      Texas data integrity issue detected. To protect your accuracy, 
                      the calculator is disabled. Please refer to the manual table below.
                    </p>
                  </div>
                ) : (
                  <TexasDecoder rules={stateRules as TexasRule[]} />
                )
              )}

              {stateSlug !== 'florida' && stateSlug !== 'texas' && (
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-sm shadow-2xl">
                  <BenefitAlerts stateName={state.name} variant="hero" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden mb-12">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              General Issuance Calendar
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-xs font-black uppercase text-slate-500 tracking-widest">Date</th>
                  <th className="px-8 py-4 text-xs font-black uppercase text-slate-500 tracking-widest">Description</th>
                  <th className="px-8 py-4 text-xs font-black uppercase text-slate-500 tracking-widest">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-black text-slate-900 text-lg">
                      {format(new Date(event.dueAt!), 'MMM d, yyyy')}
                    </td>
                    <td className="px-8 py-6 text-base font-bold text-slate-700">
                      {event.title}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-black text-green-600 uppercase tracking-tight">
                        <ShieldCheck className="w-4 h-4" />
                        Verified
                      </div>
                    </td>
                  </tr>
                )) : (
                    <tr>
                        <td colSpan={3} className="px-8 py-16 text-center text-slate-400 font-bold italic text-lg">
                            Updating verified schedule records for {state.name}...
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- OFFICIAL PORTAL --- */}
        {state.officialUrl && (
          <div className="p-10 md:p-14 rounded-[3rem] bg-blue-50 border-4 border-blue-100 space-y-8">
            <div className="flex items-center gap-4 text-blue-600">
              <Landmark className="w-8 h-8" />
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                Official {state.name} Portal
              </h3>
            </div>
            <p className="text-slate-700 font-bold text-xl leading-relaxed max-w-2xl">
              Always manage your case via the official government domain. We provide 
              this verified link for your security.
            </p>
            <div className="pt-2">
              <OfficialResourceLink url={state.officialUrl} stateName={state.name} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}