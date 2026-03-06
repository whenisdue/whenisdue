import { prisma } from "../../../lib/prisma"; 
import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react"; 

// Component Imports
import Countdown from "../../../components/countdown/Countdown";
import VerificationBlock from "../../../components/verification/VerificationBlock";
import PatternLogicBlock from "../../../components/pattern/PatternLogicBlock";
import HistoricalPatternBlock from "../../../components/pattern/HistoricalPatternBlock";
import CadenceSnapshot from "../../../components/pattern/CadenceSnapshot";
import ScheduleTable from "../../../components/ScheduleTable";
import FederalSnapshot from "../../../components/federal/FederalSnapshot";
import TemporalMesh from "../../../components/federal/TemporalMesh";
import NextPaymentAnswerBlock from "../../../components/federal/NextPaymentAnswerBlock";
import SnapNextBenefitBlock from "../../../components/federal/SnapNextBenefitBlock";
import { SnapExplanationCompact } from "../../../components/federal/SnapExplanationCompact";
import FederalProvenanceBlock, { getFederalPublisher } from "../../../components/federal/FederalProvenanceBlock";
import BenefitAnomalyBlock from "../../../components/federal/BenefitAnomalyBlock";
import { CrossProgramCouplingBlock } from "../../../components/federal/CrossProgramCouplingBlock";
import { deriveCouplingHints } from "../../../lib/CouplingHintsRules";
import { aggregateSeries } from "../../../lib/seriesAggregation";
import { webPageJsonLd } from "../../../lib/toolMetadata";
import { getActiveEligibilityGuards, type PageKind, type PageContext } from "../../../lib/EligibilityGuardRules";
import { EligibilityExpansionGuardBlock } from "../../../components/federal/EligibilityExpansionGuardBlock";

type EventRecord = {
  category?: string;
  slug?: string;
  canonicalSlug?: string;
  title?: string;
  eventName?: string;
  description?: string;
  dateLine?: string;
  statusLabel?: string;
  footerLine?: string;
  dueAt?: string;
  dueDate?: string;
  dateISO?: string;
  eventType?: "EVENT" | "ANNOUNCEMENT" | "SCHEDULE";
  officialDates?: { month?: string; date: string; group?: string }[];
  sourceUrl?: string; 
  source?: string; 
  lastVerifiedUtc?: string;
  verificationMethod?: string;
  nextScheduledCheck?: string;
  updatedAt?: string;
  createdAt?: string;
  confidenceScore?: number;
  patternReasoning?: string;
  seriesKey?: string;
  eventId?: string;
};

// --- DATABASE MAPPING LOGIC ---

function mapDbToRecord(dbEvent: any): EventRecord {
  return {
    title: dbEvent.title,
    eventName: dbEvent.title,
    slug: dbEvent.slug,
    category: dbEvent.category.toLowerCase(),
    canonicalSlug: `${dbEvent.category.toLowerCase()}/${dbEvent.slug}`,
    description: dbEvent.seoDescription || undefined,
    dueAt: dbEvent.dueAt?.toISOString() || dbEvent.expectedAt?.toISOString(),
    statusLabel: dbEvent.status,
    seriesKey: dbEvent.seriesKey || undefined,
    sourceUrl: dbEvent.sourceUrl || undefined,
    lastVerifiedUtc: dbEvent.lastVerified?.toISOString(),
    updatedAt: dbEvent.updatedAt.toISOString(),
    createdAt: dbEvent.createdAt.toISOString(),
    eventId: dbEvent.slug, 
    eventType: dbEvent.category === "FEDERAL" ? "SCHEDULE" : "EVENT",
    officialDates: [], 
  };
}

async function getEvent(category: string, slug: string): Promise<EventRecord | null> {
  const dbEvent = await (prisma as any).event.findUnique({
    where: { slug: slug.toLowerCase() }
  });

  if (!dbEvent) return null;
  return mapDbToRecord(dbEvent);
}

// --- HELPERS ---

function getStatusKind(evt: EventRecord): "confirmed" | "expected" | "rumor" {
  const label = (evt.statusLabel ?? "").trim().toUpperCase();
  if (label === "CONFIRMED") return "confirmed";
  if (label === "EXPECTED") return "expected";
  return "rumor";
}

