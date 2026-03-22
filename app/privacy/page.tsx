import { ShieldCheck, Lock, Eye, Globe, Mail, Info } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | WhenIsDue 2026",
  description: "Our commitment to data privacy and transparency for 2026 benefit tracking.",
};

export default function PrivacyPage() {
  const sections = [
    {
      title: "Overview",
      icon: <Info className="w-5 h-5" />,
      content: "WhenIsDue is an independent informational website that helps users view publicly available 2026 benefit payment schedules. We do not require account registration and do not collect personally identifiable information (PII) for normal use of this site."
    },
    {
      title: "Data Collection",
      icon: <Lock className="w-5 h-5" />,
      content: "We do not collect names, emails, Social Security numbers, or personal benefit details. If you contact us directly (e.g., via email to admin@whenisdue.com), we may receive the information you provide voluntarily."
    },
    {
      title: "Cookies and Analytics",
      icon: <Eye className="w-5 h-5" />,
      content: "This website uses Google Analytics 4 (GA4) to understand how visitors use the site. GA4 may collect anonymized data such as pages visited, device type, and general location (e.g., country or state). This information is used only to improve usability and performance."
    },
    {
      title: "Third-Party Links",
      icon: <Globe className="w-5 h-5" />,
      content: "This site contains links to external government and public resources. We are not responsible for the content, accuracy, or privacy practices of these third-party websites."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <section className="bg-white pt-24 pb-16 px-6 border-b border-slate-200 text-center">
        <h1 className="text-4xl font-black tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Last Updated: March 2026</p>
      </section>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {sections.map((section) => (
          <div key={section.title} className="space-y-4">
            <div className="flex items-center gap-3 text-blue-600">
              {section.icon}
              <h2 className="text-xl font-black tracking-tight text-slate-900">{section.title}</h2>
            </div>
            <p className="text-slate-600 font-medium leading-relaxed">{section.content}</p>
          </div>
        ))}

        <div className="pt-8 border-t border-slate-200 text-center">
          <p className="text-sm font-bold text-slate-500 mb-4 italic">Questions or concerns?</p>
          <a href="mailto:admin@whenisdue.com" className="text-blue-600 font-black hover:underline">admin@whenisdue.com</a>
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