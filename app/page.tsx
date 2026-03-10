import TrackedLink from "@/components/TrackedLink";
import { Landmark, Gamepad2, ArrowRight, Clock, CalendarDays, Flame, Zap, Laptop, BellRing, HelpCircle, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import LastUpdated from "@/components/LastUpdated";
import StickyNextEvent from "@/components/StickyNextEvent";
import SmartCountdown from "@/components/SmartCountdown";
import Link from "next/link"; 

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Constants for our ranking math
const HOT_WINDOW_DAYS = 180;
const MAX_TIME_PENALTY = 36;

// 1. Icon & Accent Mapping
const getCategoryStyling = (category: string) => {
  switch (category) {
    case "FEDERAL": return { icon: Landmark, color: "text-blue-400", accent: "bg-blue-400/80" };
    case "GAMING": return { icon: Gamepad2, color: "text-purple-400", accent: "bg-purple-400/80" };
    case "SHOPPING": return { icon: Zap, color: "text-emerald-400", accent: "bg-emerald-400/80" };
    case "TECH": return { icon: Laptop, color: "text-zinc-300", accent: "bg-zinc-300/80" };
    default: return { icon: Clock, color: "text-zinc-400", accent: "bg-zinc-400/80" };
  }
};

// 2. Context Expansion Helper
const getEventMeaning = (slug: string, category: string) => {
  const s = slug.toLowerCase();
  if (s.includes("ssi")) return "Deposit arrives in bank accounts";
  if (s.includes("social-security") || s.includes("ssa")) return "Monthly payment sent";
  if (s.includes("va-disability")) return "Benefit payment processed";
  if (s.includes("fortnite")) return "Servers go live worldwide";
  if (s.includes("nintendo-direct")) return "Livestream broadcast begins";
  if (s.includes("steam-summer-sale")) return "Store discounts activate";
  if (s.includes("black-friday") || s.includes("cyber-monday")) return "Major retail sales begin";
  if (s.includes("prime-day")) return "Exclusive member deals open";
  if (s.includes("apple-event")) return "Keynote stream goes live";
  if (s.includes("wwdc")) return "Developer keynote begins";
  return "Event goes live";
};

// 3. Exact Date Helper
const formatEventDate = (dueAt: Date | null) => {
  if (!dueAt) return "Date TBA";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(dueAt));
};

// 4. Radar Date Format (e.g., SUN · MAR 8)
const formatRadarDate = (dueAt: Date | null) => {
  if (!dueAt) return "TBA";
  const d = new Date(dueAt);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d).toUpperCase();
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(d).toUpperCase();
  const day = d.getDate();
  return `${weekday} · ${month} ${day}`;
};

// 5. Title Shortener for Radar
const shortenTitle = (title: string) => {
  return title.replace(/ Schedule \d{4}/i, '').replace(/ \d{4}/, '');
};

// 6. Progress Bar Math
const calculateProgress = (daysRemaining: number | string) => {
  if (daysRemaining === "TBA") return 0;
  const days = Number(daysRemaining);
  if (days <= 0) return 100;
  const cycleLength = days > 30 ? 365 : 30;
  const daysPassed = cycleLength - days;
  return Math.max(5, Math.min(100, Math.floor((daysPassed / cycleLength) * 100)));
};

