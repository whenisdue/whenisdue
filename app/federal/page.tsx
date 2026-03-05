import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";

export const metadata: Metadata = {
  title: "Federal Calendar Hub | WhenIsDue",
  description: "Official federal payment schedules and announcement dates—organized, kept current, and clearly labeled as Confirmed or Expected.",
  alternates: { canonical: "https://whenisdue.com/federal" },
};

type StatusLabel = "CONFIRMED" | "EXPECTED" | "RUMOR";

type BaseFederalNode = {
  eventId: string;
  category: string;
  title?: string;
  eventName?: string;
  canonicalSlug: string;
  statusLabel: StatusLabel;
  eventType?: "EVENT" | "ANNOUNCEMENT" | "SCHEDULE";
  dateISO?: string;
  officialDates?: Array<{ month?: string; date: string; group?: string }>;
};

// FIXED: Path updated to point inside the web sandbox for Vercel compatibility
async function loadEvents(): Promise<BaseFederalNode[]> {
  const jsonPath = path.resolve(process.cwd(), "data/events.json");
  const raw = await fs.readFile(jsonPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed as BaseFederalNode[];
}

function statusPillClasses(status: StatusLabel): string {
  return status === "CONFIRMED"
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
    : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
}

function formatISOToLongDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }).format(d);
}

function formatISOToMonthYear(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

function getYearForSorting(n: BaseFederalNode): number {
  if (n.dateISO) return parseInt(n.dateISO.substring(0, 4));
  if (n.officialDates && n.officialDates.length > 0) return parseInt(n.officialDates[0].date.substring(0, 4));
  return 0;
}

function normalizeFederalNodes(raw: BaseFederalNode[]): BaseFederalNode[] {
  return raw.filter((x) => x.category === "federal");
}

function buildFederalCollectionJsonLd(nodes: BaseFederalNode[]) {
  const baseUrl = "https://whenisdue.com";
  const url = `${baseUrl}/federal`;
  const ordered = [...nodes].sort((a, b) => getYearForSorting(b) - getYearForSorting(a));

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Federal Calendar Hub",
    description: "A curated collection of official federal payment schedules and announcement dates, organized for clarity and labeled as Confirmed or Expected.",
    url,
    isPartOf: { "@type": "WebSite", name: "WhenIsDue", url: baseUrl },
    about: [ { "@type": "Thing", name: "Federal payment schedules" }, { "@type": "Thing", name: "Federal announcements" } ],
    hasPart: ordered.map((n) => ({ "@type": "WebPage", name: n.eventName || n.title, url: `${baseUrl}/${n.canonicalSlug}` })),
  } as const;
}

function Card({ href, title, subtitle, statusLabel, metaLeft }: { href: string; title: string; subtitle?: string; statusLabel: StatusLabel; metaLeft?: string; }) {
  return (
    <Link href={href} className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900 group-hover:text-slate-950">{title}</h3>
          {subtitle && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{subtitle}</p>}
        </div>
        <span className={["shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", statusPillClasses(statusLabel)].join(" ")}>{statusLabel}</span>
      </div>
      {metaLeft && (
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-600">
          <span className="truncate">{metaLeft}</span>
        </div>
      )}
    </Link>
  );
}

export default async function FederalHubPage() {
  const all = await loadEvents();
  const federalNodes = normalizeFederalNodes(all);

  const paymentSchedules = federalNodes
    .filter((n) => n.eventType === "SCHEDULE")
    .sort((a, b) => getYearForSorting(b) - getYearForSorting(a));

  const colaAnnouncements = federalNodes
    .filter((n) => n.eventType === "EVENT" || n.eventType === "ANNOUNCEMENT")
    .sort((a, b) => String(b.dateISO ?? "").localeCompare(String(a.dateISO ?? "")));

  const jsonLd = buildFederalCollectionJsonLd(federalNodes);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">WhenIsDue • Federal</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Federal Calendar Hub</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
              This page is a curated dashboard of high-impact U.S. federal dates—published schedules and discrete announcements—organized for fast verification. Every entry is clearly labeled as <span className="font-semibold text-slate-900">CONFIRMED</span> (officially published) or <span className="font-semibold text-slate-900">EXPECTED</span> (projected, until the agency releases the official date).
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-inset ring-slate-200">Payment schedules: <span className="font-semibold text-slate-900">{paymentSchedules.length}</span></span>
              <span className="rounded-full bg-slate-50 px-3 py-1 ring-1 ring-inset ring-slate-200">COLA announcements: <span className="font-semibold text-slate-900">{colaAnnouncements.length}</span></span>
            </div>
          </div>
          <div className="grid w-full gap-2 md:w-72">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
              <p className="text-xs font-semibold text-slate-900">How to use this hub</p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-700">
                <li>• Open a node for authoritative dates.</li>
                <li>• Use the status pill to confirm certainty.</li>
                <li>• For schedules, view month-by-month grids.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Agency Overviews Block */}
      <div className="grid sm:grid-cols-2 gap-6 mt-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 text-lg border-b border-slate-100 pb-3 mb-3">Social Security Administration</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Track official payment schedules for Social Security and SSI, alongside annual COLA announcements. 
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 text-lg border-b border-slate-100 pb-3 mb-3">VA Disability Compensation</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Track VA disability compensation payment dates and annual COLA-driven rate changes with a deterministic, statute-based calendar. Payment timing is derived directly from U.S. Code rules and adjusted for weekends and U.S. federal holidays.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-10">
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Payment Schedules</h2>
              <p className="mt-1 text-sm text-slate-600">Published, month-by-month payment calendars.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paymentSchedules.map((n) => {
              const count = Array.isArray(n.officialDates) ? n.officialDates.length : 0;
              const isVA = (n.eventName || "").toLowerCase().includes("va disability");
              return (
                <Card
                  key={n.eventId} href={`/${n.canonicalSlug}`} title={n.eventName || n.title || "Federal Schedule"}
                  subtitle={isVA ? "U.S. Department of Veterans Affairs" : "Social Security Administration"}
                  statusLabel={n.statusLabel} metaLeft={`${count} official dates`}
                />
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">COLA Announcements</h2>
              <p className="mt-1 text-sm text-slate-600">Single-date announcement events.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colaAnnouncements.map((n) => {
              const when = n.dateISO ? formatISOToLongDate(n.dateISO) : "Date TBD";
              const subtitle = n.dateISO ? formatISOToMonthYear(n.dateISO) : "Pending";
              const isVA = (n.eventName || "").toLowerCase().includes("va disability");
              return (
                <Card
                  key={n.eventId} href={`/${n.canonicalSlug}`} title={n.eventName || n.title || "Federal Announcement"}
                  subtitle={`${isVA ? "VA" : "SSA"} • ${subtitle}`}
                  statusLabel={n.statusLabel} metaLeft={when}
                />
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}