function isNonEmptyString(v: unknown): v is string { return typeof v === "string" && v.trim().length > 0; }
function normalizeSeg(v: string): string { return v.trim().toLowerCase(); }
function getSiteUrl(): string { return (process.env.NEXT_PUBLIC_SITE_URL || "https://whenisdue.com").replace(/\/+$/, ""); }

async function loadAnomalyCatalog(program: string | null) {
  if (!program) return null;
  try {
    const name = program === "SSA" ? "anomalyCatalog.ssa.json" : 
                 program === "VA" ? "anomalyCatalog.va.json" : 
                 "anomalyCatalog.snap.json";
    const jsonPath = path.resolve(process.cwd(), `data/${name}`);
    const raw = await fs.readFile(jsonPath, "utf8");
    return JSON.parse(raw);
  } catch (e) { return null; }
}

// --- NEXT.JS EXPORTS ---

export async function generateStaticParams() {
  const events = await (prisma as any).event.findMany({
    select: { category: true, slug: true }
  });
  return events.map((e: any) => ({ 
    category: e.category.toLowerCase(), 
    slug: e.slug 
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const evt = await getEvent(category, slug);
  if (!evt) return { title: "Not found", robots: { index: false, follow: false } };
  
  const displayTitle = evt.title ?? `${category}/${slug}`;
  const title = `${displayTitle} — When Is Due?`;
  const description = evt.description ?? "Countdown and due-date info for upcoming events.";
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/${evt.category}/${evt.slug}`;
  
  return {
    title, description, alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { title, description, url, siteName: "WhenIsDue.com", type: "website" },
  };
}

export default async function EventPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const evt = await getEvent(category, slug);
  if (!evt) notFound();
  
  const dbAllEvents = await (prisma as any).event.findMany();
  const allEvents = dbAllEvents.map(mapDbToRecord);

  const historicalData = evt.seriesKey ? aggregateSeries(allEvents, evt.seriesKey) : null;
  const cci = historicalData?.cci;
  const statusKind = getStatusKind(evt);
  
  const displayTitle = evt.title ?? `${category}/${slug}`;
  const dueIso = evt.dueAt || null;

  let activeProgram: "SNAP" | "SSA" | "VA" | null = null;
  const lowerTitle = (evt.title || "").toLowerCase();
  
  if (lowerTitle.includes("snap") || lowerTitle.includes("calfresh")) {
    activeProgram = "SNAP";
  } else if (lowerTitle.includes("ssa") || lowerTitle.includes("ssi") || lowerTitle.includes("social security")) {
    activeProgram = "SSA";
  } else if (lowerTitle.includes("va-") || lowerTitle.includes("va disability")) {
    activeProgram = "VA";
  }

  const catalogData = await loadAnomalyCatalog(activeProgram);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{displayTitle}</h1>

      <Suspense fallback={<div className="mt-12 p-8 border border-white/10 rounded-xl text-center text-sm opacity-50 animate-pulse">Loading verified schedule data...</div>}>
        {/* SAFETY CHECK: Only render the snapshot if we have dates */}
{evt.officialDates && evt.officialDates.length > 0 && (
  <FederalSnapshot event={evt} cci={cci} />
)}        
        {/* SAFETY CHECK: Only render the table if we actually have dates to show */}
        {evt.eventType === "SCHEDULE" && evt.officialDates && evt.officialDates.length > 0 ? (
          <ScheduleTable dates={evt.officialDates} />
        ) : (
          <div className="mt-10 p-8 border border-white/5 bg-zinc-900/30 rounded-2xl text-center">
            <p className="text-zinc-500 text-sm font-medium tracking-tight">Official 2026 schedule data is currently being verified.</p>
          </div>
        )}

        <div className="mt-10">
          {dueIso ? (
            <Countdown targetIso={dueIso} />
          ) : (
            <div className="mt-6 text-xl font-medium tracking-tight opacity-70">
              Date not confirmed
            </div>
          )}
        </div>
        
        <VerificationBlock statusLabel={evt.statusLabel} sourceUrl={evt.sourceUrl} />
      </Suspense>
    </main>
  );
}