'use client';

import { useState, useEffect } from 'react';

export default function CountdownEngine({ dateISO }: { dateISO: string | null }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0, total: 1 // Default > 0 to prevent instant T-0 flash
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!dateISO) return;

    const target = new Date(dateISO).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference,
      });
    };

    updateTimer(); // Initial sync
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dateISO]);

  // A11y live region string
  const ariaString = `${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes remaining.`;

  // Hydration safe skeleton
  if (!mounted) {
    return (
      <div className="text-5xl md:text-7xl font-black text-white/20 tabular-nums mb-8 animate-pulse">
        00:00:00:00
      </div>
    );
  }

  if (!dateISO) {
    return <div className="text-5xl md:text-7xl font-black text-white tabular-nums mb-8">TBA</div>;
  }

  // T-0 State Transition Rule
  if (timeLeft.total <= 0) {
    return (
      <div className="text-5xl md:text-7xl font-black text-red-500 mb-8 flex items-center gap-4 animate-pulse">
        <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-red-500"></div>
        LIVE NOW
      </div>
    );
  }

  return (
    <>
      {/* Visually hidden ARIA live region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {ariaString}
      </div>
      
      <div className="flex justify-center gap-2 md:gap-4 text-center mb-8" aria-hidden="true">
        <div className="flex flex-col">
          <span className="text-4xl md:text-7xl font-black text-white tabular-nums">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Days</span>
        </div>
        <span className="text-4xl md:text-7xl font-black text-zinc-700">:</span>
        <div className="flex flex-col">
          <span className="text-4xl md:text-7xl font-black text-white tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Hours</span>
        </div>
        <span className="text-4xl md:text-7xl font-black text-zinc-700">:</span>
        <div className="flex flex-col">
          <span className="text-4xl md:text-7xl font-black text-white tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Mins</span>
        </div>
        <span className="text-4xl md:text-7xl font-black text-zinc-700">:</span>
        <div className="flex flex-col">
          <span className="text-4xl md:text-7xl font-black text-white tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Secs</span>
        </div>
      </div>
    </>
  );
}