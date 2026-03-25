import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma"; 
import { format } from "date-fns";
import { ShieldCheck, Info, Landmark } from "lucide-react";

interface ScheduleRules {
  digit?: string;
  baseDay?: number;
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return { title: "Schedule Not Found" };
  return {
    title: event.seoTitle || event.title,
    description: event.seoDescription || event.shortSummary,
  };
}

export default async function SnapEventPage({ params }: PageProps) {
  const { slug } = await params;
  
  const event = await prisma.event.findUnique({
    where: { slug }
  });

  // 🛡️ DOCTOR STRANGE FIX: Extract and Guard
  // By destructuring 'dueAt' and then checking it, TS narrows the type perfectly.
  if (!event || !event.dueAt) notFound();
  
  const { dueAt, title, scheduleRules } = event;
  const rules = scheduleRules as unknown as ScheduleRules;

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-20 px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Card */}
        <div className="bg-white rounded-[3rem] border-4 border-slate-200 p-10 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
             <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg">
               <ShieldCheck className="w-6 h-6" />
             </div>
             <span className="text-xs font-black uppercase tracking-widest text-slate-500">Official Schedule</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
            {title}
          </h1>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col items-center text-center gap-2">
            <p className="text-xs font-black uppercase tracking-widest text-blue-400">Verified Deposit Date</p>
            {/* 🛡️ TS is now happy because 'dueAt' is no longer null */}
            <p className="text-4xl md:text-5xl font-black">{format(dueAt, 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white space-y-4 shadow-xl shadow-blue-100">
            <Landmark className="w-8 h-8 opacity-50" />
            <h3 className="text-xl font-black leading-tight">Issuing Agency</h3>
            <p className="font-bold opacity-90 leading-relaxed text-sm">
              Georgia DFCS via Georgia Gateway.
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 p-8 space-y-4">
            <Info className="w-8 h-8 text-slate-300" />
            <h3 className="text-xl font-black text-slate-900 leading-tight">Logic Details</h3>
            <p className="text-slate-600 font-bold leading-relaxed text-sm">
              Weekend-adjusted schedule for case IDs ending in {rules?.digit || 'XX'}.
            </p>
          </div>
        </div>

        <div className="bg-slate-100 rounded-[2.5rem] p-8 text-center border border-slate-200">
          <p className="text-slate-500 font-bold text-xs italic">
            Dates are verified for the 2026 calendar year.
          </p>
        </div>
      </div>
    </main>
  );
}