// 7. Urgency-Escalating Countdown Component
const CommandCenterCountdown = ({ days, hours }: { days: number, hours: number }) => {
  const totalHours = (days * 24) + hours;
  if (totalHours <= 0) {
    return (
      <div className="bg-emerald-500 text-black px-3 py-1 rounded animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]">
        <span className="text-[11px] sm:text-xs font-black tracking-widest uppercase">Live Now</span>
      </div>
    );
  }
  let numberColor = "text-emerald-500"; 
  let labelColor = "text-zinc-500";
  if (totalHours < 6) { numberColor = "text-emerald-300"; labelColor = "text-emerald-500/80"; }
  else if (totalHours < 24) { numberColor = "text-emerald-400"; labelColor = "text-emerald-500/60"; }
  else if (days < 7) { numberColor = "text-emerald-400"; labelColor = "text-zinc-400"; }

  return (
    <div className="flex flex-col items-end justify-center leading-none">
      {days > 0 && (
        <div className="flex items-baseline gap-1">
          <span className={`text-base font-black font-mono tabular-nums ${numberColor}`}>{days}</span>
          <span className={`text-[9px] font-bold uppercase tracking-widest ${labelColor}`}>Days</span>
        </div>
      )}
      {(days < 7 && hours > 0 || days === 0) && (
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className={`text-base font-black font-mono tabular-nums ${numberColor}`}>{hours}</span>
          <span className={`text-[9px] font-bold uppercase tracking-widest ${labelColor}`}>Hours</span>
        </div>
      )}
    </div>
  );
};

