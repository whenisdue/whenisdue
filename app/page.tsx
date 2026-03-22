import { STATE_REGISTRY } from "@/src/lib/states-data";
// Change this line to point to the actual file: SearchBar.tsx
import StateSearch from "../components/SearchBar"; 
import { ShieldCheck, Info, Globe, Scale, AlertCircle } from "lucide-react";
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
      
      {/* 1. THE HERO: CALM & INFORMATIVE */}
      <section className="bg-white pt-24 pb-12 px-6 border-b border-slate-200">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Find out when your <br />
            <span className="text-blue-600">food or cash benefits</span> arrive.
          </h1>
          
          {/* 2. THE JARGON-FREE EXPLANATION (~60 Words for AdSense + Humans) */}
          <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100">
            <p className="text-slate-600 font-bold text-lg leading-relaxed">
              WhenIsDue is an independent tool designed to help you track your 2026 SNAP, EBT, 
              and other benefit payment dates. We know how important it is to plan your household 
              budget, so we have gathered the official issuance schedules for all 50 states 
              into one easy-to-use place. Select your state below to see exactly when your 
              next deposit is expected to arrive.
            </p>
          </div>

          {/* 3. THE "SAFE HARBOR" DISCLAIMER: High Visibility for Trust */}
          <div className="flex items-center justify-center gap-3 py-3 px-6 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-black uppercase tracking-widest">
              This site is private and NOT affiliated with any government agency.
            </p>
          </div>
        </div>
      </section>

      {/* 4. THE COMMAND CENTER: Single Action Search */}
      <div className="relative -mt-10 mb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <StateSearch states={states} />
        </div>
      </div>

      {/* 5. ACCESSIBLE FOOTER */}
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
              <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Legal & Privacy</h4>
              <nav className="flex flex-col gap-3">
                <Link href="/privacy" className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 underline">
                   <Globe className="w-4 h-4" /> Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 underline">
                   <Scale className="w-4 h-4" /> Terms of Use
                </Link>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">About</h4>
              <nav className="flex flex-col gap-3">
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