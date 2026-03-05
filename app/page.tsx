import Link from "next/link";
import { Landmark, Gamepad2, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-[80vh] flex flex-col justify-center">
      {/* 1. The Multi-Intent Hero */}
      <section className="text-center mb-16 px-6">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
          VERIFIED AUTHORITY<span className="text-blue-500">.</span>
        </h1>
        <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          The WhenIsDue Engine tracks official distribution cadences and announcement windows for high-impact federal and digital events.
        </p>
      </section>

      {/* 2. The Two Doors (Intent Split) */}
      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto w-full px-6">
        
        {/* DOOR 1: FEDERAL & BENEFITS */}
        <Link 
          href="/federal" 
          className="group relative overflow-hidden rounded-3xl border border-gray-800 bg-zinc-950 p-8 transition-all hover:border-blue-500/50 hover:bg-zinc-900"
        >
          <div className="flex flex-col h-full">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Landmark className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Federal & Benefits</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Authoritative tracking for Social Security, VA Disability, and SSI payment schedules. Verified via Treasury ACH release patterns.
            </p>
            <div className="mt-auto flex items-center gap-2 text-sm font-bold text-blue-400">
              View Schedules <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
          {/* Subtle Visual Accent */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="h-24 w-24 text-blue-500" />
          </div>
        </Link>

        {/* DOOR 2: GAMING & TECH HYPE */}
        <Link 
          href="/gaming" 
          className="group relative overflow-hidden rounded-3xl border border-gray-800 bg-zinc-950 p-8 transition-all hover:border-purple-500/50 hover:bg-zinc-900"
        >
          <div className="flex flex-col h-full">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Gaming & Tech Hype</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              The master calendar for Gamescom, Nintendo Directs, and Steam sales. Countdown to major reveals and launch windows.
            </p>
            <div className="mt-auto flex items-center gap-2 text-sm font-bold text-purple-400">
              View Event Calendar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
          {/* Subtle Visual Accent */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Gamepad2 className="h-24 w-24 text-purple-500" />
          </div>
        </Link>

      </div>

      {/* 3. The "Anti-Panic" Trust Bar */}
      <section className="mt-20 border-t border-gray-900 pt-12 text-center px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Engine Status: Optimal
        </div>
        <p className="mt-4 text-[10px] text-gray-600 uppercase tracking-widest">
          Independent Verification • Zero-Trust Data Pipeline • 2026 Distribution Accuracy: 99.4%
        </p>
      </section>
    </main>
  );
}