export default async function HomePage() {
  const now = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const featuredSeries = await prisma.eventSeries.findMany({
    where: { isFeatured: true, isActive: true },
    include: { events: { where: { dueAt: { gt: now } }, orderBy: { dueAt: "asc" }, take: 1 } },
    orderBy: { priorityWeight: "desc" },
    take: 6,
  });

  const commandCenterItems = featuredSeries.map((series: any) => {
      const nextEvent = series.events?.[0];
      if (!nextEvent?.dueAt) return null;
      const msRemaining = nextEvent.dueAt.getTime() - now.getTime();
      const totalHours = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)));
      return { id: series.id, category: series.category, slugBase: series.slugBase || series.slug, title: series.title, heroQuestion: series.heroQuestion || series.title, sourceName: series.sourceName || "SYSTEM", days: Math.floor(totalHours / 24), hours: totalHours % 24 };
    }).filter(Boolean).slice(0, 5);

  // Fetch all active events (removing the dueAt > now filter so we can grab TBAs)
  const allActiveEvents = await prisma.event.findMany({
    where: { isArchived: false }, 
    include: { 
      series: true,
      clickStat: true 
    } 
  });

  const nowMs = now.getTime();

  const trendingEvents = allActiveEvents
    .map((event: any) => {
      // 1. Base Scores
      const priority = event.series?.priorityWeight ?? 5;
      const clicks1h = event.clickStat?.clickCount1h ?? 0;
      
      const baseScore = priority * 10;
      const featuredBoost = event.series?.isFeatured ? 25 : 0;
      const velocityBonus = Math.log1p(clicks1h) * 12;

      let timePenalty = 0;
      let tbaBoost = 0;

      // 2. Logarithmic Decay & TBA Logic
      if (event.dueAt) {
        const dueMs = event.dueAt.getTime();
        const diffDays = (dueMs - nowMs) / (1000 * 60 * 60 * 24);

        if (diffDays > 0) {
          // Compress far-future dates logarithmically
          timePenalty = (Math.log1p(diffDays) / Math.log1p(HOT_WINDOW_DAYS)) * MAX_TIME_PENALTY;
        } else if (diffDays < -1) {
          // Heavy penalty if it's been over 24 hours since it went live
          timePenalty = 100;
        }
      } else {
        // Ghost Month feature: Give TBA events a boost so they don't vanish
        tbaBoost = 15;
      }

      const rawScore = baseScore + velocityBonus + tbaBoost + featuredBoost - timePenalty;
      const hotScore = Math.max(0, Math.round(rawScore * 100) / 100);

      return { ...event, hotScore };
    })
    .sort((a: any, b: any) => b.hotScore - a.hotScore)
    .slice(0, 6); 

  const nextFederal = await prisma.event.findFirst({ where: { category: "FEDERAL", dueAt: { gte: now } }, orderBy: { dueAt: "asc" } });
  const nextGaming = await prisma.event.findFirst({ where: { category: "GAMING", dueAt: { gte: now } }, orderBy: { dueAt: "asc" } });
  const nextShopping = await prisma.event.findFirst({ where: { category: "SHOPPING", dueAt: { gte: now } }, orderBy: { dueAt: "asc" } });
  const nextTech = await prisma.event.findFirst({ where: { category: "TECH", dueAt: { gte: now } }, orderBy: { dueAt: "asc" } });

  const nextByCategory = [nextFederal, nextGaming, nextShopping, nextTech]
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  const thisWeekEvents = await prisma.event.findMany({ where: { dueAt: { gte: now, lte: nextWeek } }, orderBy: { dueAt: "asc" }, take: 7 });
  const topEvent = trendingEvents[0];
  const topEventDays = topEvent?.dueAt ? Math.max(0, Math.ceil((new Date(topEvent.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : "TBA";

  return (
    <main className="min-h-screen bg-black text-white selection:bg-emerald-500/30 font-sans pb-20 pt-4">
      {topEvent && (
        <StickyNextEvent title={topEvent.title} date={formatEventDate(topEvent.dueAt)} days={topEventDays === 0 ? "TODAY" : topEventDays} url={`/${topEvent.category.toLowerCase()}/${topEvent.slug}`} />
      )}

      {/* --- QUICK ANSWER GUIDE --- */}
      {commandCenterItems.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 mb-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-900 px-5 py-2.5 bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-500" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  Quick Answer Guide
                </h2>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/80">
                  Verified Dates
                </span>
              </div>
            </div>

            <div className="divide-y divide-zinc-900/50">
              {commandCenterItems.map((item: any) => (
                <TrackedLink
                  key={item.id}
                  eventId={item.id}
                  href={`/${item.category.toLowerCase()}/${item.slugBase}`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-zinc-900/40 transition-all"
                >                  
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="text-emerald-500 font-black text-base mr-2">{">"}</span>
                    <h2 className="text-base md:text-lg font-bold text-zinc-100 group-hover:text-white transition-colors leading-snug">
                      {item.heroQuestion.replace(/\?+\s*$/, "").trim()}?
                    </h2>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-emerald-500/50 group-hover:text-emerald-400 transition-colors uppercase tracking-widest">
                      Track <ArrowRight className="w-3 h-3" />
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg group-hover:border-emerald-500/30 transition-colors">
                        <CommandCenterCountdown days={item.days} hours={item.hours} />
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-tighter text-zinc-500 mt-1">
                        Verified via {item.sourceName}
                      </span>
                    </div>
                  </div>
                </TrackedLink>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- WHAT'S NEXT BY CATEGORY --- */}
      <section className="max-w-5xl mx-auto px-4 mb-10 mt-2">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
          <div className="flex items-center gap-2"><BellRing className="w-5 h-5 text-emerald-400" /><h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">What’s Next by Category</h2></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {nextByCategory.map((item: any, index: number) => {
            const style = getCategoryStyling(item.category);
            const Icon = style.icon;
            const isSoonest = index === 0;
            return (
              <TrackedLink key={item.slug} eventId={item.id} href={`/${item.category.toLowerCase()}/${item.slug}`} className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between min-h-[180px] ${isSoonest ? "bg-zinc-950 border border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.08)]" : "bg-zinc-950/80 border border-zinc-800 hover:-translate-y-1 hover:border-zinc-500 hover:bg-zinc-900"}`}>
                <div className={`absolute inset-x-0 top-0 h-[2px] ${style.accent}`} />
                {isSoonest && (<div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Soonest</span></div>)}
                <div>
                  <div className="flex items-center gap-2 mb-3"><Icon className={`w-5 h-5 ${style.color}`} /><span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">{item.category}</span></div>
                  <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white line-clamp-2 mb-1 leading-tight transition-colors pr-16">{item.title}</h3>
                  <p className="text-xs text-zinc-400 mb-1">{getEventMeaning(item.slug, item.category)}</p>
                  <p className="text-xs text-zinc-500 font-medium">{formatEventDate(item.dueAt)}</p>
                </div>
                {/* FIX: Added overflow-hidden and [&>div]:flex-wrap to prevent text from blowing out the card */}
                <div className="mt-4 min-w-0 w-full overflow-hidden [&>div]:flex-wrap [&>div]:gap-x-1.5">
                  {item.dueAt ? (
                    <SmartCountdown dueAt={item.dueAt.toISOString()} urgent={isSoonest} />
                  ) : (
                    <div className="flex items-end gap-2"><span className="px-4 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-3xl font-black font-mono tracking-tight text-white leading-none">TBA</span></div>
                  )}
                </div>
              </TrackedLink>
            );
          })}
        </div>
      </section>

      {thisWeekEvents.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 mb-10">
          <div className="flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-zinc-500" /><h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">This Week</h2></div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {thisWeekEvents.map((item: any) => (
              <TrackedLink key={item.slug} eventId={item.id} href={`/${item.category.toLowerCase()}/${item.slug}`} className="shrink-0 snap-start bg-zinc-900/40 border border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900 rounded-xl p-4 min-w-[160px] max-w-[200px] transition-all">
                <div className="text-emerald-400 font-bold text-xs mb-1.5 uppercase tracking-widest">{formatRadarDate(item.dueAt)}</div>
                <div className="text-zinc-200 text-sm font-bold line-clamp-2 leading-snug">{shortenTitle(item.title)}</div>
              </TrackedLink>
            ))}
          </div>
        </section>
      )}

      {/* --- TRENDING COUNTDOWNS --- */}
      <section id="trending" className="max-w-5xl mx-auto px-4 scroll-mt-6">
        <div className="flex items-center justify-between gap-3 mb-6 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-3 flex-wrap"><div className="flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /><h2 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Trending Countdowns</h2></div><div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-2.5 py-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /><LastUpdated /></div></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {trendingEvents.map((item: any, index: number) => {
            const style = getCategoryStyling(item.category);
            const Icon = style.icon;
            const isNextEvent = index === 0;
            const daysRemaining = item.dueAt ? Math.ceil((new Date(item.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : "TBA";
            if (daysRemaining !== "TBA" && daysRemaining < 0) return null;
            return (
              <TrackedLink key={item.slug} eventId={item.id} href={`/${item.category.toLowerCase()}/${item.slug}`} className={`group rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between min-h-[220px] ${isNextEvent ? "bg-zinc-950/90 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden" : "bg-zinc-950/80 border border-zinc-800"} hover:-translate-y-1 hover:border-zinc-500 hover:bg-zinc-900`}>
                <div>
                  <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Icon className={`w-5 h-5 ${style.color}`} /><span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">{item.category}</span></div>{isNextEvent && (<span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">Next</span>)}</div>
                  <h3 className="text-base font-bold text-zinc-100 group-hover:text-white line-clamp-2 mb-1.5 leading-tight transition-colors">{item.title}</h3>
                  <p className="text-xs text-zinc-400 mb-1.5 leading-snug">{getEventMeaning(item.slug, item.category)}</p>
                  <p className="text-xs text-zinc-500 font-medium">{formatEventDate(item.dueAt)}</p>
                </div>
                {/* FIX: Added overflow-hidden and [&>div]:flex-wrap to prevent text from blowing out the card */}
                <div className="mt-2 flex flex-col gap-2 min-w-0 w-full overflow-hidden [&>div]:flex-wrap [&>div]:gap-x-1.5">
                  {item.dueAt ? (
                    <SmartCountdown dueAt={item.dueAt.toISOString()} urgent={isNextEvent} />
                  ) : (
                    <div className="mt-4 flex items-end gap-2"><span className="px-4 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-4xl font-black font-mono tracking-tight text-white leading-none">TBA</span></div>
                  )}
                </div>
              </TrackedLink>
            );
          })}
        </div>
      </section>
    </main>
  );
}