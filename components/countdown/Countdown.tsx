"use client";

import { useEffect, useMemo, useState } from "react";

function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function formatPretty(dt: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dt);
  } catch {
    return dt.toISOString();
  }
}

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}

type Parts = {
  isPast: boolean;
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function diffParts(nowMs: number, targetMs: number): Parts {
  const raw = targetMs - nowMs;
  const isPast = raw <= 0;
  const abs = Math.abs(raw);

  const totalSeconds = Math.floor(abs / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    isPast,
    totalMs: abs,
    days,
    hours,
    minutes,
    seconds,
  };
}

export default function Countdown({ targetIso }: { targetIso: string }) {
  // 1. Initialize with 0 to prevent SSR Hydration errors
  const [nowMs, setNowMs] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  // 2. Only start tracking time AFTER the component mounts on the client
  useEffect(() => {
    setMounted(true);
    setNowMs(Date.now()); // Set the real time immediately on mount
    
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const targetDate = useMemo(() => {
    const dt = new Date(targetIso);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }, [targetIso]);

  const parts = useMemo(() => {
    // 3. Don't calculate parts until we have a real client-side time
    if (!targetDate || !mounted) return null;
    return diffParts(nowMs, targetDate.getTime());
  }, [nowMs, targetDate, mounted]);

  // If we aren't mounted or don't have parts yet, show a clean loading state
  if (!mounted || !targetDate || !parts) {
    return (
      <div className="min-h-[164px] flex flex-col justify-center">
        <div className="text-5xl font-semibold tracking-tight">—</div>
        <div className="mt-3 text-sm opacity-75">Computing...</div>
      </div>
    );
  }

  const safeDays = parts.isPast ? 0 : parts.days;

  return (
    <div className="min-h-[164px] flex flex-col justify-center">
      {/* Dominant answer */}
      <div className="text-6xl sm:text-7xl font-semibold tracking-tight">
        {safeDays}{" "}
        <span className="opacity-90">{plural(safeDays, "day")}</span>
      </div>

      {/* Secondary answer: spelled-out countdown */}
      <div
        className="mt-4 text-2xl sm:text-3xl font-medium tracking-tight opacity-90 tabular-nums"
        aria-label={`${parts.hours} ${plural(parts.hours, "hour")}, ${parts.minutes} ${plural(parts.minutes, "minute")}, ${parts.seconds} ${plural(parts.seconds, "second")}`}
      >
        <span className="sm:hidden whitespace-nowrap">
          {parts.hours}h {parts.minutes}m {parts.seconds}s
        </span>
        <span className="hidden sm:inline">
          {parts.hours} {plural(parts.hours, "hour")}, {parts.minutes} {plural(parts.minutes, "minute")}, {parts.seconds} {plural(parts.seconds, "second")}
        </span>
      </div>

      {/* Supporting line */}
      <div className="mt-2 text-sm opacity-70">{parts.isPast ? "This has started." : "Time remaining."}</div>

      {/* Quiet details */}
      <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-sm opacity-80">
        <div>
          <span className="opacity-60">Until</span>{" "}
          <span className="font-medium opacity-90">{formatPretty(targetDate)}</span>
        </div>
      </div>
    </div>
  );
}
