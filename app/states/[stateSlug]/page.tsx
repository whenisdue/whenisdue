import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma"; 
import { STATE_REGISTRY, getStateBySlug } from "@/src/lib/states-data";
import { format } from "date-fns";
import { Calendar, ShieldCheck, MapPin, ExternalLink, Info, CheckCircle2 } from "lucide-react";

// Next.js 15 Requirement: Params must be treated as a Promise
type PageProps = {
  params: Promise<{ stateSlug: string }>;
};

// 1. ASYNC METADATA
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { stateSlug } = await params; // <--- MUST AWAIT
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

// 2. ASYNC PAGE COMPONENT
export default async function StatePage({ params }: PageProps) {
  const { stateSlug } = await params; // <--- MUST AWAIT
  const state = getStateBySlug(stateSlug);
  
  if (!state) notFound();

  const upcomingEvents = await prisma.event.findMany({
    where: { 
      category: state.code as any, 
      dueAt: { gte: new Date() } 
    },
    orderBy: { dueAt: 'asc' },
    take: 10
  });

  const nextPayment = upcomingEvents[0];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ... (The rest of your UI code stays exactly the same) ... */}
      <section className="bg-slate-900 text-white pt-20 pb-32 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-none">
            {state.name} <span className="text-slate-500">2026</span><br />
            Issuance Schedule
          </h1>
          {/* ... etc ... */}
        </div>
      </section>
      
      <main className="max-w-5xl mx-auto px-6 -mt-16 pb-20">
         {/* ... (The rest of the UI blocks from Phase 14) ... */}
         <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden mb-12">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Upcoming Issuance Window
                </h2>
            </div>
            {/* ... table content ... */}
         </div>
      </main>
    </div>
  );
}