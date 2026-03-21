import Link from "next/link";
import { Zap, ShieldCheck, Cpu, History, Globe, Activity } from "lucide-react";

export const metadata = {
  title: "Methodology | 2026 Notification Infrastructure",
  description: "How our bitemporal audit engine and manual recovery protocols ensure issuance date accuracy.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* HERO: The Mission */}
      <header className="bg-slate-900 text-white py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6 text-blue-400">
            <Cpu className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-400">System Architecture</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-none">
            Built for <span className="text-slate-500">Precision.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
            WhenIsDue is an independent notification orchestrator designed to track, 
            verify, and audit state benefit issuance schedules with millisecond accuracy.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
      </header>

      {/* CORE PILLARS */}
      <main className="max-w-4xl mx-auto py-24 px-6 space-y-24">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600">
              <History className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bitemporal Auditing</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              Standard websites only track the "current" state of a date. Our 2026 engine 
              tracks both <strong>when an event was recorded</strong> and <strong>when it actually occurs</strong>. 
              This allows us to spot changes the moment they happen.
            </p>
          </div>
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
            <Activity className="w-10 h-10 text-blue-600 animate-pulse mb-4" />
            <div className="space-y-3">
              <div className="h-2 w-full bg-slate-200 rounded-full" />
              <div className="h-2 w-2/3 bg-slate-200 rounded-full" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/20">
             <Zap className="w-10 h-10 text-yellow-400 mb-6" />
             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Manual Recovery Active</p>
          </div>
          <div className="order-1 md:order-2 space-y-6">
            <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center text-green-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Recovery Protocols</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              When state data becomes inconsistent, our <strong>Operational Recovery Engine</strong> flags 
              it for human review. This hybrid approach ensures you are never left with stale information.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}