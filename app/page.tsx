import { STATE_REGISTRY } from "@/lib/states-data";
import SearchBar from "../components/SearchBar"; 
import { ShieldCheck, Info, Globe, Scale, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "WhenIsDue | 2026 Food Benefits & EBT Payment Dates",
  description: "Find out exactly when your food benefits or EBT will be deposited in 2026. We track official schedules for all 50 states.",
};

export default function HomePage() {
  const states = Object.values(STATE_REGISTRY).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      
      {/* 1. THE HERO SECTION: Lean, Legible, and Above-the-Fold */}
      <section className="bg-white pt-20 pb-16 px-6 border-b-4 border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* SIMPLIFIED HEADLINE: Natural speech for instant clarity */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-8">
            Find out when your <br />
            <span className="text-blue-600 font-extrabold">food benefits arrive.</span>
          </h1>

          {/* TIGHTENED CONTEXT BLOCK: 39 words (AdSense Strength + UX Speed) */}
          <div className="max-w-xl mx-auto mb-10">
            <p className="text-base md:text-lg text-slate-600 font-bold leading-relaxed">
              WhenIsDue is an independent tool for tracking official 2026 food benefit dates. 
              We collect the latest payment schedules from state agencies to help you plan 
              your monthly grocery budget. Simply enter your state below to see your arrival date.
            </p>
          </div>

          {/* THE SEARCH ANCHOR: Now with high-contrast labels */}
          <div className="max-w-xl mx-auto mb-10 text-left">
             <label htmlFor="state-search" className="block text-sm font-black uppercase tracking-widest text-blue-600 mb-3 ml-2">
               Enter your state:
             </label>
             <SearchBar states={states} />
          </div>

          {/* THE CONFIDENCE ROW: Trust signals using readable text sizes */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
            <div className="flex items-center gap-2 text-slate-900">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-black uppercase tracking-tight">Takes 5 Seconds</span>
            </div>
            <div className="flex items-center gap-2 text-slate-900">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-black uppercase tracking-tight">Verified Dates</span>
            </div>
          </div>

          {/* THE DISCLAIMER: Minimum text-xs for legibility */}
          <div className="inline-flex items-center gap-3 py-3 px-6 bg-amber-50 rounded-xl border-2 border-amber-200 text-amber-900 shadow-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <p className="text-xs font-black uppercase tracking-widest leading-none">
              <span className="underline decoration-amber-200 decoration-2">Private Tool</span> • Not a government agency
            </p>
          </div>
        </div>
      </section>

      {/* 2. THE CONTENT BLOCK */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white p-10 md:p-14 rounded-[3rem] border-4 border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center gap-3 text-blue-600">
            <ShieldCheck className="w-8 h-8" />
            <h2 className="text-xl font-black uppercase tracking-tighter">Independent Data Monitoring</h2>
          </div>
          <p className="text-slate-700 font-bold text-lg md:text-xl leading-relaxed">
            We monitor state administrative manuals daily to ensure our 2026 schedules are 
            accurate. By centralizing this data, we make it easier for families to access 
            <b>official payment dates</b> without navigating complex agency websites. 
          </p>
        </div>
      </div>

      {/* 3. ACCESSIBLE FOOTER */}
      <footer className="bg-white border-t-4 border-slate-200 py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-blue-600">
              <ShieldCheck className="w-6 h-6" />
              <span className="font-black text-slate-900 text-xl tracking-tighter">WhenIsDue.</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Independent 2026 Benefit <br />Monitoring Resource.
            </p>
          </div>

          <div className="space-y-6 text-center md:text-left">
            <h4 className="text-xs font-black uppercase text-slate-900 tracking-widest">Compliance</h4>
            <nav className="flex flex-col gap-4">
              <Link href="/privacy" className="text-sm font-bold text-slate-500 hover:text-blue-600 underline underline-offset-4">Privacy Policy</Link>
              <Link href="/terms" className="text-sm font-bold text-slate-500 hover:text-blue-600 underline underline-offset-4">Terms of Use</Link>
            </nav>
          </div>

          <div className="space-y-6 text-center md:text-left">
            <h4 className="text-xs font-black uppercase text-slate-900 tracking-widest">About</h4>
            <nav className="flex flex-col gap-4">
              <Link href="/about" className="text-sm font-bold text-slate-500 hover:text-blue-600 underline underline-offset-4">Who built this?</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}