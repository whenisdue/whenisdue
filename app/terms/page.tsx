import { AlertTriangle, Scale, Info, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Terms of Use | WhenIsDue 2026",
  description: "Official terms and conditions for using the WhenIsDue 2026 benefit monitoring resource.",
};

export default function TermsPage() {
  const terms = [
    {
      title: "Informational Use Only",
      content: "WhenIsDue provides publicly available 2026 benefit payment schedules for informational purposes only. We do not process applications or manage individual benefit accounts."
    },
    {
      title: "No Guarantee of Timing",
      content: "Payment dates are based on official state guidance but may change without notice due to administrative delays, holidays, or system updates. We do not guarantee exact deposit timing."
    },
    {
      title: "Not Affiliated with Government",
      content: "WhenIsDue is a private, independent resource and is not affiliated with the USDA or any state agency. Always verify details with your official state portal."
    },
    {
      title: "No Financial or Legal Advice",
      content: "Information on this site does not constitute financial, legal, or official case guidance. Users should verify details with their state caseworker."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <section className="bg-white pt-24 pb-16 px-6 border-b border-slate-200 text-center">
        <h1 className="text-4xl font-black tracking-tight mb-4 text-slate-900">Terms of Use</h1>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Last Updated: March 2026</p>
      </section>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {terms.map((term) => (
          <div key={term.title} className="space-y-3">
            <h2 className="text-xl font-black tracking-tight text-slate-900">{term.title}</h2>
            <p className="text-slate-600 font-medium leading-relaxed">{term.content}</p>
          </div>
        ))}

        <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-4">
          <div className="flex items-center gap-2 text-blue-400">
            <Scale className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Liability Notice</span>
          </div>
          <p className="text-slate-300 font-medium text-sm leading-relaxed">
            WhenIsDue is not liable for decisions made based on the information provided on this site. 
            By using this website, you agree that you are solely responsible for cross-referencing 
            our schedules with official government sources.
          </p>
        </div>

        <div className="pt-12 text-center">
           <a href="mailto:admin@whenisdue.com" className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:text-blue-600 transition-colors">
            Contact Admin
           </a>
        </div>
      </main>

      <footer className="py-12 px-6 text-center">
        <Link href="/" className="text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
          ← Back to Home
        </Link>
      </footer>
    </div>
  );
}