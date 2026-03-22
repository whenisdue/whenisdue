import { STATE_REGISTRY } from "@/src/lib/states-data";
import SearchBar from "../components/SearchBar"; 
import { ShieldCheck, Info, Globe, Scale, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "WhenIsDue | Find Your 2026 SNAP & EBT Payment Dates",
  description: "Check exactly when your food stamps or cash benefits will be deposited. Verified 2026 schedules for all 50 states.",
};

export default function HomePage() {
  const states = Object.values(STATE_REGISTRY).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    /* bg-slate-100 adds depth to make the white cards stand out */
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* 1. THE HERO SECTION: Focused, High-Contrast & Specific */}
      <section className="bg-white pt-24 pb-20 px-6 border-b-4 border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* Headline with high specificity to remove confusion */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-12">
            Find out when your <br />
            <span className="text-blue-600">SNAP & EBT arrive.</span>
          </h1>

          {/* THE SEARCH ANCHOR: Large tap target, high contrast */}
          <div className="max-w-xl mx-auto mb-10">
             <SearchBar states={states} />
             <p className="mt-6 text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
               Search all 50 states
             </p>
          </div>

          {/* THE CONFIDENCE ROW: No squinting allowed */}
          <div className="flex flex-wrap items-center justify-center gap-10 mb-12">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-black uppercase tracking-tight text-slate-900">Takes 5 Seconds</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-black uppercase tracking-tight text-slate-900">Official 2026 Dates</span>
            </div>
          </div>

          {/* THE DISCLAIMER: Amber for attention, not decoration */}
          <div className="inline-flex items-center gap-3 py-3 px-6 bg-amber-50 rounded-xl border-2 border-amber-200 text-amber-900 shadow-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">
              <span className="underline decoration-amber-200 decoration-2">Private Tool</span> • Not affiliated with any government agency
            </p>
          </div>
        </div>
      </section>

      {/* 2. THE CONTENT BLOCK: High-Contrast 'Information Gain' */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border-4 border-slate-200 shadow-xl space-y-8">
          <div className="flex items-center gap-3 text-blue-600">
            <ShieldCheck className="w-8 h-8" />
            <h2 className="text-xl font-black uppercase tracking-tighter">Independent Data Tracking</h2>
          </div>
          <p className="text-slate-700 font-bold text-xl md:text-2xl leading-relaxed">
            WhenIsDue is a dedicated resource for tracking <b>official 2026 payment dates</b> for SNAP and EBT. By centralizing issuance calendars for all 50 states, we help households plan monthly budgets with confidence and accuracy. 
          </p>
        </div>
      </div>

      {/* 3. ACCESSIBLE FOOTER */}
      <footer className="bg-white border-t-4 border-slate-200 py-20 px-6">
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
            <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-[0.3em]">About</h4>
            <nav className="flex flex-col gap-4">
              <Link href="/about" className="text-sm font-bold text-slate-500 hover:text-blue-600 underline decoration-slate-200 decoration-2 underline-offset-4">Who built this tool?</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}