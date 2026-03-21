import { ShieldCheck, Cpu, Globe, Scale, Mail, Zap } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About the Engine | WhenIsDue Methodology",
  description: "Learn about the deterministic logic and audit-grade orchestration behind the WhenIsDue 2026 benefit tracking system.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full border border-blue-100">
            <Cpu className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">System Architecture</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
            The 2026 <span className="text-blue-600">Orchestrator.</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
            WhenIsDue is an independent, high-precision monitoring platform designed to provide clarity in the complex landscape of US benefit issuance.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-20 px-6 space-y-24">
        
        {/* MISSION SECTION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              For millions of Americans, knowing the exact date of a SNAP, TANF, or WIC deposit isn't just a convenience—it's a critical component of household management. 
            </p>
            <p className="text-slate-600 leading-relaxed font-medium">
              Our mission is to eliminate "issuance anxiety" by providing a single, centralized dashboard that tracks 2026 distribution windows with continuously verified accuracy.
            </p>
          </div>
          <div className="bg-blue-600 rounded-[3rem] p-12 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
            <Zap className="w-12 h-12 mb-6 opacity-50" />
            <p className="text-2xl font-black leading-tight">
              "Turning administrative complexity into actionable schedules."
            </p>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          </div>
        </section>

        {/* METHODOLOGY SECTION */}
        <section className="space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">The Methodology</h2>
            <p className="text-slate-500 font-medium mt-2">How we maintain high-confidence data integrity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 mb-2 text-sm uppercase tracking-tight">Agency Sync</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                We monitor 50+ state administrative manuals (DHR, HHSC, DCF) daily to identify changes in issuance policy.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 mb-2 text-sm uppercase tracking-tight">Bitemporal Logic</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Our engine automatically calculates weekend and holiday offsets to predict the actual "available" date, not just the "theoretical" date.
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="bg-slate-50 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 mb-2 text-sm uppercase tracking-tight">Audit-Grade</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Every calculation passes through a deterministic audit engine to ensure consistency across case digits and issuance logic.
              </p>
            </div>
          </div>
        </section>

        {/* TRANSPARENCY & CONTACT */}
        <section className="bg-slate-900 rounded-[3rem] p-12 text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-black text-white tracking-tight">Transparency & Contact</h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              WhenIsDue is an independent platform. We are not a government agency and we do not issue benefits. We provide data orchestration to improve accessibility to public schedules.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="mailto:admin@whenisdue.com" className="flex items-center gap-3 bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-white/20 transition-all border border-white/10">
              <Mail className="w-4 h-4" />
              admin@whenisdue.com
            </a>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* COMPLIANCE FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">
            Precision Compliance Infrastructure • 2026
          </p>
          {/* ⚠️ AUDIT FIX: Last Updated Timestamp */}
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
            Last Updated: March 2026
          </p>
        </div>
      </footer>
    </div>
  );
}