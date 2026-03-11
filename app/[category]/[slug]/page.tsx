import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ShieldCheck, MapPin, Clock, FileText, AlertCircle, Info, ArrowRight, CheckCircle2 } from "lucide-react";
import EventTimeDisplay from "@/components/EventTimeDisplay";
import SmartCountdown from "@/components/SmartCountdown";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({ params }: { params: Promise<{ category: string, slug: string }> }) {
  
  // THE FIX: Await the params!
  const { category, slug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug },
    include: { series: true }
  });

  if (!event || event.category.toLowerCase() !== category.toLowerCase()) {
    notFound();
  }

  // Institutional Status Taxonomy
  const status = event.dueAt ? (event.category === "FEDERAL" || event.series?.priorityWeight! > 8 ? "CONFIRMED" : "ESTIMATED") : "PENDING UPDATE";
  
  const statusStyles = {
    CONFIRMED: "bg-green-50 text-green-800 border-green-200",
    ESTIMATED: "bg-slate-100 text-slate-700 border-slate-300",
    "PENDING UPDATE": "bg-amber-50 text-amber-800 border-amber-200",
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      
      {/* 1. INDEPENDENCE DISCLOSURE & BREADCRUMBS */}
      <div className="bg-white border-b border-slate-200 pt-4 pb-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Independent Reference Site • Not affiliated with any government agency
             </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">{event.category}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-8">
        
        {/* 2. THE CAVEAT BOX (Crucial for Financial Trust) */}
        {event.category === "FEDERAL" || event.category === "STATE" ? (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-blue-900 leading-relaxed">
              <strong>Notice:</strong> Disbursement times can vary by financial institution. While funds are typically released by the Treasury at midnight, your bank may take up to 24-48 hours to post the deposit to your available balance.
            </p>
          </div>
        ) : null}

        {/* 3. PRIMARY RECORD BLOCK */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-8">
          <div className="p-8 md:p-12">
            
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-6">
              {event.title}
            </h1>

            <div className="flex flex-col lg:flex-row justify-between gap-10">
              
              {/* Left: The Factual Date & Status */}
              <div className="flex-1">
                {event.dueAt ? (
                  <EventTimeDisplay dueAt={event.dueAt} officialZone={event.timeZone || 'UTC'} isHero={true} />
                ) : (
                  <div className="text-4xl font-black text-slate-400 mb-2">DATE PENDING</div>
                )}

                <div className="flex items-center gap-2 mt-4 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md inline-flex self-start border border-slate-100">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Time localized to your device settings</span>
                </div>

                <div className="mt-8">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Record Status</span>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border ${statusStyles[status as keyof typeof statusStyles]}`}>
                    {status === 'CONFIRMED' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {status}
                  </div>
                </div>
              </div>

              {/* Right: The Structured Countdown */}
              {event.dueAt && (
                <div className="lg:border-l border-slate-100 lg:pl-10 flex flex-col justify-center min-w-[280px]">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Expected Time Remaining</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 [&>div]:scale-[0.85] [&>div]:origin-left overflow-hidden">
                    {/* We scale the old dark SmartCountdown down temporarily until we update its code */}
                    <SmartCountdown dueAt={event.dueAt.toISOString()} />
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 4. METADATA EVIDENCE STRIP */}
          <div className="bg-slate-50 border-t border-slate-200 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Source:</span> {event.series?.sourceName || "Official Agency Record"}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Last verified: {event.lastVerified ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(event.lastVerified) : "Recently"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. STRUCTURED CONTEXT / METHODOLOGY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Disbursement Details</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {event.whatToExpect || "Disbursements are processed according to the official federal and state calendars. Electronic direct deposits typically clear faster than mailed paper checks."}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Eligibility & Verification</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {event.targetAudience || "This schedule applies to registered beneficiaries. Please ensure your banking information is up to date with your respective agency portal to avoid delays."}
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}