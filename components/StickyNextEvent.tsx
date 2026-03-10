'use client'

import Link from "next/link";
import { ShieldCheck, ArrowRight, Info, Clock } from "lucide-react";
import EventTimeDisplay from "./EventTimeDisplay"; 
import { useState, useEffect } from "react";

interface StickyNextEventProps {
  title: string;
  dueAt: Date;
  officialZone: string;
  url: string;
  sourceName?: string;
  status: 'CONFIRMED' | 'ESTIMATED' | 'TBA';
  lastVerified?: string;
}

export default function StickyNextEvent({ 
  title, 
  dueAt,
  officialZone,
  url, 
  sourceName = "Official Documentation",
  status,
  lastVerified = "Just now"
}: StickyNextEventProps) {
  
  // New State to handle real-time precise counting
  const [timeLeft, setTimeLeft] = useState({ value: '--', label: 'CALCULATING' });

  useEffect(() => {
    if (!dueAt) return;

    const calculateTime = () => {
      const diffMs = dueAt.getTime() - Date.now();

      if (diffMs <= 0) {
        setTimeLeft({ value: 'LIVE', label: 'NOW' });
        return;
      }

      const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diffMs / (1000 * 60)) % 60);

      if (d > 0) {
        // More than 24 hours? Show Days.
        setTimeLeft({ value: d.toString(), label: d === 1 ? 'DAY' : 'DAYS' });
      } else {
        // Less than 24 hours? Show exact hours and minutes.
        setTimeLeft({ value: `${h}h ${m}m`, label: 'REMAINING' });
      }
    };

    calculateTime(); // Run immediately
    const interval = setInterval(calculateTime, 1000); // Tick every second
    return () => clearInterval(interval);
  }, [dueAt]);

  const statusStyles = {
    CONFIRMED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ESTIMATED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    TBA: "bg-slate-800 text-slate-400 border-slate-700"
  };

  return (
    <div className="max-w-5xl mx-auto px-4 mb-8">
      <Link href={url} className="group block">
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden transition-all hover:border-slate-600 shadow-sm flex flex-col">
          
          <div className="p-5 md:p-8 flex flex-col md:flex-row justify-between gap-8">
            
            {/* LEFT: The Primary Record */}
            <div className="flex flex-col flex-1">
              <h2 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-1">
                {title}
              </h2>
              
              <EventTimeDisplay dueAt={dueAt} officialZone={officialZone} isHero={true} />

              <div className="mt-5 flex items-start">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[11px] font-black uppercase tracking-widest ${statusStyles[status]}`}>
                   {status === 'CONFIRMED' && <ShieldCheck className="w-3.5 h-3.5" />}
                   {status === 'ESTIMATED' && <Info className="w-3.5 h-3.5" />}
                   {status} Official Schedule
                </div>
              </div>
            </div>

            {/* RIGHT: The Live Ticking Actionable Countdown */}
            <div className="flex flex-col items-start md:items-end justify-center md:border-l md:border-slate-800 md:pl-8 min-w-[220px]">
              <div className="flex flex-col justify-center bg-slate-800/40 border border-slate-700/50 rounded-lg px-6 py-4 w-full md:w-auto">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Time Remaining
                </span>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-black tabular-nums text-slate-50 tracking-tight">
                    {timeLeft.value}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {timeLeft.label}
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* BOTTOM: Provenance & Authority Footer */}
          <div className="bg-slate-900 border-t border-slate-800 px-5 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold">Source:</span> {sourceName}
              </span>
              <span className="hidden sm:inline text-slate-700">•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Last verified: {lastVerified}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 group-hover:text-blue-400 transition-colors uppercase tracking-widest">
              How this is calculated <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </Link>
    </div>
  );
}