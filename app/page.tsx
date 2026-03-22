import { STATE_REGISTRY } from "@/src/lib/states-data";
import StateSearch from "../components/SearchBar"; 
import { ShieldCheck, Info, Globe, Scale, AlertCircle, Search } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "WhenIsDue | Find Your 2026 SNAP & EBT Payment Dates",
  description: "Check exactly when your food or cash benefits will be deposited. We provide verified 2026 payment schedules for all 50 states.",
};

export default function HomePage() {
  const states = Object.values(STATE_REGISTRY).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. THE HERO: ACTION AT THE TOP */}
      <section className="bg-white pt-20 pb-12 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Find your <span className="text-blue-600">benefit date.</span>
          </h1>

          {/* THE PRIMARY ACTION: Moved Above the Fold */}
          <div className="pt-4 max-w-2xl mx-auto">
             <StateSearch states={states} />
             <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
               Start typing your state (e.g., California)
             </p>
          </div>

          {/* THE TRUST ANCHOR: High Visibility, Low Friction */}
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 max-w-fit mx-auto">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Private Site • Not a Government Agency
            </span>
          </div>
        </div>
      </section>

      {/* 2. THE SEO BLOCK: Moved Below the Action */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">About WhenIsDue</h2>
          <p className="text-slate-600 font-medium text-base leading-relaxed">
            WhenIsDue is an independent tool designed to help you track your 2026 SNAP, EBT, 
            and other benefit payment dates. We know how important it is to plan your household 
            budget, so we have gathered the official issuance schedules for all 50 states 
            into one easy-to-use place. 
          </p>
        </div>
      </section>

      {/* 3. ACCESSIBLE FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="font-black text-slate-900 tracking-tighter text-lg underline decoration-blue-100 decoration-4">WhenIsDue.</span>
              </div>
              <p className="text-sm text-slate-400 font-bold leading-relaxed">
                Independent monitoring of 2026 benefit timing. Updated daily.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest text-center md:text-left">Legal & Privacy</h4>
              <nav className="flex flex-col gap-3 items-center md:items-start">
                <Link href="/privacy" className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 underline">
                   <Globe className="w-4 h-4" /> Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 underline">
                   <Scale className="w-4 h-4" /> Terms of Use
                </Link>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest text-center md:text-left">About</h4>
              <nav className="flex flex-col gap-3 items-center md:items-start">
                <Link href="/about" className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 underline">
                   <Info className="w-4 h-4" /> Who built this tool?
                </Link>
              </nav>
            </div>
          </div>
          
          <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] text-center pt-12 border-t border-slate-100">
            Official 2026 Data Tracking • Verified Daily
          </p>
        </div>
      </footer>
    </div>
  );
}