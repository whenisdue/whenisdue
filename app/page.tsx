import { STATE_REGISTRY } from "@/src/lib/states-data";
import SearchBar from "../components/SearchBar"; 
import { ShieldCheck, Info, Globe, Scale, AlertCircle, Clock, UserCheck } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const states = Object.values(STATE_REGISTRY).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    /* Softened background to bg-slate-100 for more 'depth' */
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* 1. THE HERO SECTION: White 'Card' feel on Slate-100 background */}
      <section className="bg-white pt-24 pb-16 px-6 border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto text-center space-y-10">
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
            Find out when your <br />
            <span className="text-blue-600">benefits arrive.</span>
          </h1>

          {/* THE SEARCH ANCHOR */}
          <div className="max-w-xl mx-auto">
             <SearchBar states={states} />
             
             {/* HUMAN REASSURANCE LINE: Adds immediate 'Warmth' */}
             <div className="mt-6 flex flex-col items-center gap-2">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
                  Search all 50 states
                </p>
                <div className="flex items-center gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Takes 5 seconds</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> No signup needed</span>
                </div>
             </div>
          </div>

          {/* THE TRUST ANCHOR */}
          <div className="inline-flex items-center gap-2 py-2.5 px-5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Private Tool • Not affiliated with any government agency
            </span>
          </div>
        </div>
      </section>

      {/* 2. THE CONTENT BLOCK: Intentional spacing with a divider */}
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="bg-white p-10 md:p-14 rounded-[3rem] border-2 border-slate-200 shadow-sm space-y-6">
          <div className="inline-flex items-center gap-2 text-blue-600">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="text-xs font-black uppercase tracking-widest">Independent Data Tracking</h2>
          </div>
          <p className="text-slate-600 font-bold text-lg md:text-xl leading-relaxed">
            WhenIsDue is a dedicated resource for tracking official 2026 payment dates for SNAP and EBT. 
            By centralizing issuance calendars for all 50 states, we help households plan 
            monthly budgets with confidence and accuracy. 
          </p>
        </div>
      </div>

      {/* 3. FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          {/* ... existing footer content ... */}
        </div>
      </footer>
    </div>
  );
}