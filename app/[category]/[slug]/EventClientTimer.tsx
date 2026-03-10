"use client";

import { useState, useEffect, useMemo } from "react";
import { Globe, Clock, CalendarPlus } from "lucide-react";

interface Props {
  targetEpochMs: number;
  title: string;
  officialZone: string;
}

export default function EventClientTimer({ targetEpochMs, title, officialZone }: Props) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [localTimezone, setLocalTimezone] = useState<string>("Loading...");

  useEffect(() => {
    // 1. Set initial client time to fix hydration
    setNowMs(Date.now());
    
    // 2. Get local browser timezone name safely
    try {
      setLocalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (e) {
      setLocalTimezone("Local Time");
    }

    // 3. Start the loop
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 100); 

    return () => clearInterval(interval);
  }, []);

  // Calculate time parts safely
  const remainingMs = useMemo(() => {
    if (nowMs === null) return null;
    return Math.max(0, targetEpochMs - nowMs);
  }, [nowMs, targetEpochMs]);

  // Universal Calendar .ics Generator
  const generateIcs = () => {
    const targetDate = new Date(targetEpochMs);
    const endDate = new Date(targetEpochMs + 60 * 60 * 1000); 

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//WhenIsDue//EN
BEGIN:VEVENT
UID:${Date.now()}@whenisdue.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(targetDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
DESCRIPTION:Tracked via WhenIsDue.com
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (remainingMs === null) {
    return (
      <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 animate-pulse min-h-[300px] flex items-center justify-center shadow-2xl">
        <span className="text-zinc-500 font-mono tracking-widest uppercase text-sm">Syncing Live Clock...</span>
      </div>
    );
  }

  const isLive = remainingMs <= 0;
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  const targetDate = new Date(targetEpochMs);

  const localTimeString = targetDate.toLocaleString(undefined, {
    weekday: "long", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short"
  });

  let officialTimeString = "";
  try {
    officialTimeString = targetDate.toLocaleString("en-US", {
       timeZone: officialZone !== "UTC" ? officialZone : undefined,
       hour: "numeric", minute: "2-digit", timeZoneName: "short"
    });
  } catch (e) {
    officialTimeString = targetDate.toLocaleString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  }

  return (
    <div className="rounded-3xl bg-zinc-950 border border-zinc-800 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
      
      {/* --- LIVE COUNTDOWN SECTION --- */}
      <div className="p-8 md:p-12 text-center border-b border-zinc-800/50">
        {isLive ? (
          <div className="inline-block bg-emerald-500 text-black px-10 py-5 rounded-2xl animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.5)]">
            <span className="text-4xl md:text-6xl font-black tracking-widest uppercase">Live Now</span>
          </div>
        ) : (
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-6">Starts In</span>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
              <div className="flex flex-col items-center min-w-[70px]">
                <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">{pad(days)}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">Days</span>
              </div>
              <span className="text-4xl md:text-6xl font-black text-zinc-800 pb-5 hidden sm:block">:</span>
              <div className="flex flex-col items-center min-w-[70px]">
                <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white">{pad(hours)}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">Hours</span>
              </div>
              <span className="text-4xl md:text-6xl font-black text-zinc-800 pb-5 hidden sm:block">:</span>
              <div className="flex flex-col items-center min-w-[70px]">
                <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-white">{pad(minutes)}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">Minutes</span>
              </div>
              <span className="text-4xl md:text-6xl font-black text-zinc-800 pb-5 hidden sm:block">:</span>
              <div className="flex flex-col items-center min-w-[70px]">
                <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter text-zinc-400">{pad(seconds)}</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-600 mt-2">Seconds</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- DUAL-TIME TRUST STACK --- */}
      <div className="p-6 md:p-8 bg-black grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4 border-l-2 border-emerald-500 pl-5">
          <div>
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">
              <Globe className="w-3.5 h-3.5" /> Your Local Time
            </span>
            <div className="text-lg md:text-xl font-bold text-white mb-1">{localTimeString}</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Auto-adjusted for {localTimezone}</div>
          </div>
        </div>

        {/* --- UPGRADED ACTION SECTION --- */}
        <div className="flex flex-col md:items-end justify-center space-y-5">
           <div className="md:text-right">
            <span className="flex items-center md:justify-end gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
              <Clock className="w-3.5 h-3.5" /> Official Source Time
            </span>
            <div className="text-sm font-bold text-zinc-300">{officialTimeString}</div>
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <button 
              onClick={generateIcs}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all group shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              <CalendarPlus className="w-4 h-4" />
              Get Calendar Reminder
            </button>
            <p className="text-[9px] text-zinc-600 uppercase tracking-tighter text-center md:text-right font-bold">
              Adds to iPhone, Android, or Outlook
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}