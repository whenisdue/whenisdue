import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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

// 🚀 AGENCY SOVEREIGN MAP: Translates database codes to resident-friendly names
const AGENCY_MAP: Record<string, string> = {
  CA: "California Department of Social Services (CDSS) via CalSAWS/CalWIN.",
  NY: "New York HRA / OTDA via Access HRA.",
  TX: "Texas HHSC via Your Texas Benefits.",
  FL: "Florida DCF via MyACCESS Florida.",
  GA: "Georgia DFCS via Georgia Gateway.",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ 
    where: { slug },
    include: { series: true }
  });
  
  if (!event) return { title: "Schedule Not Found" };
  
  return {
    title: event.seoTitle || event.title,
    description: event.seoDescription || event.shortSummary,
  };
}

export default async function SnapEventPage({ params }: PageProps) {
  const { slug } = await params;
  
  // 1. DATA FETCHING: Bring the 'Series' folder along with the 'Event' sticker
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { series: true } 
  });

  // 🛡️ Guard against missing data or series
  if (!event || !event.dueAt || !event.series) notFound();
  
  // --- SURGICAL REPLACEMENT: Lines 52-54 ---
  const { dueAt, title, scheduleRules } = event;
  
  // 🛡️ SOVEREIGN TYPE BYPASS: Tells TypeScript to trust the Engine
  const series = (event as any).series;
  const stateCode = series?.stateCode || "GA"; 
  
  const rules = scheduleRules as unknown as ScheduleRules;
// --- End Replacement ---

  // 2. CALIFORNIA CANONICAL REDIRECT: Force 1-digit sovereignty
  if (stateCode === 'CA' && slug.includes('-d')) {
    const parts = slug.split('-d');
    const digitPart = parts[1].split('-')[0];
    
    // If the URL has "d23", strip it down to "d3" and redirect
    if (digitPart.length > 1) {
      const canonicalSlug = slug.replace(`-d${digitPart}-`, `-d${digitPart.slice(-1)}-`);
      redirect(`/s/snap/${canonicalSlug}`);
    }
  }

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
            <p className="text-4xl md:text-5xl font-black">{format(dueAt, 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white space-y-4 shadow-xl shadow-blue-100">
            <Landmark className="w-8 h-8 opacity-50" />
            <h3 className="text-xl font-black leading-tight">Issuing Agency</h3>
            <p className="font-bold opacity-90 leading-relaxed text-sm">
              {/* 🚀 Dynamic lookup based on the Series Folder's stateCode */}
              {AGENCY_MAP[stateCode] || "State Social Services Agency."}
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] border-4 border-slate-200 p-8 space-y-4">
            <Info className="w-8 h-8 text-slate-300" />
            <h3 className="text-xl font-black text-slate-900 leading-tight">Logic Details</h3>
            <p className="text-slate-600 font-bold leading-relaxed text-sm">
              Weekend-adjusted schedule for case IDs ending in {rules?.digit || 'X'}.
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