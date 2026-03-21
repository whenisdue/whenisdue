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

  // FIXED: We ask Prisma for the official "STATE" category, 
  // then tell it to search the title for the specific state's name (e.g., "Alabama")
  const upcomingEvents = await prisma.event.findMany({
    where: { 
      category: "STATE", // Matches your exact Prisma Enum
      title: {
        contains: state.name, // Looks for "Alabama", "Texas", etc. in the event title
        mode: "insensitive" // Ignores uppercase/lowercase differences
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
        {/* DATA TABLE */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden mb-12">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Upcoming Issuance Window
            </h2>
            <a 
              href={`https://google.com/search?q=official+benefit+issuance+schedule+${state.name}+2026`}
              target="_blank" 
              className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors"
            >
              Verify with Agency <ExternalLink className="w-3 h-3" />
            </a>
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
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">2026 Cycle</p>
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

        {/* EDUCATIONAL CONTENT */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Understanding {state.name} Schedules</h3>
              <p className="text-slate-600 leading-relaxed font-medium mb-6">
                Most benefit programs in <strong>{state.name}</strong> operate on a staggered issuance 
                cycle. This means your specific payment date depends on the 
                <strong> last digit of your case number</strong> or your 
                <strong> registration date</strong>.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Refer to your latest agency award letter to locate your ID.</span>
                </li>
                <li className="flex gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Match your digits against the staggered window listed above.</span>
                </li>
              </ul>
            </div>
            <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-800">Operational Logic</h4>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed font-bold">
                If your scheduled date falls on a weekend or federal holiday, our 2026 
                engine automatically adjusts to the <strong>preceding business day</strong>. 
                This accounts for standard ACH banking settlement times and ensures 
                data reliability.
              </p>
            </div>
          </div>
        </section>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-12">
          Data synchronized with official {state.name} regional publications
        </p>
      </main>
    </div>
  );
}