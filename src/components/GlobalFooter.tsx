import Link from "next/link";
import { ShieldCheck, Globe, Mail, Scale, Info } from "lucide-react";

export default function GlobalFooter() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* COLUMN 1: BRAND & MISSION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-slate-900 p-1.5 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-black text-slate-900 tracking-tight uppercase">WhenIsDue</span>
            </div>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              An independent, audit-grade notification orchestrator providing 2026 benefit issuance monitoring across 50 US states.
            </p>
          </div>

          {/* COLUMN 2: COMPLIANCE (THE MONEY LINKS) */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compliance</h4>
            <nav className="flex flex-col gap-3">
              <Link href="/privacy" className="text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 transition-colors">
                <ShieldCheck className="w-3.5 h-3.5" /> Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 transition-colors">
                <Scale className="w-3.5 h-3.5" /> Terms of Service
              </Link>
              <Link href="/about" className="text-sm font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 transition-colors">
                <Info className="w-3.5 h-3.5" /> Methodology
              </Link>
            </nav>
          </div>

          {/* COLUMN 3: SYSTEM STATUS */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">System</h4>
            <div className="flex flex-col gap-3 text-sm font-bold text-slate-600">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>50 States Monitored</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>admin@whenisdue.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ANCHOR */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © 2026 Notification Infrastructure • Regional Operations
          </p>
          <p className="text-[9px] font-mono text-slate-300">
            REF: LEDGER_SYNCHRONIZED_UTC
          </p>
        </div>
      </div>
    </footer>
  );
}