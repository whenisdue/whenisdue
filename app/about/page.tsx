import Link from "next/link";
import { Zap, ShieldCheck, Cpu, History, Globe, Activity, Users, Scale } from "lucide-react";

export const metadata = {
  title: "Methodology & Team | WhenIsDue 2026",
  description: "Meet the engineers behind the bitemporal audit engine and our mission for issuance transparency.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* HERO */}
      <header className="bg-slate-900 text-white py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6 text-blue-400">
            <Cpu className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-widest">System Architecture</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-none">
            Built for <span className="text-slate-500">Precision.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
            WhenIsDue is an independent notification orchestrator designed to track, 
            verify, and audit state benefit issuance schedules with millisecond accuracy.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-24 px-6 space-y-24">
        {/* NEW SECTION: THE TEAM (Satisifies E-E-A-T) */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">The Operators</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-sm font-black text-slate-900 mb-2">Technical Lead</p>
              <p className="text-slate-600 leading-relaxed text-sm">
                Led by a small team of data engineers specializing in deterministic 
                scheduling systems and cloud infrastructure. We built WhenIsDue to 
                solve the "stale data" problem inherent in public benefit tracking.
              </p>
            </div>
            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-sm font-black text-slate-900 mb-2">Our Mission</p>
              <p className="text-slate-600 leading-relaxed text-sm">
                We believe that public information should be accessible, interactive, 
                and verified. Our team maintains 50+ regional pipelines to keep 
                recipients informed.
              </p>
            </div>
          </div>
        </section>

        {/* PILLAR 1: Bitemporal Auditing */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600">
              <History className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bitemporal Auditing</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              Standard websites only track the "current" state of a date. Our engine 
              tracks both <strong>when an event was recorded</strong> and <strong>when it actually occurs</strong>.
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

        <footer className="pt-10 flex flex-col items-center gap-6">
           <Link href="/" className="text-sm font-black text-blue-600 hover:text-blue-700">
             ← Return to System Home
           </Link>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
             © 2026 Notification Orchestrator • Regional Infrastructure Division
           </p>
        </footer>
      </main>
    </div>
  );
}