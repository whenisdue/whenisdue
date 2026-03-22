import { ShieldCheck, Cpu, Globe, Scale, Mail, Zap, ExternalLink, Database, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About WhenIsDue | 2026 Methodology",
  description: "Learn about the deterministic logic and official data sources behind the WhenIsDue 2026 benefit tracking system.",
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
          <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
            WhenIsDue is an independent digital utility operated by the <b>WhenIsDue Editorial Team</b>. We provide high-precision monitoring and scheduling for US benefit issuance.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-20 px-6 space-y-20">
        
        {/* MISSION SECTION */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              For millions of households, knowing the exact date of a SNAP or EBT deposit is a critical component of liquidity management. 
            </p>
            <p className="text-slate-600 leading-relaxed font-medium">
              Our mission is to eliminate "issuance anxiety" by providing a single, centralized dashboard that tracks 2026 distribution windows with audit-grade accuracy.
            </p>
          </div>
          <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
            <ShieldCheck className="w-10 h-10 mb-6 opacity-50" />
            <p className="text-xl font-black leading-tight">
              "Turning administrative complexity into actionable schedules."
            </p>
          </div>
        </section>

        {/* METHODOLOGY & DATA TRACEABILITY */}
        <section className="space-y-10">
          <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-3 text-blue-600">
              <Database className="w-6 h-6" />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verification & Sourcing</h2>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed">
              Our 2026 Engine normalizes data from disparate official sources. We prioritize traceability by verifying our internal schedules against primary government authorities:
            </p>
            <div className="flex flex-wrap gap-6">
              <a href="https://www.fns.usda.gov/" target="_blank" className="flex items-center gap-2 text-sm font-black text-blue-600 hover:underline">
                USDA FNS Portal <ExternalLink className="w-4 h-4" />
              </a>
              <a href="https://www.usa.gov/food-help" target="_blank" className="flex items-center gap-2 text-sm font-black text-blue-600 hover:underline">
                USA.gov Benefits <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* DISCLAIMER BOX */}
        <section className="bg-amber-50 p-10 rounded-[3rem] border border-amber-100 space-y-4">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="font-black uppercase text-xs tracking-widest">Official Status Disclaimer</h2>
          </div>
          <p className="text-sm text-amber-900 leading-relaxed font-medium">
            WhenIsDue is a private, independent informational utility. <b>We are NOT affiliated with, authorized by, or endorsed by any government agency.</b> This platform is a data orchestration tool; always verify your specific case details through your official state human services portal or caseworker.
          </p>
        </section>

        {/* CONTACT SECTION */}
        <section className="bg-slate-900 rounded-[3.5rem] p-12 text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-black text-white tracking-tight">Accountability & Contact</h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              For data corrections, source inquiries, or compliance concerns, please contact our administrative team directly.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="mailto:admin@whenisdue.com" className="flex items-center gap-3 bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-white/20 transition-all border border-white/10">
              <Mail className="w-4 h-4" /> admin@whenisdue.com
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6 text-center">
        <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">
          Precision Compliance Infrastructure • 2026
        </p>
        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
          Last Verified: March 22, 2026
        </p>
      </footer>
    </div>
  );
}