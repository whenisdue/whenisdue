import Link from "next/link";
import { ShieldCheck, Lock, Eye, MousePointer2, Database, Mail, Server } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | WhenIsDue Compliance",
  description: "Official privacy disclosures regarding data collection, Google Analytics, and AdSense advertising partners.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <header className="bg-slate-50 border-b border-slate-200 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-blue-600">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Transparency Division</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-slate-500 font-medium italic">Effective Date: March 22, 2026</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-16 px-6 space-y-12">
        <section className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <Server className="w-5 h-5 text-blue-500" />
            1. Hosting & Infrastructure
          </h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            This website is hosted on **Vercel**. Vercel may collect server logs, including IP addresses and browser types, to maintain system security and operational stability.
          </p>
        </section>

        <section className="space-y-4 p-8 bg-blue-50 rounded-[2rem] border border-blue-100">
          <h2 className="text-xl font-black flex items-center gap-3 text-blue-900">
            <MousePointer2 className="w-5 h-5 text-blue-600" />
            2. Advertising & Analytics
          </h2>
          <p className="text-blue-800 text-sm leading-relaxed font-bold">
            We use Google Analytics and Google AdSense to monitor traffic and serve advertisements.
          </p>
          <ul className="list-disc pl-6 space-y-3 text-blue-800 text-sm font-medium">
            <li><strong>Cookies:</strong> Google uses cookies to serve ads based on your prior visits to this and other websites.</li>
            <li><strong>DART Cookie:</strong> Google’s use of advertising cookies enables it and its partners to serve ads based on your visit to this site.</li>
            <li><strong>Opt-Out:</strong> Users may opt out of personalized advertising by visiting the <Link href="https://www.google.com/settings/ads" className="underline">Google Ad Settings</Link>.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <Lock className="w-5 h-5 text-slate-400" />
            3. Data Retention & PII
          </h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            WhenIsDue is a privacy-first utility. We do not collect names, Social Security Numbers (SSNs), or case IDs. Any information provided via contact email is used solely for support and is never shared with third parties.
          </p>
        </section>

        <section className="space-y-4 pt-10 border-t border-slate-100">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <Mail className="w-5 h-5 text-slate-400" />
            4. Contact
          </h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            For privacy inquiries: <span className="font-bold text-blue-600">admin@whenisdue.com</span>
          </p>
        </section>
      </main>
    </div>
  );
}