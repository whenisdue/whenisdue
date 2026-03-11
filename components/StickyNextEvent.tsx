'use client'

import Link from "next/link";
import { ShieldCheck, Info, Clock, MapPin, ArrowRight, FileText, CheckCircle2 } from "lucide-react";
import EventTimeDisplay from "./EventTimeDisplay"; 
import { useState, useEffect } from "react";

interface StickyNextEventProps {
  title: string;
  dueAt: Date;
  officialZone: string;
  url: string;
  sourceName?: string;
  status: 'CONFIRMED' | 'ESTIMATED' | 'TBA' | 'PENDING UPDATE';
  lastVerified?: string;
}

export default function StickyNextEvent({ 
  title, dueAt, officialZone, url, sourceName = "Official Agency Documentation", status, lastVerified = "Today"
}: StickyNextEventProps) {
  
  const [timeLeft, setTimeLeft] = useState({ value: '--', label: 'CALCULATING' });
  const [locationLabel, setLocationLabel] = useState("Detecting location...");
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!dueAt) return;
    const calculateTime = () => {
      const diffMs = dueAt.getTime() - Date.now();
      
      // THE FIX: Lifecycle State Switch
      if (diffMs <= 0) {
        setIsPast(true);
        return;
      }
      
      setIsPast(false);
      const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      if (d > 0) {
        setTimeLeft({ value: d.toString(), label: d === 1 ? 'DAY' : 'DAYS' });
      } else {
        setTimeLeft({ value: `${h}h`, label: 'REMAINING' });
      }
    };

    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const city = zone.split('/').pop()?.replace('_', ' ') || "Local Timezone";
      setLocationLabel(`${city}`);
    } catch (e) {
      setLocationLabel("Local Timezone");
    }

    calculateTime();
    const interval = setInterval(calculateTime, 60000); 
    return () => clearInterval(interval);
  }, [dueAt]);

  const statusStyles = {
    CONFIRMED: "bg-green-50 text-green-800 border-green-200",
    ESTIMATED: "bg-slate-100 text-slate-700 border-slate-300",
    "PENDING UPDATE": "bg-amber-50 text-amber-800 border-amber-200",
    TBA: "bg-slate-100 text-slate-500 border-slate-200"
  };

  return (
    <div className="max-w-5xl mx-auto px-4 mb-10">
      
      <div className="mb-2 px-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Independent Reference Site • Not affiliated with any government agency
        </span>
      </div>

      <Link href={url} className="group block">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
          
          <div className="p-6 md:p-10 flex flex-col md:flex-row justify-between gap-10">
            
            <div className="flex flex-col flex-1">
              <h1 className="text-xl font-bold text-slate-600 mb-4">{title}</h1>
              
              <EventTimeDisplay dueAt={dueAt} officialZone={officialZone} isHero={true} />

              <div className="flex items-center gap-2 mt-3 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md inline-flex self-start border border-slate-100">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Time shown for: {locationLabel}</span>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end md:pl-10 md:border-l md:border-slate-100 min-w-[240px]">
              
              <div className="mb-6 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Record Status</span>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest border ${statusStyles[status]}`}>
                   {status === 'CONFIRMED' && <ShieldCheck className="w-4 h-4" />}
                   {status}
                </div>
              </div>

              {/* DYNAMIC LIFECYCLE BLOCK */}
              <div className="w-full md:w-auto">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  {isPast ? "Settlement Status" : "Expected In"}
                </span>
                
                {isPast ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">Payment Issued</span>
                    <span className="text-xs font-medium text-slate-500 max-w-[200px] leading-relaxed">
                      Your bank may take additional time to process and post the deposit.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tabular-nums text-slate-900">{timeLeft.value}</span>
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-500">{timeLeft.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 px-6 md:px-10 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Source:</span> {sourceName}
              </div>
              <div className="flex items-center gap-2 sm:border-l sm:border-slate-300 sm:pl-6">
                <Clock className="w-3.5 h-3.5" />
                <span>Last verified: {lastVerified}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors">
              <FileText className="w-3.5 h-3.5" /> Methodology <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </Link>
    </div>
  );
}