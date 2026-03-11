import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Clock, CheckCircle2, AlertCircle, ChevronRight, FileText } from "lucide-react";
import EventTimeDisplay from "@/components/EventTimeDisplay";

export const dynamic = 'force-dynamic';

export default async function AgenciesDirectory() {
  
  // Fetch all relevant institutional events
  const events = await prisma.event.findMany({
    where: { 
      isArchived: false,
      category: { in: ["FEDERAL", "STATE", "TAX", "MARKETS"] } 
    },
    orderBy: { dueAt: 'asc' },
    include: { series: true }
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      
      {/* 1. BREADCRUMBS & INDEPENDENCE DISCLOSURE */}
      <div className="bg-white border-b border-slate-200 pt-4 pb-4">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Independent Reference Site • Not affiliated with any government agency
             </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <Link href="/" className="hover:text-blue-700 transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">Program Directory</span>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY HEADER */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-10 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Program Directory
          </h1>
        </div>
        <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
          Index of scheduled payment dates, benefit windows, and financial events. Select a program below to view specific disbursement details and settlement timelines.
        </p>
      </div>

      {/* 3. INSTITUTIONAL DATA TABLE */}
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* Table Header (Hidden on small mobile for clean stacking) */}
          <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-50 border-b border-slate-200 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <div className="col-span-5">Program / Schedule</div>
            <div className="col-span-3">Next Expected Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Jurisdiction</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100">
            {events.map((event) => {
              const status = event.dueAt ? (event.category === "FEDERAL" || event.series?.priorityWeight! > 8 ? "CONFIRMED" : "ESTIMATED") : "PENDING";
              
              return (
                <Link 
                  key={event.id} 
                  href={`/${event.category.toLowerCase()}/${event.slug}`}
                  className="block group hover:bg-blue-50/50 transition-colors px-6 py-5 md:py-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center">
                    
                    {/* Program Name */}
                    <div className="col-span-1 md:col-span-5">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5 group-hover:text-blue-500 transition-colors" />
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">
                            {event.title}
                          </h2>
                          <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
                            <span>Source: {event.series?.sourceName || "Official Agency"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Next Date */}
                    <div className="col-span-1 md:col-span-3 md:pl-2">
                      <span className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Next Date</span>
                      {event.dueAt ? (
                        <div className="text-base font-bold text-slate-700">
                          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(event.dueAt)}
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-400">Pending Release</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-1 md:col-span-2">
                      <span className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-widest border ${
                        status === 'CONFIRMED' ? "bg-green-50 text-green-800 border-green-200" :
                        status === 'ESTIMATED' ? "bg-slate-100 text-slate-700 border-slate-300" :
                        "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        {status === 'CONFIRMED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {status}
                      </div>
                    </div>

                    {/* Jurisdiction & Arrow */}
                    <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end">
                      <span className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-widest">Jurisdiction</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-500">{event.category}</span>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors hidden md:block" />
                      </div>
                    </div>

                  </div>
                </Link>
              );
            })}
            
            {events.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500">
                No active schedules found.
              </div>
            )}
          </div>
          
        </div>
      </div>
    </main>
  );
}