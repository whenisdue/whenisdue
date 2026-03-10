"use client";

import { useEffect, useMemo, useState } from "react";

// Helper to ensure numbers like 5 show up as "05"
const pad = (num: number) => String(num).padStart(2, "0");

export default function EventCountdown({ targetEpochMs }: { targetEpochMs: number }) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = useMemo(() => {
    if (nowMs === null) return null;
    const diff = targetEpochMs - nowMs;
    if (diff <= 0) return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      done: false,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [targetEpochMs, nowMs]);

  if (remaining === null) {
    return <div className="text-zinc-500 font-mono text-sm animate-pulse">CALCULATING...</div>;
  }

  if (remaining.done) {
    return (
      <div className="inline-block bg-emerald-500 text-black px-4 py-2 rounded font-black tracking-widest uppercase shadow-[0_0_20px_rgba(16,185,129,0.4)]">
        Live Now
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 text-center">
      {/* Days */}
      <div className="flex flex-col w-16 md:w-20">
        <span className="text-4xl md:text-5xl font-black font-mono tabular-nums text-emerald-400">{remaining.days}</span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Days</span>
      </div>
      
      {/* Separator (pushed up slightly to align with the numbers, ignoring the label) */}
      <div className="text-3xl md:text-4xl font-black font-mono text-zinc-700 pb-5">:</div>

      {/* Hours */}
      <div className="flex flex-col w-16 md:w-20">
        <span className="text-4xl md:text-5xl font-black font-mono tabular-nums text-emerald-400">{pad(remaining.hours)}</span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Hours</span>
      </div>

      <div className="text-3xl md:text-4xl font-black font-mono text-zinc-700 pb-5">:</div>

      {/* Minutes */}
      <div className="flex flex-col w-16 md:w-20">
        <span className="text-4xl md:text-5xl font-black font-mono tabular-nums text-emerald-400">{pad(remaining.minutes)}</span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Mins</span>
      </div>

      <div className="text-3xl md:text-4xl font-black font-mono text-zinc-700 pb-5">:</div>

      {/* Seconds */}
      <div className="flex flex-col w-16 md:w-20">
        <span className="text-4xl md:text-5xl font-black font-mono tabular-nums text-emerald-400">{pad(remaining.seconds)}</span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">Secs</span>
      </div>
    </div>
  );
}