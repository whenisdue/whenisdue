"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  title: string;
  date: string;
  days: number | string;
  url: string;
};

export default function StickyNextEvent({ title, date, days, url }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show the bar after scrolling past the top section
      setVisible(window.scrollY > 250);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <Link 
      href={url} 
      className="fixed top-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-md border-b border-zinc-800 shadow-2xl transition-all duration-300 animate-in slide-in-from-top-4"
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-emerald-500 uppercase tracking-widest text-[10px] font-bold bg-emerald-500/10 px-2 py-1 rounded-sm">
              Next Event
            </span>
            <span className="text-zinc-100 font-bold truncate max-w-[200px] sm:max-w-xs">
              {title}
            </span>
        </div>

        <div className="flex items-center gap-4">
            <span className="hidden md:inline-block text-zinc-400 text-xs font-medium">
              {date}
            </span>
            <span className="text-emerald-400 font-black tracking-tight">
              {days} <span className="text-[10px] text-emerald-500/70 uppercase font-sans">{days === "TBA" ? "" : "Days"}</span>
            </span>
        </div>
      </div>
    </Link>
  );
}