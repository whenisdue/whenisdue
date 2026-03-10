import TrackedLink from "@/components/TrackedLink";
import { Landmark, Gamepad2, ArrowRight, Clock, CalendarDays, Flame, Zap, Laptop, BellRing, HelpCircle, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import LastUpdated from "@/components/LastUpdated";
import StickyNextEvent from "@/components/StickyNextEvent";
import SmartCountdown from "@/components/SmartCountdown";
import EventTimeDisplay from "@/components/EventTimeDisplay";
import Link from "next/link"; 

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

const HOT_WINDOW_DAYS = 180;
const MAX_TIME_PENALTY = 36;

// 1. UI Styling Helpers (Updated for Institutional Trust)
const getCategoryStyling = (category: string) => {
  switch (category) {
    case "FEDERAL": return { icon: Landmark, color: "text-blue-400", accent: "bg-blue-400/80" };
    case "GAMING": return { icon: Gamepad2, color: "text-purple-400", accent: "bg-purple-400/80" };
    case "SHOPPING": return { icon: Zap, color: "text-emerald-400", accent: "bg-emerald-400/80" };
    case "TECH": return { icon: Laptop, color: "text-slate-300", accent: "bg-slate-300/80" };
    default: return { icon: Clock, color: "text-slate-400", accent: "bg-slate-400/80" };
  }
};

const getEventMeaning = (slug: string, category: string) => {
  const s = slug.toLowerCase();
  if (s.includes("ssi")) return "Deposit arrives in bank accounts";
  if (s.includes("social-security")) return "Monthly payment sent";
  if (s.includes("va-disability")) return "Benefit payment processed";
  if (s.includes("fortnite")) return "Servers go live worldwide";
  if (s.includes("nintendo-direct")) return "Livestream broadcast begins";
  if (s.includes("steam-summer-sale")) return "Store discounts activate";
  if (s.includes("apple-event")) return "Keynote stream goes live";
  return "Event goes live";
};

const formatEventDate = (dueAt: Date | null) => {
  if (!dueAt) return "Date TBA";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(dueAt));
};

const formatRadarDate = (dueAt: Date | null) => {
  if (!dueAt) return "TBA";
  const d = new Date(dueAt);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d).toUpperCase();
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(d).toUpperCase();
  return `${weekday} · ${month} ${d.getDate()}`;
};

const shortenTitle = (title: string) => title.replace(/ Schedule \d{4}/i, '').replace(/ \d{4}/, '');

// 2. Status Helper for Trust Signals
const getStatus = (event: any) => {
  if (!event.dueAt) return "TBA";
  if (event.category === "FEDERAL" || event.series?.priorityWeight > 8) return "CONFIRMED";
  return "ESTIMATED";
};

