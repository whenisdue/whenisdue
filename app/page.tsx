import { STATE_REGISTRY } from "@/src/lib/states-data";
import SearchBar from "../components/SearchBar"; 
import { ShieldCheck, Info, Globe, Scale, AlertCircle, Clock, UserCheck } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const states = Object.values(STATE_REGISTRY).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* 1. THE HERO SECTION: Focused & High-Contrast */}
      <section className="bg-white pt-24 pb-20 px-6 border-b-4 border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto text-center">
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-12">
            Find out when your <br />
            <span className="text-blue-600">benefits arrive.</span>
          </h1>

          {/* THE SEARCH ANCHOR: The undisputed King of the page */}
          <div className="max-w-xl mx-auto mb-10">
             <SearchBar states={states} />
          </div>

          {/* THE CONFIDENCE ROW: Simplified for Arturo (No more Emerald boxes) */}
          <div className="flex flex-wrap items-center justify-center gap-10 mb-12">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-black uppercase tracking-tight">Takes 5 Seconds</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-black uppercase tracking-tight">No Signup Needed</span>
            </div>
          </div>

          {/* THE DISCLAIMER: Amber for "Caution/Important," not for "Decoration" */}
          <div className="inline-flex items-center gap-3 py-3 px-6 bg-amber-50 rounded-xl border-2 border-amber-200 text-amber-900">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">
              Private Tool • Not affiliated with any government agency
            </p>
          </div>
        </div>
      </section>

      {/* 2. THE CONTENT BLOCK: High-Contrast Reading */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border-4 border-slate-200 shadow-xl space-y-8">
          <div className="flex items-center gap-3 text-blue-600">
            <ShieldCheck className="w-8 h-8" />
            <h2 className="text-xl font-black uppercase tracking-tighter">Independent Data Tracking</h2>
          </div>
          <p className="text-slate-700 font-bold text-xl md:text-2xl leading-relaxed">
            WhenIsDue is a dedicated resource for tracking <b>official 2026 payment dates</b> for SNAP and EBT. We help households plan monthly budgets with confidence and accuracy. 
          </p>
        </div>
      </div>

      {/* 3. FOOTER */}
      <footer className="bg-white border-t-4 border-slate-200 py-20 px-6">
        {/* ... existing footer code ... */}
      </footer>
    </div>
  );
}