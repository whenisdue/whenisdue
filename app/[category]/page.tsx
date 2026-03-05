import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { aggregateSeries } from "../../lib/seriesAggregation";

type EventRecord = {
  category?: string;
  slug?: string;
  title?: string;
  eventName?: string;
  description?: string;
  statusLabel?: string;
  dateLine?: string;
  dueAt?: string;
  dueDate?: string;
  dateISO?: string;
  seriesKey?: string;
  confidenceScore?: number;
};

function getDueIso(e: EventRecord): string {
  return (e.dueAt ?? e.dueDate ?? e.dateISO ?? "").trim();
}

function getStatusKind(label?: string): "confirmed" | "expected" | "rumor" {
  const raw = (label ?? "").trim().toUpperCase();
  if (raw === "CONFIRMED") return "confirmed";
  if (raw === "EXPECTED") return "expected";
  if (raw === "RUMOR") return "rumor";
  return "rumor";
}

async function loadEvents(): Promise<EventRecord[]> {
  const jsonPath = path.resolve(process.cwd(), "../data/events.json"); 
  try {
    const raw = await fs.readFile(jsonPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean) as EventRecord[];
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const events = await loadEvents();
  const cats = new Set<string>();
  for (const e of events) {
    if (typeof e?.category === "string" && e.category.trim()) cats.add(e.category.trim());
  }
  return Array.from(cats).map((category) => ({ category }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const { category } = await params;
  const pretty = category.replace(/-/g, " ");
  return {
    title: `${pretty.toUpperCase()} Events | WhenIsDue`,
    description: `Track upcoming ${pretty} events. Verified dates, countdowns, and readiness estimates.`,
    alternates: { canonical: `https://whenisdue.com/${category}` },
  };
}

export default async function CategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  const events = await loadEvents();
  
  const categoryEvents = events.filter(
    (e) => e?.category === category && typeof e?.slug === "string" && e.slug
  );

  if (categoryEvents.length === 0) notFound();

  let confirmedCount = 0;
  let expectedCount = 0;
  let nearestDateIso: string | null = null;
  let nearestDateMs = Infinity;
  const nowMs = Date.now();

  for (const e of categoryEvents) {
    const kind = getStatusKind(e.statusLabel);
    if (kind === "confirmed") confirmedCount++;
    if (kind === "expected") expectedCount++;

    const iso = getDueIso(e);
    if (iso) {
      const dt = new Date(iso).getTime();
      if (Number.isFinite(dt) && dt > nowMs && dt < nearestDateMs) {
        nearestDateMs = dt;
        nearestDateIso = iso.split("T")[0]; 
      }
    }
  }

  const eventsWithSortKeys = categoryEvents.map((e) => {
    const kind = getStatusKind(e.statusLabel);
    const rank = { confirmed: 0, expected: 1, rumor: 2 }[kind];

    const iso = getDueIso(e);
    const t = iso ? new Date(iso).getTime() : NaN;
    const dt = Number.isFinite(t) ? t : Infinity;

    let cciScore = -1;
    let windowDays = Infinity;

    if (e.seriesKey) {
      const stats = aggregateSeries(events, e.seriesKey);
      if (stats?.cci?.eligible) {
        cciScore = stats.cci.cci;
        windowDays = stats.cci.windowDays;
      }
    }

    const confidence = e.confidenceScore ?? -1;

    return { e, rank, dt, cciScore, windowDays, confidence, slug: e.slug ?? "" };
  });

  eventsWithSortKeys.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.rank === 0) return a.dt - b.dt;
    if (a.cciScore !== b.cciScore) return b.cciScore - a.cciScore; 
    if (a.windowDays !== b.windowDays) return a.windowDays - b.windowDays; 
    if (a.confidence !== b.confidence) return b.confidence - a.confidence; 
    if (a.dt !== b.dt) return a.dt - b.dt; 
    return a.slug.localeCompare(b.slug); 
  });

  const sortedEvents = eventsWithSortKeys.map((item) => item.e);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const itemListElement = sortedEvents.map((e, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${siteUrl}/${category}/${e.slug}`
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${category.toUpperCase()} Events Hub`,
    description: `Upcoming ${category} events, tracked and verified.`,
    url: `${siteUrl}/${category}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h1 className="text-4xl font-semibold tracking-tight capitalize">
        {category.replace(/-/g, " ")} Readiness
      </h1>
      <p className="mt-2 text-sm opacity-75">
        Verified dates, countdowns, and historical frequency tracking.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs opacity-60">Total Tracked</div>
          <div className="mt-1 text-2xl font-semibold">{categoryEvents.length}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs opacity-60">Confirmed</div>
          <div className="mt-1 text-2xl font-semibold">{confirmedCount}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs opacity-60">Expected</div>
          <div className="mt-1 text-2xl font-semibold">{expectedCount}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs opacity-60">Next Event</div>
          <div className="mt-1 text-lg font-semibold tracking-tight">
            {nearestDateIso ? nearestDateIso : "—"}
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-4">
        {sortedEvents.map((e) => {
          const iso = getDueIso(e);
          const title = e.title ?? e.eventName ?? e.slug;
          return (
            <div key={e.slug} className="block rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-center gap-3">
                {e.statusLabel ? (
                  <span className="rounded bg-white/5 px-2 py-1 text-[10px] font-semibold tracking-wider opacity-80 uppercase border border-white/10">
                    {e.statusLabel}
                  </span>
                ) : null}
                {e.dateLine ? (
                  <span className="text-xs opacity-60">{e.dateLine}</span>
                ) : null}
              </div>

              <div className="mt-3 text-xl font-semibold">{title}</div>
              
              {e.description ? (
                <div className="mt-1 text-sm opacity-70 line-clamp-2">{e.description}</div>
              ) : null}

              <div className="mt-5 flex items-center gap-4 border-t border-white/5 pt-4">
                <Link 
                  href={`/${category}/${e.slug}`}
                  className="text-sm font-medium hover:underline opacity-90"
                >
                  View details →
                </Link>
                {iso && (
                  <Link 
                    href={`/tools/days-until?date=${iso.split("T")[0]}`}
                    className="text-sm opacity-50 hover:opacity-100 transition"
                  >
                    Start countdown
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}