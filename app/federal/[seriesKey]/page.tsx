import { notFound } from "next/navigation";
import { ShieldCheck, Calendar, AlertTriangle, ExternalLink, Info, CheckCircle2 } from "lucide-react";
import FederalNotifyMeForm from "@/components/benefits/FederalNotifyMeForm";

// ISR: Cache this page at the edge, revalidate every 1 hour (benefit dates rarely change intraday)
export const revalidate = 3600;

// 1. Mock Data Fetcher (Replace with your actual JSON/DB fetcher)
async function getBenefitPageData(seriesKey: string) {
  const mockDb: Record<string, any> = {
    "ssi-2026": {
      programName: "SSI (Supplemental Security Income)",
      pageTitle: "SSI Payment Schedule 2026",
      nextPayment: {
        date: "Friday, February 27, 2026",
        status: "Holiday Shift",
        explanation: "Because March 1 falls on a Sunday, your payment is scheduled for the previous business day.",
        tone: "amber"
      },
      tableRows: [
        { month: "January", scheduled: "Jan 1", adjusted: "Dec 31, 2025", reason: "New Year's Shift" },
        { month: "February", scheduled: "Feb 1", adjusted: "Jan 30, 2026", reason: "Weekend Shift" },
        { month: "March", scheduled: "Mar 1", adjusted: "Feb 27, 2026", reason: "Weekend Shift" },
      ]
    }
  };
  return mockDb[seriesKey] || null;
}

export async function generateStaticParams() {
  return [{ seriesKey: "ssi-2026" }];
}

// 2. The Master Template Component
export default async function BenefitSeriesPage({ params }: { params: { seriesKey: string } }) {
  const data = await getBenefitPageData(params.seriesKey);
  if (!data) notFound();

  // JSON-LD (WebPage + Article) - No Dataset, No Event!
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["WebPage", "Article"],
    "headline": data.pageTitle,
    "publisher": { "@type": "Organization", "name": "WhenIsDue" }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* COMPONENT: Trust Strip */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 text-center flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Independent informational site — not affiliated with the U.S. government.</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        
        {/* COMPONENT: Header & One-Sentence Answer */}
        <header className="space-y-4">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{data.pageTitle}</h1>
          <p className="text-lg text-slate-600 leading-relaxed border-l-4 border-blue-500 pl-4 bg-white p-4 rounded-r-lg shadow-sm">
            {data.programName} is usually paid on the 1st of each month. If the 1st falls on a weekend or federal holiday, payment is typically sent on the previous business day.
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Last Updated: March 6, 2026</p>
        </header>

        {/* COMPONENT: Next Payment Card (The Hero) */}
        <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Calendar className="w-32 h-32" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Next Expected Payment</h2>
          <div className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{data.nextPayment.date}</div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              data.nextPayment.tone === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {data.nextPayment.tone === 'amber' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {data.nextPayment.tone === 'emerald' && <CheckCircle2 className="w-3 h-3 mr-1" />}
              Status: {data.nextPayment.status}
            </span>
            <p className="text-sm text-slate-600">{data.nextPayment.explanation}</p>
          </div>
        </section>

        {/* AD BOUNDARY A (Safe placement after the main answer) */}
        <div className="w-full h-[90px] bg-slate-200 border border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs uppercase tracking-widest">
          Advertisement (Top Inline)
        </div>

        {/* COMPONENT: Official Schedule Table */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-900">2026 Distribution Calendar</h2>
            <p className="text-sm text-slate-500 mt-1">Based on official Treasury ACH routing rules.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Month</th>
                  <th className="px-6 py-4 font-semibold">Scheduled</th>
                  <th className="px-6 py-4 font-semibold text-blue-700">Adjusted Date</th>
                  <th className="px-6 py-4 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.tableRows.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{row.month}</td>
                    <td className="px-6 py-4 text-slate-500">{row.scheduled}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{row.adjusted}</td>
                    <td className="px-6 py-4 text-slate-500">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* COMPONENT: Panic Hub */}
        <section className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-bold">Missing Payment? Quick Answers</h2>
          </div>
          <div className="space-y-4">
            <details className="group border-b border-slate-700 pb-4">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center hover:text-blue-400 transition-colors">
                Why didn't I get my payment today?
                <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                Some banks post deposits later in the day than others. If the official calendar says today is your payment date, the delay is likely related to your bank's internal processing times.
              </p>
            </details>
            <details className="group pb-2">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center hover:text-blue-400 transition-colors">
                Why did my payment come early this month?
                <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                If your normal payment date falls on a weekend or federal holiday, the government issues the payment on the preceding business day. This early payment covers the upcoming month; it is not an "extra" payment.
              </p>
            </details>
          </div>
        </section>

        {/* AD BOUNDARY B */}
        <div className="w-full h-[250px] bg-slate-200 border border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs uppercase tracking-widest">
          Advertisement (Mid Rectangle)
        </div>

        {/* COMPONENT: Alert Signup */}
        <section className="bg-blue-50 border border-blue-100 rounded-2xl p-6 md:p-8 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Never miss a payment date.</h2>
          <p className="text-slate-600 mb-6 max-w-lg mx-auto">
            Get free email alerts when payment dates shift for weekends, holidays, or schedule updates.
          </p>

          <FederalNotifyMeForm topicKey={params.seriesKey} />
                    
        </section>
        {/* COMPONENT: Affiliate Disclosure & Offers */}
        <section className="border-t border-slate-200 pt-10">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Want your deposit earlier?</h2>
          <p className="text-sm text-slate-500 mb-6 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            Some financial apps advertise early direct deposit features. We may earn a commission if you open an account through links below. We are not affiliated with the SSA.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <a href="#" className="block p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all bg-white">
              <h3 className="font-bold text-slate-900">Chime</h3>
              <p className="text-sm text-slate-600 mt-1">Get your direct deposit up to 2 days early with no monthly fees.</p>
              <span className="text-emerald-600 text-sm font-bold mt-3 inline-block">Learn More →</span>
            </a>
            <a href="#" className="block p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all bg-white">
              <h3 className="font-bold text-slate-900">SoFi</h3>
              <p className="text-sm text-slate-600 mt-1">Early pay features plus high-yield savings options.</p>
              <span className="text-emerald-600 text-sm font-bold mt-3 inline-block">Learn More →</span>
            </a>
          </div>
        </section>

        {/* COMPONENT: Official Sources & Footer */}
        <footer className="border-t border-slate-200 pt-8 text-sm text-slate-500 space-y-4">
          <div>
            <strong className="text-slate-700">Official Sources:</strong>
            <ul className="mt-2 space-y-1">
              <li><a href="#" className="text-blue-600 hover:underline">Social Security Administration Calendar</a> <ExternalLink className="w-3 h-3 inline" /></li>
              <li><a href="#" className="text-blue-600 hover:underline">U.S. Treasury Processing Guidelines</a> <ExternalLink className="w-3 h-3 inline" /></li>
            </ul>
          </div>
          <p className="pt-4 border-t border-slate-100 text-xs">
            WhenIsDue is an independent informational site and is not affiliated with, endorsed by, or operated by any U.S. government agency. Always verify benefit information directly with the relevant government agency.
          </p>
        </footer>

      </div>
    </main>
  );
}