export default async function HomePage() {
  const now = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Data Fetching
  const allActiveEvents = await prisma.event.findMany({
    where: { isArchived: false }, 
    include: { series: true, clickStat: true } 
  });

  const featuredSeries = await prisma.eventSeries.findMany({
    where: { isFeatured: true, isActive: true },
    include: { events: { where: { dueAt: { gt: now } }, orderBy: { dueAt: "asc" }, take: 1 } },
    orderBy: { priorityWeight: "desc" },
    take: 6,
  });

  // Ranking & Selection Logic
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

  // Authoritative Hero Selection
  const topEvent = trendingEvents.find(e => e.dueAt !== null) || trendingEvents[0];
  const topEventDays = topEvent?.dueAt ? Math.max(0, Math.ceil((topEvent.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : "TBA";

  const commandCenterItems = featuredSeries.map((series: any) => {
    const nextEvent = series.events?.[0];
    if (!nextEvent?.dueAt) return null;
    const totalHours = Math.max(0, Math.floor((nextEvent.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
    return { ...series, days: Math.floor(totalHours / 24), hours: totalHours % 24 };
  }).filter(Boolean).slice(0, 5);

  const nextByCategory = ["FEDERAL", "GAMING", "SHOPPING", "TECH"]
    .map(cat => allActiveEvents.filter(e => e.category === cat && e.dueAt && new Date(e.dueAt) >= now).sort((a,b) => a.dueAt!.getTime() - b.dueAt!.getTime())[0])
    .filter(Boolean);

  const thisWeekEvents = allActiveEvents.filter(e => e.dueAt && e.dueAt >= now && e.dueAt <= nextWeek).sort((a,b) => a.dueAt!.getTime() - b.dueAt!.getTime()).slice(0, 7);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 font-sans pb-20">
      
      {/* 1. Global Reassurance Banner */}
      <div className="w-full bg-blue-900/15 border-b border-blue-900/40 text-blue-400 text-[11px] sm:text-xs font-bold py-2.5 px-4 text-center tracking-wide">
        📍 All times shown are automatically adjusted to your local timezone.
      </div>

      <div className="pt-6">
{/* 2. Hero Section */}
        {topEvent && (
          <StickyNextEvent 
            title={topEvent.title} 
            dueAt={topEvent.dueAt} 
            officialZone={topEvent.timeZone || 'UTC'}
            url={`/${topEvent.category.toLowerCase()}/${topEvent.slug}`} 
            sourceName={topEvent.series?.sourceName || "Public Record"}
            status={getStatus(topEvent) as any}
          />
        )}
        
        {/* 3. Quick Answer Guide */}
        {commandCenterItems.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 mb-12">
             <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quick Answer Guide</h2>
                   <ShieldCheck className="w-3 h-3 text-emerald-500/70" />
                </div>
                <div className="divide-y divide-slate-800/60">
                   {commandCenterItems.map((item: any) => (
                      <TrackedLink key={item.id} eventId={item.id} href={`/${item.category.toLowerCase()}/${item.slugBase || item.slug}`} className="flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors group">
                         <span className="text-base font-bold text-slate-200 group-hover:text-white">{item.heroQuestion || item.title}?</span>
                         <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                      </TrackedLink>
                   ))}
                </div>
             </div>
          </section>
        )}

        {/* 4. Category Grid */}
        <section className="max-w-5xl mx-auto px-4 mb-12">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
             <BellRing className="w-4 h-4 text-blue-400" />
             <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Next by Category</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nextByCategory.map((item: any) => {
              const style = getCategoryStyling(item.category);
              return (
                <TrackedLink key={item.slug} eventId={item.id} href={`/${item.category.toLowerCase()}/${item.slug}`} className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-500 transition-all flex flex-col justify-between min-h-[200px]">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                       <style.icon className={`w-4 h-4 ${style.color}`} />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.category}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 leading-tight mb-2">{item.title}</h3>
                    <EventTimeDisplay dueAt={item.dueAt} officialZone={item.timeZone || 'UTC'} compact={true} />
                  </div>
                  <div className="mt-4 min-w-0 w-full overflow-hidden [&>div]:scale-[0.85] [&>div]:origin-left">
                     <SmartCountdown dueAt={item.dueAt.toISOString()} />
                  </div>
                </TrackedLink>
              );
            })}
          </div>
        </section>

        {/* 5. Active Trackers */}
        <section className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
             <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Active Trackers</h2>
             </div>
             <LastUpdated />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {trendingEvents.slice(0, 10).map((item: any) => (
              <TrackedLink 
                key={item.slug} 
                eventId={item.id} 
                href={`/${item.category.toLowerCase()}/${item.slug}`} 
                className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 hover:bg-slate-800/60 transition-colors flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-200 line-clamp-1 mb-1">{item.title}</h4>
                  <div className="text-[10px] text-slate-500 uppercase font-medium mb-3">
                    {formatEventDate(item.dueAt)}
                  </div>
                </div>
                
                {/* Fixed Countdown scaling and TBA rendering */}
                <div className="mt-auto min-w-0 w-full overflow-hidden [&>div]:scale-[0.65] [&>div]:origin-left">
                  {item.dueAt ? (
                    <SmartCountdown dueAt={item.dueAt.toISOString()} />
                  ) : (
                    <span className="text-xl font-black font-mono tracking-widest text-slate-600">
                      TBA
                    </span>
                  )}
                </div>
              </TrackedLink>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}