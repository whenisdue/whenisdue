import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma"; 
import { STATE_REGISTRY, getStateBySlug } from "@/src/lib/states-data";
import { format } from "date-fns";
import { Calendar, ShieldCheck, MapPin, Landmark } from "lucide-react";
import OfficialResourceLink from "@/components/OfficialResourceLink";
import BenefitAlerts from "@/components/BenefitAlerts";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ stateSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stateSlug } = await params; 
  const state = getStateBySlug(stateSlug);
  if (!state) return { title: "State Not Found" };

  return {
    title: `${state.name} 2026 Food Benefits Schedule | Official EBT Dates`,
    description: `View the verified 2026 ${state.name} food assistance payment dates and official issuance schedules.`,
  };
}

export async function generateStaticParams() {
  return Object.values(STATE_REGISTRY).map((state) => ({
    stateSlug: state.slug,
  }));
}

export default async function StatePage({ params }: PageProps) {
  const { stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) notFound();

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
      {/* DARK HERO SECTION */}
      <section className="bg-slate-900 text-white pt-20 pb-32 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* 🚀 THE BALANCE WRAPPER: Stacks on mobile (like your screenshot), splits on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12">
            
            {/* LEFT COLUMN: Title and Date Card */}
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

              {nextPayment ? (
                <div className="inline-flex flex-col md:flex-row items-start md:items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Next Expected Deposit</p>
                    <p className="text-3xl font-black text-white">{format(new Date(nextPayment.dueAt!), 'MMMM d, yyyy')}</p>
                  </div>
                  <div className="h-12 w-px bg-white/10 hidden md:block" />
                  <div className="flex items-center gap-2 text-green-400">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-tight">Official 2026 Schedule</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 font-medium italic">Schedules for {state.name} are being updated.</p>
              )}
            </div>

            {/* RIGHT COLUMN: The Subscription Box (Utilizing the negative space) */}
            <div className="w-full lg:max-w-md bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-sm">
              <BenefitAlerts stateName={state.name} variant="hero" />
            </div>

          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 -mt-16 pb-20">
        {/* DATA TABLE CONTAINER */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden mb-8">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Upcoming Issuance Window
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {upcomingEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-black text-slate-900">
                      {format(new Date(event.dueAt!), 'MMM d, yyyy')}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-700">
                      {event.title}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-green-600 uppercase tracking-tighter">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OFFICIAL GOVERNMENT LINK BLOCK */}
        {state.officialUrl && (
          <div className="p-8 md:p-12 rounded-[3rem] bg-blue-50 border-2 border-blue-100 space-y-6">
            <div className="flex items-center gap-3 text-blue-600">
              <Landmark className="w-6 h-6" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                Official {state.name} Government Site
              </h3>
            </div>
            
            <p className="text-slate-600 font-bold text-lg leading-relaxed max-w-2xl">
              To apply for benefits, renew your case, or report changes, please visit 
              the official {state.name} assistance portal. We provide this link as 
              a verified navigation resource for your security.
            </p>

            <div className="pt-4">
              <OfficialResourceLink 
                url={state.officialUrl} 
                stateName={state.name} 
              />
            </div>

            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-t border-blue-100 pt-6">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Official Government Website
            </div>
          </div>
        )}
      </main>
    </div>
  );
}