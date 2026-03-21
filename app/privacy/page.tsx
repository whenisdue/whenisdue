import Link from "next/link";
import { ShieldCheck, Lock, Eye, MousePointer2, Database, Mail } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | 2026 Notification Infrastructure",
  description: "Official privacy disclosures regarding data collection, cookies, and third-party advertising partners.",
};

export default function PrivacyPage() {
  const lastUpdated = "March 21, 2026";

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* 1. THE HEADER: Professional and Trusted */}
      <header className="bg-slate-50 border-b border-slate-200 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-blue-600">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-500">Compliance & Transparency</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4 text-slate-900">Privacy Policy</h1>
          <p className="text-slate-500 font-medium italic">Last Updated: {lastUpdated}</p>
        </div>
      </header>

      {/* 2. THE CONTENT: Strictly Legal Disclosures */}
      <main className="max-w-3xl mx-auto py-16 px-6 space-y-12">
        
        {/* DATA COLLECTION */}
        <section className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <Eye className="w-5 h-5 text-blue-500" />
            1. Information We Collect
          </h2>
          <p className="text-slate-600 leading-relaxed">
            We collect information to provide better services to our users. This includes:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 font-medium">
            <li><strong>Log Information:</strong> IP addresses, browser types, and pages visited are automatically collected in server logs.</li>
            <li><strong>Device Information:</strong> We may collect hardware models and operating system versions.</li>
            <li><strong>User Data:</strong> We collect email addresses only if you explicitly register for notifications.</li>
          </ul>
        </section>

        {/* GOOGLE ADSENSE SECTION (CRITICAL: DO NOT EDIT THIS) */}
        <section className="space-y-4 p-8 bg-blue-50 rounded-[2rem] border border-blue-100">
          <h2 className="text-xl font-black flex items-center gap-3 text-blue-900">
            <MousePointer2 className="w-5 h-5 text-blue-600" />
            2. Advertising & Cookies
          </h2>
          <p className="text-blue-800 text-sm leading-relaxed font-bold">
            This site uses Google AdSense and other third-party advertising partners to serve ads. 
          </p>
          <ul className="list-disc pl-6 space-y-3 text-blue-800 text-sm font-medium">
            <li><strong>Third-Party Cookies:</strong> Google and other vendors use cookies to serve ads based on your prior visits to this or other websites.</li>
            <li><strong>Web Beacons:</strong> Third parties may place and read cookies on your browser, or use web beacons to collect information as a result of ad serving.</li>
            <li><strong>Opt-Out:</strong> You may opt out of personalized advertising by visiting <Link href="https://www.google.com/settings/ads" className="underline text-blue-700">Google Ads Settings</Link> or <Link href="https://www.aboutads.info" className="underline text-blue-700">www.aboutads.info</Link>.</li>
          </ul>
        </section>

        {/* DATA USAGE */}
        <section className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <Database className="w-5 h-5 text-slate-400" />
            3. How We Use Information
          </h2>
          <p className="text-slate-600 leading-relaxed">
            We use collected data to maintain and improve our services. We do not sell your personal information. Data is used strictly for the purpose of delivering benefit schedules and system monitoring.
          </p>
        </section>

        {/* USER RIGHTS */}
        <section className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <Lock className="w-5 h-5 text-slate-400" />
            4. Consent & User Rights
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Where required by law, we obtain user consent for tracking identifiers. You have the right to access, update, or request the deletion of your personal data at any time.
          </p>
        </section>

        {/* CONTACT: UPDATED TO YOUR ADMIN EMAIL */}
        <section className="space-y-4 pt-10 border-t border-slate-100">
          <h2 className="text-xl font-black flex items-center gap-3 text-slate-800">
            <Mail className="w-5 h-5 text-slate-400" />
            5. Contact Information
          </h2>
          <p className="text-slate-600 leading-relaxed">
            If you have questions about this Privacy Policy, you may contact us at: <span className="font-bold text-blue-600 underline">admin@whenisdue.com</span>
          </p>
        </section>

        <div className="pt-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700">
            ← Return to System Home
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