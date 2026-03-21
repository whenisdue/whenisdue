import Link from "next/link";
import { STATE_REGISTRY } from "@/src/lib/states-data"; // Path-Perfect: Verified src/lib
import { Map, ChevronRight, ShieldCheck, Globe, Zap } from "lucide-react";

// 1. SEO: This is what shows up in Google search results for the main directory
export const metadata = {
  title: "2026 State Benefit Schedules | National Directory",
  description: "Official 2026 benefit issuance schedules and payment dates for all 50 states. Audit-verified data tracking for state programs.",
};

export default function StatesDirectoryPage() {
  // Sort states alphabetically (A to Z) so it's easy for humans to read
  const sortedStates = Object.values(STATE_REGISTRY).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HERO SECTION: Makes the site look authoritative */}
      <header className="bg-slate-900 text-white pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/40">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-blue-400">National Coverage</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            State Issuance <span className="text-slate-500 underline decoration-slate-800 underline-offset-8">Directories</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
            Select your state to view verified 2026 payment schedules, program deadlines, 
            and issuance windows monitored by our audit-grade recovery engine.
          </p>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-6 -mt-10 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* SIDEBAR: AdSense Polish (Shows Google this is a high-quality tool) */}
          <aside className="md:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <Zap className="w-8 h-8 text-blue-600 mb-6" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Infrastructure</p>
              <p className="text-sm font-black text-slate-900 mb-6 leading-tight">Regional Engine Synchronized</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-3 py-2.5 rounded-xl border border-green-100">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  DATA VERIFIED
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-2.5 rounded-xl border border-blue-100">
                  <Globe className="w-3.5 h-3.5" />
                  50 STATES
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-100 rounded-3xl border border-slate-200">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                    Note: Our 2026 cycle monitoring is based on bitemporal audit trails for maximum reliability.
                </p>
            </div>
          </aside>

          {/* STATE GRID: This is the "Crawl Hub" for SEO */}
          <div className="md:col-span-3">
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
              {sortedStates.map((state) => (
                <li key={state.code}>
                  <Link
                    href={`/states/${state.slug}`}
                    className="group bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/5 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <Map className="w-6 h-6 text-slate-300 group-hover:text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                          {state.code}
                        </p>
                        <p className="text-md font-black text-slate-900">
                          {state.name}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </main>

      {/* FOOTER: Links for Bots and Users */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          © 2026 Notification Orchestrator • Regional Issuance Monitoring
        </p>
        <div className="flex gap-10">
          <Link href="/admin" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
            Operator Access
          </Link>
          <Link href="/" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}