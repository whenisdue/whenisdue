import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStateBySlug } from "@/lib/states-data";
import { format } from "date-fns";
import { Calendar, MapPin, Landmark, AlertTriangle } from "lucide-react";
import {
  validateRulesForState,
  verifyIntegrity,
  hasRenderableRules,
  RawRule,
} from "@/lib/rules-engine";
import OfficialResourceLink from "@/components/OfficialResourceLink";
import BenefitAlerts from "@/components/BenefitAlerts";
import FloridaDecoder from "@/components/FloridaDecoder";
import TexasDecoder from "@/components/TexasDecoder";
import NewYorkDecoder from "@/components/NewYorkDecoder";
import CaliforniaDecoder from "@/components/CaliforniaDecoder";
import GeorgiaDecoder from "@/components/GeorgiaDecoder";
import PennsylvaniaDecoder from "@/components/PennsylvaniaDecoder";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ stateSlug: string }>;
};

type RuleQueryRow = RawRule & {
  program: {
    name: string;
  };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stateSlug } = await params;
  const state = getStateBySlug(stateSlug);

  if (!state) {
    return { title: "State Not Found" };
  }

  return {
    title: `${state.name} 2026 Food Benefit Schedule | WhenIsDue`,
    description: `Official 2026 ${state.name} SNAP/EBT deposit dates. Find your expected benefit timing using your state's official schedule rules.`,
  };
}

function IntegrityError() {
  return (
    <div className="bg-rose-600 p-8 rounded-[2.5rem] text-white border-4 border-rose-400 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
      <h3 className="text-xl font-black mb-2 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6" />
        Integrity Error
      </h3>
      <p className="font-bold text-sm leading-relaxed">
        We could not build a reliable schedule from the current data. Please use the verified manual table below.
      </p>
    </div>
  );
}

function IntegrityWarning({ stateName }: { stateName: string }) {
  return (
    <div className="bg-amber-500/10 border border-amber-400/30 p-4 rounded-2xl text-amber-100">
      <h3 className="text-sm font-black uppercase tracking-widest text-amber-300 mb-2">
        Limited Validation Mode
      </h3>
      <p className="text-sm font-bold leading-relaxed">
        We found usable {stateName} rules and are showing them, but the full dataset did not pass every strict integrity check yet.
      </p>
    </div>
  );
}

export default async function StatePage({ params }: PageProps) {
  const { stateSlug } = await params;
  const state = getStateBySlug(stateSlug);

  if (!state) {
    notFound();
  }

  // D107.2 diagnostic query: keyword filter removed to discover actual production program names.
  const dbRules = await prisma.rule.findMany({
    where: {
      program: {
        state: { slug: stateSlug },
      },
    },
    select: {
      triggerStart: true,
      triggerEnd: true,
      baseDay: true,
      offsetStrategy: true,
      cohortKey: true,
      triggerType: true,
      program: { select: { name: true } },
    },
  });

  const rawRules: RuleQueryRow[] = dbRules.map((r) => ({
    triggerStart: r.triggerStart,
    triggerEnd: r.triggerEnd,
    baseDay: r.baseDay,
    offsetStrategy: r.offsetStrategy,
    cohortKey: r.cohortKey,
    triggerType: r.triggerType,
    program: { name: r.program.name },
  }));

  const matchedPrograms = Array.from(new Set(rawRules.map((r) => r.program.name)));
  console.log(
    `[D107.2] ${stateSlug.toUpperCase()} | Programs: ${matchedPrograms.join(", ") || "(none)"} | Rows: ${rawRules.length}`
  );

  const processedRules = validateRulesForState(
    stateSlug,
    rawRules.map(({ program, ...rule }) => rule)
  );

  const canRender = hasRenderableRules(stateSlug, processedRules);
  const passesStrictIntegrity = canRender && verifyIntegrity(stateSlug, processedRules);

  const upcomingEvents = await prisma.event.findMany({
    where: {
      category: "STATE",
      title: { contains: state.name, mode: "insensitive" },
      dueAt: { gte: new Date() },
    },
    orderBy: { dueAt: "asc" },
    take: 10,
  });

  const nextPayment = upcomingEvents[0] ?? null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <section className="bg-slate-900 text-white pt-20 pb-32 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
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
              {state.name} <span className="text-slate-500">2026</span>
              <br />
              Benefit Schedule
            </h1>

            {nextPayment && !["california", "new-york", "florida"].includes(stateSlug) && (
              <div className="inline-flex items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm shadow-xl animate-in fade-in zoom-in duration-500">
                <div>
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">
                    Next Expected Deposit
                  </p>
                  <p className="text-3xl font-black text-white">
                    {format(new Date(nextPayment.dueAt!), "EEEE, MMMM d")}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:max-w-md space-y-6">
            {!canRender ? (
              <IntegrityError />
            ) : (
              <>
                {!passesStrictIntegrity && <IntegrityWarning stateName={state.name} />}

                {stateSlug === "florida" && <FloridaDecoder rules={processedRules as any} />}
                {stateSlug === "texas" && <TexasDecoder rules={processedRules as any} />}
                {stateSlug === "california" && <CaliforniaDecoder rules={processedRules as any} />}
                {stateSlug === "pennsylvania" && <PennsylvaniaDecoder rules={processedRules as any} />}
                {stateSlug === "georgia" && <GeorgiaDecoder rules={processedRules as any} />}
                {stateSlug === "new-york" && (
                  <NewYorkDecoder
                    upstateRules={(processedRules as any).upstate}
                    cityRules={(processedRules as any).city}
                  />
                )}
              </>
            )}

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
              <Calendar className="w-6 h-6 text-blue-600" />
              Upcoming Issuance Window
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-xs font-black uppercase text-slate-500 tracking-widest">
                    Date
                  </th>
                  <th className="px-8 py-4 text-xs font-black uppercase text-slate-500 tracking-widest">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50">
                    <td className="px-8 py-6 font-black text-slate-900">
                      {format(new Date(event.dueAt!), "MMM d, yyyy")}
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-700">{event.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {state.officialUrl && (
          <div className="p-10 rounded-[3rem] bg-blue-50 border-4 border-blue-100 space-y-6">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
              <Landmark className="w-8 h-8 text-blue-600" />
              Official {state.name} Portal
            </h3>
            <p className="text-slate-700 font-bold text-xl leading-relaxed max-w-2xl">
              Please visit the official government site for case management.
            </p>
            <OfficialResourceLink url={state.officialUrl} stateName={state.name} />
          </div>
        )}
      </main>
    </div>
  );
}
