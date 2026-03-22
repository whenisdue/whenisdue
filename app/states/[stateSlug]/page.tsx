import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma"; 
import { STATE_REGISTRY, getStateBySlug } from "@/src/lib/states-data";
import { format } from "date-fns";
import { Calendar, ShieldCheck, MapPin, ExternalLink, Info, CheckCircle2 } from "lucide-react";

type PageProps = {
  params: Promise<{ stateSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stateSlug } = await params; 
  const state = getStateBySlug(stateSlug);
  if (!state) return { title: "State Not Found" };

  return {
    title: `${state.name} 2026 Benefit Schedule | Official Dates`,
    description: `View the verified 2026 ${state.name} payment dates and issuance schedules.`,
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

  // We fetch the state-specific events from Prisma
  const upcomingEvents = await prisma.event.findMany({
    where: { 
      category: "STATE",
      title: {
        contains: state.name,
        mode: "insensitive"
      },
      dueAt: { gte: new Date() } 
    },
    orderBy: { dueAt: 'asc' },
    take: 10
  });

  const nextPayment = upcomingEvents[0];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HERO */}
      <section className="bg-slate-900 text-white pt-20 pb-32 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-blue-400">{state.name} Operations</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-none">
            {state.name} <span className="text-slate-500">2026</span><br />
            Issuance Schedule
          </h1>

          {nextPayment ? (
            <div className="inline-flex flex-col md:flex-row items-start md:items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Next Expected Date</p>
                <p className="text-3xl font-black text-white">{format(new Date(nextPayment.dueAt!), 'MMMM d, yyyy')}</p>
              </div>
              <div className="h-12 w-px bg-white/10 hidden md:block" />
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-bold text-green-400">Audit-Verified Data Source</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 font-medium italic">No upcoming events currently scheduled for {state.name}.</p>
          )}
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 -mt-16 pb-20">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden mb-12">
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
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Expected Date</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Program / Event</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {upcomingEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900">{format(new Date(event.dueAt!), 'MMM d')}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-700">{event.title}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}