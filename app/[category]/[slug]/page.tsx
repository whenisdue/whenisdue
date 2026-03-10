import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EventCountdown from "@/components/EventCountdown";
import Breadcrumbs from "@/components/Breadcrumbs";
import { PageViewTracker } from "@/components/PageViewTracker";
import RelatedEventsSection from "@/components/RelatedEventsSection";
import SubscribeButton from "@/components/SubscribeButton";
import { CalendarDays, Info, Users, Clock, Flame } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

// ISR: Cache this page for 5 minutes. Real-time ticking happens in the Client Component.
export const revalidate = 300; 

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

// 1. The Shared "Source of Truth" Fetcher
async function getEventData(rawCategory: string, rawSlug: string) {
  const category = rawCategory.trim().toUpperCase();
  const slug = rawSlug.trim().toLowerCase();

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      series: true,
      clickStat: true,
    },
  });

  if (!event) return null;

  let nextUpcoming = null;
  if (event.seriesId && event.dueAt) {
    nextUpcoming = await prisma.event.findFirst({
      where: {
        seriesId: event.seriesId,
        dueAt: { gt: event.dueAt },
        isArchived: false,
      },
      orderBy: { dueAt: "asc" },
      select: { title: true, slug: true, dueAt: true, category: true },
    });
  }

  return { event, nextUpcoming, normalizedCategory: category };
}

// 2. Dynamic Metadata Generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const data = await getEventData(category, slug);
  
  if (!data || data.event.isArchived) {
    return { title: "Event Not Found" };
  }

  // Card Key Cardinality: Bake the days remaining into the URL to ensure clean CDN caching
  const daysRemaining = data.event.dueAt 
    ? Math.max(0, Math.ceil((data.event.dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) 
    : 'tba';
    
  const ogImageUrl = `/${data.event.category.toLowerCase()}/${data.event.slug}/opengraph-image?bucket=${daysRemaining}`;
  const altText = `Social card showing countdown for ${data.event.title} in the ${data.event.category} category, branded for WhenIsDue.`;

  return {
    title: `${data.event.title} | WhenIsDue`,
    description: data.event.shortSummary || `Countdown to ${data.event.title}.`,
    alternates: {
      canonical: `/${data.event.category.toLowerCase()}/${data.event.slug}`,
    },
    openGraph: {
      title: data.event.title,
      description: data.event.shortSummary || undefined,
      images: [{ url: ogImageUrl, alt: altText }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.event.title,
      description: data.event.shortSummary || undefined,
      images: [{ url: ogImageUrl, alt: altText }],
    },
  };
}

// 3. The Main Page Component
export default async function EventDetailPage({ params }: PageProps) {
  const { category, slug } = await params;
  const data = await getEventData(category, slug);

  if (!data || data.event.isArchived) {
    notFound();
  }

  if (data.event.category !== data.normalizedCategory) {
    redirect(`/${data.event.category.toLowerCase()}/${data.event.slug}`);
  }

  const { event, nextUpcoming } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.shortSummary || undefined,
    startDate: event.dueAt ? event.dueAt.toISOString() : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/${event.category.toLowerCase()}/${event.slug}`,
  };

  const breadcrumbs: { label: string; href: string; current?: boolean }[] = [
    { label: "Home", href: "/" },
    { label: event.category, href: `/${event.category.toLowerCase()}` },
  ];
  if (event.series) {
    breadcrumbs.push({ label: event.series.title, href: `/${event.category.toLowerCase()}/series/${event.series.slugBase}` });
  }
  breadcrumbs.push({ label: event.title, href: `/${event.category.toLowerCase()}/${event.slug}`, current: true });

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8 pb-32">
      <PageViewTracker />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="max-w-4xl mx-auto mt-6">
        <Breadcrumbs items={breadcrumbs} />

        <header className="mb-12 border-b border-zinc-900 pb-12">
          {/* Updated Flex Container for Badges + Subscribe Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
                {event.category}
              </span>
              {event.clickStat && event.clickStat.clickCount1h > 10 && (
                <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-orange-500">
                  <Flame className="w-4 h-4" /> Trending
                </span>
              )}
            </div>
            
            {/* The Subscribe Bell! */}
            <SubscribeButton eventId={event.id} initialSubscribed={false} />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            {event.title}
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mb-10">
            {event.shortSummary || "Details to be announced."}
          </p>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 text-center">Time Remaining</h2>
            <div className="flex justify-center">
              {event.dueAt ? (
                <EventCountdown targetEpochMs={event.dueAt.getTime()} />
              ) : (
                <span className="text-6xl font-black font-mono tracking-tight text-zinc-600">TBA</span>
              )}
            </div>
            {event.dueAt && (
              <p className="text-center text-zinc-500 mt-6 text-sm font-medium">
                Target Date: {event.dueAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 text-emerald-400">
              <Info className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-widest text-sm">What To Expect</h3>
            </div>
            <p className="text-zinc-300 leading-relaxed text-sm">
              {event.whatToExpect || "Information will be updated closer to the event date."}
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 text-blue-400">
              <Users className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-widest text-sm">Target Audience</h3>
            </div>
            <p className="text-zinc-300 leading-relaxed text-sm">
              {event.targetAudience || "General Public"}
            </p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 text-purple-400">
              <Clock className="w-5 h-5" />
              <h3 className="font-bold uppercase tracking-widest text-sm">Duration</h3>
            </div>
            <p className="text-zinc-300 leading-relaxed text-sm">
              {event.expectedDuration || "TBD"}
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="mt-16 pt-12 border-t border-zinc-900 animate-pulse text-zinc-600 text-xs font-bold uppercase tracking-widest">Finding related intelligence...</div>}>
          <RelatedEventsSection currentEvent={event} />
        </Suspense>

        {nextUpcoming && (
          <div className="mt-12 pt-12 border-t border-zinc-900">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Next in Series</h3>
            <a 
              href={`/${nextUpcoming.category.toLowerCase()}/${nextUpcoming.slug}`}
              className="group block bg-zinc-950 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-bold text-zinc-100 group-hover:text-white transition-colors">{nextUpcoming.title}</h4>
                  <p className="text-sm text-zinc-500 mt-1">
                    {nextUpcoming.dueAt ? nextUpcoming.dueAt.toLocaleDateString() : "TBA"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                  <CalendarDays className="w-4 h-4 text-zinc-400" />
                </div>
              </div>
            </a>
          </div>
        )}
      </div>
    </main>
  );
}