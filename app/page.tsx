import Link from "next/link";
import { Landmark, Gamepad2, ArrowRight, Clock, CalendarDays } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-purple-500/30 font-sans pb-20">
      
      {/* HERO SECTION */}
      <section className="pt-20 pb-16 px-4 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-mono mb-8 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Event & Payment Tracking
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
          Know Exactly When <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            It Happens.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Accurate countdowns and official schedules for Social Security payments, VA benefits, gaming reveals, and seasonal digital sales.
        </p>

        {/* IMMEDIATE UTILITY: "Next Up" Live Examples */}
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-16 text-left">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-bold uppercase tracking-widest mb-2">
                <Landmark className="w-4 h-4" /> Federal
              </div>
              <h3 className="text-xl font-bold text-white">Next SSI Payment</h3>
              <p className="text-zinc-500 text-sm mt-1">Expected: Friday, Feb 27, 2026</p>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-black tabular-nums text-white">14</span>
              <span className="text-sm text-zinc-500 uppercase tracking-widest">Days Away</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-purple-400 text-sm font-bold uppercase tracking-widest mb-2">
                <Gamepad2 className="w-4 h-4" /> Gaming
              </div>
              <h3 className="text-xl font-bold text-white">Steam Summer Sale</h3>
              <p className="text-zinc-500 text-sm mt-1">Expected: Late June 2026</p>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-black tabular-nums text-white">112</span>
              <span className="text-sm text-zinc-500 uppercase tracking-widest">Days Away</span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY PORTALS */}
      <section className="px-4 max-w-5xl mx-auto">
        <h2 className="text-center text-sm font-bold uppercase tracking-widest text-zinc-600 mb-8">
          Select Your Tracking Hub
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Federal Hub Card */}
          <Link href="/federal" className="group relative bg-zinc-950 border border-zinc-800 rounded-3xl p-8 hover:border-blue-500/50 transition-colors overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Landmark className="w-32 h-32" />
            </div>
            <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
              <CalendarDays className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
              Federal & Benefits
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-8 max-w-sm">
              Check exact deposit dates for Social Security, VA Disability, and SSI. See how weekends and federal holidays affect your payment schedule.
            </p>
            <div className="flex items-center text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
              View Payment Schedules <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Gaming Hub Card */}
          <Link href="/gaming" className="group relative bg-zinc-950 border border-zinc-800 rounded-3xl p-8 hover:border-purple-500/50 transition-colors overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Gamepad2 className="w-32 h-32" />
            </div>
            <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">
              Gaming & Tech Events
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-8 max-w-sm">
              Live countdowns to major reveals, Gamescom, Nintendo Directs, and digital storefront sales. Get notified exactly when streams go live.
            </p>
            <div className="flex items-center text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
              View Event Calendar <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

    </main>
  );
}