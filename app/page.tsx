import { STATE_REGISTRY } from "@/src/lib/states-data";
import SearchBar from "../components/SearchBar"; 
import { ShieldCheck, Info, Globe, Scale, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const states = Object.values(STATE_REGISTRY).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. THE HERO: CLEAN, FOCUSED, & FAST */}
      <section className="bg-white pt-24 pb-16 px-6 border-b border-slate-200">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-4">
            Find out when your <br />
            <span className="text-blue-600">benefits arrive.</span>
          </h1>

          {/* THE PRIMARY ACTION: No distractions, just the tool */}
          <div className="max-w-xl mx-auto">
             <SearchBar states={states} />
             <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
               Type your state name (e.g., Michigan)
             </p>
          </div>

          {/* THE TRUST ANCHOR: High Contrast Disclaimer */}
          <div className="inline-flex items-center gap-2 py-2.5 px-5 bg-amber-50 rounded-xl border border-amber-100 text-amber-900">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Private Tool • Not affiliated with any government agency
            </span>
          </div>
        </div>
      </section>

      {/* 2. THE CONTENT LAYER: Information Gain for AdSense */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="bg-white p-10 md:p-14 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-blue-600">Verification & Reliability</h2>
          <p className="text-slate-600 font-bold text-lg md:text-xl leading-relaxed">
            WhenIsDue is an independent resource created to simplify 2026 SNAP and EBT scheduling. 
            By centralizing the official issuance calendars for all 50 states, we provide a reliable 
            way for families to plan their monthly budgets. Our data is cross-referenced with 
            state-level administrative manuals to ensure the highest degree of accuracy.
          </p>
        </div>
      </section>

      {/* 3. ACCESSIBLE FOOTER: Clear Navigation */}
      <footer className="bg-white border-t border-slate-200 py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-blue-600">
              <ShieldCheck className="w-6 h-6" />
              <span className="font-black text-slate-900 text-xl tracking-tighter">WhenIsDue.</span>
            </div>
            <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
              Independent 2026 Benefit <br />Monitoring Infrastructure.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.3em]">Compliance</h4>
            <nav className="flex flex-col gap-4">
              <Link href="/privacy" className="text-sm font-bold text-slate-500 hover:text-blue-600 underline decoration-slate-200 decoration-2 underline-offset-4">Privacy Policy</Link>
              <Link href="/terms" className="text-sm font-bold text-slate-500 hover:text-blue-600 underline decoration-slate-200 decoration-2 underline-offset-4">Terms of Use</Link>
            </nav>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.3em]">Resources</h4>
            <nav className="flex flex-col gap-4">
              <Link href="/about" className="text-sm font-bold text-slate-500 hover:text-blue-600 underline decoration-slate-200 decoration-2 underline-offset-4">About the Team</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}