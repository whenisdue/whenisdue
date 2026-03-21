import Link from "next/link";
import { Scale, AlertTriangle, ShieldAlert, FileText, Mail, BellOff } from "lucide-react";

export const metadata = {
  title: "Terms of Service | 2026 Notification Infrastructure",
  description: "Official terms regarding service usage, data reliability, and limitation of liability for our notification engine.",
};

export default function TermsPage() {
  const lastUpdated = "March 21, 2026";

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* 1. THE HEADER: Signals "Audit-Grade" Professionalism */}
      <header className="bg-slate-50 border-b border-slate-200 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-blue-600">
            <Scale className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-500">Legal Agreement</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4 text-slate-900 leading-none">Terms of Service</h1>
          <p className="text-slate-500 font-medium italic">Last Updated: {lastUpdated}</p>
        </div>
      </header>

      {/* 2. THE CONTENT: Your Protection Layer */}
      <main className="max-w-3xl mx-auto py-16 px-6 space-y-12">
        
        {/* ACCEPTANCE */}
        <section className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <FileText className="w-5 h-5 text-blue-500" />
            1. Acceptance of Terms
          </h2>
          <p className="text-slate-600 leading-relaxed">
            By accessing WhenIsDue.com (the "Service"), you agree to be bound by these Terms. 
            Continued use of the Service constitutes acceptance of any future updates to 
            these terms. If you do not agree, please discontinue use immediately.
          </p>
        </section>

        {/* GOVERNMENT DISCLAIMER (YMYL PROTECTION) */}
        <section className="space-y-4 p-8 bg-blue-50 rounded-[2rem] border border-blue-100">
          <h2 className="text-xl font-black flex items-center gap-3 text-blue-900">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            2. Not a Government Agency
          </h2>
          <p className="text-blue-800 text-sm leading-relaxed font-bold italic">
            WhenIsDue.com is a PRIVATE, independent platform. We are NOT affiliated with, 
            endorsed by, or operated by any government agency. All data is provided for 
            informational purposes only and should not be considered legal or financial advice.
          </p>
        </section>

        {/* ACCURACY DISCLAIMER */}
        <section className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            3. Accuracy of Data
          </h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            While we use advanced verification protocols to track issuance dates, we do not 
            guarantee 100% accuracy. Payment dates may fluctuate due to bank processing, 
            federal holidays, or agency updates. You are responsible for verifying 
            critical dates with official government sources.
          </p>
        </section>

        {/* NOTIFICATIONS CLAUSE */}
        <section className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <BellOff className="w-5 h-5 text-slate-400" />
            4. Automated Notifications
          </h2>
          <p className="text-slate-600 leading-relaxed">
            By subscribing to alerts, you agree to receive automated data notifications. 
            We are not responsible for delayed or missed notifications caused by network 
            connectivity, browser settings, or service interruptions.
          </p>
        </section>

        {/* LIABILITY (THE SHIELD) */}
        <section className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <Scale className="w-5 h-5 text-slate-400" />
            5. Limitation of Liability
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-600 uppercase leading-relaxed font-mono">
              IN NO EVENT SHALL WHENISDUE.COM OR ITS OPERATORS BE LIABLE FOR ANY FINANCIAL 
              LOSS, LATE FEES, OR DAMAGES INCURRED DUE TO RELIANCE ON OUR DATA. OUR TOTAL 
              LIABILITY IS LIMITED TO $0.00.
            </p>
          </div>
        </section>

        {/* CONTACT */}
        <section className="space-y-4 pt-10 border-t border-slate-100">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <Mail className="w-5 h-5 text-slate-400" />
            6. Contact Information
          </h2>
          <p className="text-slate-600 leading-relaxed">
            For legal inquiries, contact: <span className="font-bold text-blue-600 underline">admin@whenisdue.com</span>
          </p>
        </section>

        <div className="pt-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700">
            ← Return to Home
          </Link>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
        © 2026 Notification Orchestrator • Regional Compliance Division
      </footer>
    </div>
  );
}