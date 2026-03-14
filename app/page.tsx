import { MapPin, ArrowRight, ShieldCheck, CalendarDays, CheckCircle2, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia"
};

const PREFERRED_POPULAR = ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "MI"];

export default async function HomePage() {
  // THE FIX: We now query RuleIdentity to find active states instead of ScheduleRuleSet directly.
  const activeIdentities = await prisma.ruleIdentity.findMany({
    where: {
      versions: {
        some: { recordedTo: null, status: 'ACTIVE' }
      }
    },
    select: { stateCode: true, programCode: true }
  });

  const liveStates = activeIdentities.length > 0 ? activeIdentities : [
    { stateCode: "TX", programCode: "SNAP" },
    { stateCode: "PA", programCode: "SNAP" },
    { stateCode: "FL", programCode: "SNAP" },
    { stateCode: "CA", programCode: "SNAP" },
    { stateCode: "NY", programCode: "SNAP" },
    { stateCode: "IL", programCode: "SNAP" },
  ];

  const sortedStates = [...liveStates].sort((a,b) => 
    (STATE_NAMES[a.stateCode] || "").localeCompare(STATE_NAMES[b.stateCode] || "")
  );

  const popularStates = sortedStates
    .filter(s => PREFERRED_POPULAR.includes(s.stateCode))
    .slice(0, 6); 

  if (popularStates.length < 4) {
    popularStates.push(...sortedStates.filter(s => !popularStates.includes(s)).slice(0, 6 - popularStates.length));
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-32">
      
      {/* 1. TOP REASSURANCE STRIP */}
      <div className="w-full bg-blue-50 border-b border-blue-100 text-blue-800 text-[13px] font-bold py-2.5 px-4 text-center">
        Updated for 2026 SNAP and cash benefit schedules
      </div>

      {/* 2. HERO: QUESTION + GUIDED CHECKER */}
      <section className="max-w-6xl mx-auto px-6 pt-12 md:pt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          <div className="lg:col-span-7">
            <h1 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tight leading-[1.05] mb-5">
              When is my money due?
            </h1>
            <p className="text-xl text-slate-600 font-medium max-w-lg leading-relaxed mb-10">
              Check your 2026 benefit payment date by state and case number.
            </p>
            
            {/* GUIDED SELECTION */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5">
                1. Choose your state and program to begin:
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {popularStates.map((rule, idx) => {
                  const stateName = STATE_NAMES[rule.stateCode] || rule.stateCode;
                  return (
                    <Link 
                      key={`pop-${rule.stateCode}-${rule.programCode}-${idx}`} 
                      href={`/${rule.programCode.toLowerCase()}/${stateName.toLowerCase().replace(/\s+/g, '-')}`}
                      className="group bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-center hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-colors flex flex-col items-center justify-center gap-0.5"
                    >
                      <span className="font-bold text-slate-900 group-hover:text-white leading-tight">{stateName}</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-blue-100">{rule.programCode}</span>
                    </Link>
                  );
                })}
              </div>
              <a href="#directory" className="inline-flex items-center justify-center w-full py-3.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 hover:text-slate-900 transition-colors">
                Browse full directory below <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>

          {/* 3. EXAMPLE RESULT PREVIEW */}
          <div className="lg:col-span-5 lg:pl-6">
            <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-3 shadow-sm">
              <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-lg shadow-slate-200/50">
                <div className="flex items-center gap-2 mb-6">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                    Example Result
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    Dates vary by state and case
                  </span>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-6">Pennsylvania SNAP</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-500">Case Digit</span>
                    <span className="text-xl font-black text-slate-900">7</span>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Expected Payment Date</span>
                    <div className="text-4xl font-black text-blue-600 tracking-tight">
                      March 9, 2026
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mt-5 text-xs font-medium text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p>Dates automatically account for weekends and holiday shifts.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 border-t border-slate-200 pt-12">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 shrink-0 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-sm">1</div>
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Pick your state & benefit</h3>
              <p className="text-slate-600 text-sm font-medium">Every state uses different payment rules for different programs.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 shrink-0 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-sm">2</div>
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Match your case</h3>
              <p className="text-slate-600 text-sm font-medium">We help you find the right group, last digit, or birth date.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 shrink-0 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-sm">3</div>
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Get your date</h3>
              <p className="text-slate-600 text-sm font-medium">See your expected 2026 payment date instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BROWSE ALL STATES DIRECTORY */}
      <section id="directory" className="bg-slate-50 border-y border-slate-200 py-20 scroll-mt-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-10">
            <MapPin className="w-6 h-6 text-slate-400" />
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Browse your state directory</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedStates.map((rule, idx) => {
              const stateName = STATE_NAMES[rule.stateCode] || rule.stateCode;
              return (
                <Link 
                  key={`dir-${rule.stateCode}-${rule.programCode}-${idx}`} 
                  href={`/${rule.programCode.toLowerCase()}/${stateName.toLowerCase().replace(/\s+/g, '-')}`}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">{rule.programCode} Schedule</span>
                    <span className="text-lg font-bold text-slate-800 group-hover:text-blue-700">{stateName}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. TRUST SECTION */}
      <section className="max-w-5xl mx-auto px-6 pt-20">
        <h2 className="text-center text-3xl font-black text-slate-950 mb-12">Why people use WhenIsDue</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-blue-600 mb-5" />
            <h4 className="text-lg font-black text-slate-900 mb-2">Verified State Rules</h4>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              We verify payment dates directly against state-published schedules and official agency manuals.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <CalendarDays className="w-8 h-8 text-blue-600 mb-5" />
            <h4 className="text-lg font-black text-slate-900 mb-2">Holiday Math Done</h4>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Dates automatically adjust when payments fall on weekends or federal bank holidays.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-blue-600 mb-5" />
            <h4 className="text-lg font-black text-slate-900 mb-2">Designed for Mobile</h4>
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Built for quick checking on your phone. No spreadsheets, no guessing, no digging through agency sites.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}