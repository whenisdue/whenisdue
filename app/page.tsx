import TrackedLink from "@/components/TrackedLink";
import { Landmark, Building2, FileText, LineChart, ArrowRight, BellRing } from "lucide-react";
import { prisma } from "@/lib/prisma";
import StickyNextEvent from "@/components/StickyNextEvent";
import EventTimeDisplay from "@/components/EventTimeDisplay";

export const dynamic = 'force-dynamic';

const HOT_WINDOW_DAYS = 180;
const MAX_TIME_PENALTY = 36;

// Institutional Icons and Muted Colors
const getCategoryStyling = (category: string) => {
  switch (category) {
    case "FEDERAL": return { icon: Landmark, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
    case "STATE": return { icon: Building2, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" };
    case "TAX": return { icon: FileText, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
    case "MARKETS": return { icon: LineChart, color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-300" };
    default: return { icon: BellRing, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
  }
};

const getStatus = (event: any) => {
  if (!event.dueAt) return "TBA";
  if (event.category === "FEDERAL" || event.series?.priorityWeight > 8) return "CONFIRMED";
  return "ESTIMATED";
};

export default async function HomePage() {
  const now = new Date();
  
  // NARROW AND DEEP: Only fetch Financial/Benefit categories
  const allActiveEvents = await prisma.event.findMany({
    where: { 
      isArchived: false,
      category: { in: ["FEDERAL", "STATE", "TAX", "MARKETS"] } 
    }, 
    include: { series: true, clickStat: true } 
  });

  const trendingEvents = allActiveEvents
    .map((event: any) => {
      const priority = event.series?.priorityWeight ?? 5;
      const clicks1h = event.clickStat?.clickCount1h ?? 0;
      const baseScore = priority * 10;
      const velocityBonus = Math.log1p(clicks1h) * 12;
      let timePenalty = 0;
      if (event.dueAt) {
        const diffDays = (event.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 0) timePenalty = (Math.log1p(diffDays) / Math.log1p(HOT_WINDOW_DAYS)) * MAX_TIME_PENALTY;
        else if (diffDays < -1) timePenalty = 100;
      }
      const hotScore = Math.max(0, Math.round((baseScore + velocityBonus - timePenalty) * 100) / 100);
      return { ...event, hotScore };
    })
    .sort((a, b) => b.hotScore - a.hotScore);

  const topEvent = trendingEvents.find(e => e.dueAt !== null) || trendingEvents[0];

  const nextByCategory = ["FEDERAL", "STATE", "TAX", "MARKETS"]
    .map(cat => allActiveEvents.filter(e => e.category === cat && e.dueAt && new Date(e.dueAt) >= now).sort((a,b) => a.dueAt!.getTime() - b.dueAt!.getTime())[0])
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-200 font-sans pb-20">
      
      {/* Calm Information Banner */}
      <div className="w-full bg-blue-50 border-b border-blue-100 text-blue-800 text-xs font-semibold py-3 px-4 text-center">
        Benefit payment schedules by program and state. Times adjust automatically to your location.
      </div>

      <div className="pt-8">
        
        {/* The Reference Record Hero */}
        {topEvent && (
          <StickyNextEvent 
            title={topEvent.title} 
            dueAt={topEvent.dueAt} 
            officialZone={topEvent.timeZone || 'UTC'}
            url={`/${topEvent.category.toLowerCase()}/${topEvent.slug}`} 
            sourceName={topEvent.series?.sourceName || "Official Agency Portal"}
            status={getStatus(topEvent) as any}
            lastVerified={new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(now)}
          />
        )}

        {/* Structured Context: Categories */}
        <section className="max-w-5xl mx-auto px-4 mb-16">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
             <Landmark className="w-5 h-5 text-slate-700" />
             <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Upcoming by Category</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nextByCategory.map((item: any) => {
              const style = getCategoryStyling(item.category);
              return (
                <TrackedLink key={item.slug} eventId={item.id} href={`/${item.category.toLowerCase()}/${item.slug}`} className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between min-h-[220px]">
                  <div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${style.bg} ${style.border} mb-4`}>
                       <style.icon className={`w-3.5 h-3.5 ${style.color}`} />
                       <span className={`text-[10px] font-bold uppercase tracking-widest ${style.color}`}>{item.category}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 group-hover:text-blue-700 transition-colors">{item.title}</h3>
                    <EventTimeDisplay dueAt={item.dueAt} officialZone={item.timeZone || 'UTC'} compact={true} />
                  </div>
                  
                  {/* Subtle Link Instead of Giant Countdown for Secondary Cards */}
                  <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-blue-600">
                    View Schedule <ArrowRight className="w-4 h-4" />
                  </div>
                </TrackedLink>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}