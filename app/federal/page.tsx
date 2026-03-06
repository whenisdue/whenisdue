import Link from "next/link";
import { Landmark, Calendar, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Federal Benefit Schedules | WhenIsDue",
  description: "Independent tracking for SSA, SSI, and VA Disability payment schedules. Find out exactly when your deposit is expected to arrive.",
};

export default function FederalHubPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center rounded-2xl bg-blue-100 p-4 text-blue-600 mb-6">
            <Landmark className="h-10 w-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Federal <span className="text-blue-600">Payment Schedules.</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Independent, calendar-based tracking for major U.S. federal benefits. Select your program below to view the 2026 distribution dates.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          
          <Link href="/federal/ssi-2026" className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">SSI Schedule</h2>
            <p className="text-slate-600 mb-6">Supplemental Security Income deposits, including weekend and holiday shift dates.</p>
            <div className="flex items-center text-sm font-bold text-blue-600">
              <Calendar className="w-4 h-4 mr-2" /> View 2026 Calendar
            </div>
          </Link>

          <Link href="#" className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">SSA Retirement</h2>
            <p className="text-slate-600 mb-6">Social Security payments based on your birth date (2nd, 3rd, or 4th Wednesday).</p>
            <div className="flex items-center text-sm font-bold text-blue-600">
              <Calendar className="w-4 h-4 mr-2" /> View 2026 Calendar
            </div>
          </Link>

          <Link href="#" className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">VA Disability</h2>
            <p className="text-slate-600 mb-6">Veterans Affairs compensation dates, including early direct deposit schedules.</p>
            <div className="flex items-center text-sm font-bold text-blue-600">
              <Calendar className="w-4 h-4 mr-2" /> View 2026 Calendar
            </div>
          </Link>
          
        </div>

        <div className="bg-slate-100 p-6 rounded-xl flex items-start gap-4 text-sm text-slate-600 border border-slate-200">
          <ShieldCheck className="w-6 h-6 shrink-0 text-slate-400" />
          <p>
            <strong>Disclaimer:</strong> WhenIsDue is an independent reference utility. We are not affiliated with, endorsed by, or operated by any U.S. government agency. 
            All dates are projections based on publicly available federal calendars.
          </p>
        </div>

      </div>
    </main>
  );
}