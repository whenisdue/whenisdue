"use client";

import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

interface SmartCountdownProps {
  dueAt: string;
}

export default function SmartCountdown({ dueAt }: SmartCountdownProps) {
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

  if (!isMounted) {
    return (
      <div className="h-12 w-48 bg-slate-100 animate-pulse rounded-md mt-2"></div>
    );
  }

  // INSTITUTIONAL ZERO-STATE: Payment Issued & Bank Processing Reassurance
  if (timeLeft.total <= 0) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-md text-sm font-bold uppercase tracking-widest border border-blue-200 self-start">
          <CheckCircle2 className="w-4 h-4" />
          Payment Issued
        </div>
        <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-[260px]">
          The scheduled payment date has passed. Your financial institution may take additional time (often 24-48 hours) to post the deposit to your available balance.
        </p>
      </div>
    );
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => {
    const displayLabel = value === 1 ? label.slice(0, -1) : label;
    
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-3xl md:text-4xl font-black tabular-nums tracking-tight text-slate-900">
          {value}
        </span>
        <span className="text-sm md:text-base font-bold text-slate-500 uppercase tracking-widest">
          {displayLabel}
        </span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4 mt-2">
      {timeLeft.days > 14 ? (
        <TimeBlock value={timeLeft.days} label="Days" />
      ) : timeLeft.days > 0 ? (
        <>
          <TimeBlock value={timeLeft.days} label="Days" />
          <TimeBlock value={timeLeft.hours} label="Hours" />
        </>
      ) : timeLeft.hours > 0 ? (
        <>
          <TimeBlock value={timeLeft.hours} label="Hours" />
          <TimeBlock value={timeLeft.minutes} label="Minutes" />
        </>
      ) : (
        <>
          <TimeBlock value={timeLeft.minutes} label="Minutes" />
          <TimeBlock value={timeLeft.seconds} label="Seconds" />
        </>
      )}
    </div>
  );
}