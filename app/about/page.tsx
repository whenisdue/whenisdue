import { ShieldCheck, Info, Search, Mail, Landmark, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About WhenIsDue | Independent 2026 Benefit Data Research",
  description: "Information on how we collect, verify, and display 2026 food assistance and EBT payment schedules.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 leading-relaxed">
      
      {/* 1. PLAIN LANGUAGE HEADER */}
      <section className="bg-white pt-24 pb-16 px-6 border-b border-slate-200">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            About WhenIsDue
          </h1>
          <p className="text-xl text-slate-600 font-bold">
            WhenIsDue is an independent research tool designed to help households 
            find and understand official 2026 food benefit payment schedules.
          </p>
        </div>
      </section>

      {/* 2. FACTUAL METHODOLOGY */}
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-16">
        
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">How we collect and update data</h2>
          <p className="text-slate-600 font-medium">
            The dates displayed on this site are gathered through manual research of 
            publicly available government resources. Our process involves:
          </p>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <div className="mt-1 bg-blue-100 p-1 rounded-md h-fit">
                <Search className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-black text-slate-900">Official Source Review</p>
                <p className="text-slate-500 text-sm font-medium">We monitor state administrative manuals, agency news releases, and official social media channels for 2026 issuance updates.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="mt-1 bg-blue-100 p-1 rounded-md h-fit">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-black text-slate-900">Calendar Normalization</p>
                <p className="text-slate-500 text-sm font-medium">We adjust raw issuance logic (based on case numbers or surnames) to account for 2026 weekend shifts and federal holiday bank closures.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* 3. STRICT GOVERNMENT DISCLAIMER */}
        <div className="p-8 rounded-3xl bg-amber-50 border-2 border-amber-200 space-y-4">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-black uppercase text-xs tracking-widest">Mandatory Disclosure</h3>
          </div>
          <p className="text-slate-800 font-bold text-sm leading-relaxed">
            WhenIsDue is a private, independent resource. We are NOT a government agency, 
            nor are we affiliated with the USDA or any state department of human services. 
            Official applications and case-specific information must be handled through 
            your state's verified portal.
          </p>
        </div>

        {/* 4. ACCURACY & CORRECTIONS */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Accuracy and Reporting</h2>
          <p className="text-slate-600 font-medium leading-relaxed">
            While we strive for 100% accuracy, state agencies may change issuance 
            schedules without prior notice. We encourage all users to cross-reference 
            our data with the official state links provided on each state page.
          </p>
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Contact Information</p>
            <p className="text-slate-600 font-bold mb-4">
              If you notice a discrepancy or have a question about our data collection, 
              please reach out:
            </p>
            <a 
              href="mailto:admin@whenisdue.com" 
              className="text-blue-600 font-black text-lg hover:underline underline-offset-4 decoration-2"
            >
              contact@whenisdue.com
            </a>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6 text-center">
        <Link href="/" className="text-sm font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
          ← Return to Home
        </Link>
      </footer>
    </div>
  );
}