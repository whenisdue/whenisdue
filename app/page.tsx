import Link from "next/link";
import { STATE_REGISTRY } from "@/src/lib/states-data";
import { ChevronRight, MapPin, ShieldCheck, Zap, Globe, Scale, Info } from "lucide-react";

export const metadata = {
  title: "SNAP & EBT Payment Schedules by State (2026)",
  description: "Find your SNAP, EBT, and benefit payment dates by state. Track deposits and never miss a payment with our automated 2026 schedule.",
};

export default function HomePage() {
  // Sorting Alphabetically for better User Experience
  const states = Object.values(STATE_REGISTRY).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HERO SECTION */}
      <section className="bg-white border-b border-slate-200 pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full border border-blue-100">
            <Zap className="w-3 h-3 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">2026 Engine Live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[0.9]">
            Never miss a <br />
            <span className="text-blue-600">benefit deposit.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-500 font-medium text-lg leading-relaxed">
            Automated, audit-grade benefit issuance tracking across 50 US states. 
            Select your state below to view your verified 2026 schedule.
          </p>
        </div>
      </section>

      {/* STATE SELECTION GRID */}
      <main className="max-w-6xl mx-auto py-20 px-6">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active State Directories</h2>
          <div className="h-px flex-grow mx-8 bg-slate-200 hidden md:block" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-nowrap">v2.0 Orchestrator</span>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {states.map((state) => (
            <li key={state.code}>
              <Link 
                href={`/states/${state.slug}`}
                className="group block h-full bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 relative overflow-hidden"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className="bg-slate-50 group-hover:bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors mb-6">
                    <MapPin className="w-6 h-6" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {state.name}
                  </h3>
                  
                  <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                    Official 2026 {state.name} benefit availability and distribution windows.
                  </p>

                  <div className="mt-auto flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    View Schedule <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <span className="absolute -bottom-4 -right-2 text-9xl font-black text-slate-50 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity pointer-events-none uppercase">
                  {state.code}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      {/* COMPLIANCE FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="font-black text-slate-900 tracking-tighter text-lg">WhenIsDue.</span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Independent orchestration of 2026 benefit issuance monitoring. Not affiliated with any government agency.
              </p>
            </div>

            {/* QUICK LINKS FOR SEO */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Compliance</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/privacy" className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-2">
                   <Globe className="w-3 h-3" /> Privacy Policy
                </Link>
                <Link href="/terms" className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-2">
                   <Scale className="w-3 h-3" /> Terms of Service
                </Link>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Company</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/about" className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-2">
                   <Info className="w-3 h-3" /> About the Engine
                </Link>
              </nav>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">
              Precision Compliance Infrastructure • 2026
            </p>
            <p className="text-[10px] font-bold text-slate-400 italic">
              DATA REFRESHED EVERY 6 HOURS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}