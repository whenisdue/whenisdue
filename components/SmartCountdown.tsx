"use client";

import { useState, useEffect } from "react";

interface SmartCountdownProps {
  dueAt: string;
  urgent?: boolean;
}

export default function SmartCountdown({ dueAt, urgent = false }: SmartCountdownProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 1 });

  useEffect(() => {
    setIsMounted(true);

    const calculateTimeLeft = () => {
      const difference = new Date(dueAt).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          total: difference,
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [dueAt]);

  // Prevents hydration mismatch errors in Next.js
  if (!isMounted) {
    return (
      <div className="h-8 w-32 bg-zinc-900 animate-pulse rounded-md mt-2"></div>
    );
  }

  // Event is happening now
  if (timeLeft.total <= 0) {
    return (
      <div className="inline-flex items-center mt-2">
        <span className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-400 font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse">
          Live Now
        </span>
      </div>
    );
  }

  // The new, highly-readable side-by-side layout
  const TimeBlock = ({ value, label }: { value: number; label: string }) => {
    // Drop the "s" if the value is exactly 1 (e.g., "1 Day" instead of "1 Days")
    const displayLabel = value === 1 ? label.slice(0, -1) : label;
    
    return (
      <div className="flex items-baseline gap-1.5">
        <span 
          className={`text-2xl font-bold tabular-nums tracking-tight ${
            urgent ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-white'
          }`}
        >
          {value}
        </span>
        <span 
          className={`text-xl font-medium ${
            urgent ? 'text-emerald-500/80' : 'text-zinc-400'
          }`}
        >
          {displayLabel}
        </span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3 mt-1">
      {/* Dynamic Display Logic based on how close the event is */}
      {timeLeft.days > 14 ? (
        // Far away: Just show Days
        <TimeBlock value={timeLeft.days} label="Days" />
      ) : timeLeft.days > 0 ? (
        // Less than 2 weeks: Show Days + Hours
        <>
          <TimeBlock value={timeLeft.days} label="Days" />
          <TimeBlock value={timeLeft.hours} label="Hours" />
        </>
      ) : timeLeft.hours > 0 ? (
        // Less than 24 hours: Show Hours + Minutes
        <>
          <TimeBlock value={timeLeft.hours} label="Hours" />
          <TimeBlock value={timeLeft.minutes} label="Minutes" />
        </>
      ) : (
        // Less than 1 hour: Show Minutes + Seconds (High urgency)
        <>
          <TimeBlock value={timeLeft.minutes} label="Minutes" />
          <TimeBlock value={timeLeft.seconds} label="Seconds" />
        </>
      )}
    </div>
  );
}