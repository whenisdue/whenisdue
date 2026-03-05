import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react"; // ADDED: React Suspense Boundary

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

// --- PHASE 11 IMPORTS ---
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

function getStatusKind(evt: EventRecord): "confirmed" | "expected" | "rumor" {
  const label = (evt.statusLabel ?? "").trim().toUpperCase();
  if (label === "CONFIRMED") return "confirmed";
  if (label === "EXPECTED") return "expected";
  if (label === "RUMOR") return "rumor";
  const dueIso = evt.dueAt ?? evt.dueDate ?? evt.dateISO;
  if (isNonEmptyString(dueIso) && isNonEmptyString(evt.sourceUrl) && isNonEmptyString(evt.lastVerifiedUtc)) return "confirmed";
  if (isNonEmptyString(dueIso) || isNonEmptyString(evt.dateLine)) return "expected";
  return "rumor";
}

function isNonEmptyString(v: unknown): v is string { return typeof v === "string" && v.trim().length > 0; }
function normalizeSeg(v: string): string { return v.trim().toLowerCase(); }
function getSiteUrl(): string { return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, ""); }

function splitCanonicalSlug(canonicalSlug: string): { category: string; slug: string } | null {
  const cleaned = canonicalSlug.replace(/^\/+|\/+$/g, "");
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length !== 2) return null;
  return { category: normalizeSeg(parts[0]), slug: normalizeSeg(parts[1]) };
}

function deriveRouteFields(e: EventRecord): EventRecord {
  if ((!isNonEmptyString(e.category) || !isNonEmptyString(e.slug)) && isNonEmptyString(e.canonicalSlug)) {
    const parts = splitCanonicalSlug(e.canonicalSlug);
    if (parts) return { ...e, category: parts.category, slug: parts.slug };
  }
  const category = isNonEmptyString(e.category) ? normalizeSeg(e.category) : e.category;
  const slug = isNonEmptyString(e.slug) ? normalizeSeg(e.slug) : e.slug;
  const canonicalSlug = isNonEmptyString(e.canonicalSlug) ? e.canonicalSlug.replace(/^\/+|\/+$/g, "") : isNonEmptyString(category) && isNonEmptyString(slug) ? `${category}/${slug}` : e.canonicalSlug;
  return { ...e, category, slug, canonicalSlug };
}

function pickDueIso(e: EventRecord): string | null {
  const v = e.dueAt ?? e.dueDate ?? e.dateISO ?? null;
  return isNonEmptyString(v) ? v.trim() : null;
}

function isoToDateOnly(iso: string | null): string | null {
  if (!isNonEmptyString(iso)) return null;
  const m = /^([0-9]{4}-[0-9]{2}-[0-9]{2})/.exec(iso.trim());
  return m ? m[1] : null;
}

function parseIsoOrNull(v: unknown): string | null {
  if (!isNonEmptyString(v)) return null;
  const s = v.trim();
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(s) ? s : null;
}

function shouldNoindex(evt: EventRecord): boolean {
  const label = (evt.statusLabel ?? "").toLowerCase();
  return label.includes("rumor") || label.includes("unverified") || label.includes("speculation");
}

function buildBreadcrumbJsonLd(args: { siteUrl: string; category: string; slug: string; displayTitle: string; }): Record<string, unknown> {
  const { siteUrl, category, slug, displayTitle } = args;
  const cat = normalizeSeg(category);
  const slg = normalizeSeg(slug);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: cat.toUpperCase(), item: `${siteUrl}/${cat}` },
      { "@type": "ListItem", position: 3, name: displayTitle, item: `${siteUrl}/${cat}/${slg}` },
    ],
  };
}

async function loadEvents(): Promise<EventRecord[]> {
  const jsonPath = path.resolve(process.cwd(), "data/events.json");
  const raw = await fs.readFile(jsonPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(Boolean).map((e) => deriveRouteFields(e as EventRecord));
}

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

async function loadProvenanceRegistry() {
  try {
    const jsonPath = path.resolve(process.cwd(), "data/provenanceRegistry.json");
    const raw = await fs.readFile(jsonPath, "utf8");
    return JSON.parse(raw);
  } catch (e) { return null; }
}

async function loadStateOverrides() {
  try {
    const jsonPath = path.resolve(process.cwd(), "data/stateOverrideRegistry.snap.json");
    const raw = await fs.readFile(jsonPath, "utf8");
    return JSON.parse(raw);
  } catch (e) { return null; }
}

async function loadCouplingRegistry() {
  try {
    const jsonPath = path.resolve(process.cwd(), "data/couplingSignalRegistry.json");
    const raw = await fs.readFile(jsonPath, "utf8");
    return JSON.parse(raw);
  } catch (e) { return null; }
}

async function loadEligibilityRegistry() {
  try {
    const jsonPath = path.resolve(process.cwd(), "data/eligibilitySignalRegistry.json");
    const raw = await fs.readFile(jsonPath, "utf8");
    return JSON.parse(raw);
  } catch (e) { return null; }
}

async function getEvent(category: string, slug: string): Promise<EventRecord | null> {
  const cat = normalizeSeg(category);
  const slg = normalizeSeg(slug);
  const key = `${cat}/${slg}`;
  const events = await loadEvents();
  const byPair = events.find((e) => e?.category === cat && e?.slug === slg);
  if (byPair) return byPair;
  const byCanonical = events.find((e) => isNonEmptyString(e?.canonicalSlug) && normalizeSeg(e.canonicalSlug) === key);
  return byCanonical ?? null;
}

export async function generateStaticParams() {
  const events = await loadEvents();
  return events.filter((e) => isNonEmptyString(e.category) && isNonEmptyString(e.slug)).map((e) => ({ category: e.category!, slug: e.slug! }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const evt = await getEvent(category, slug);
  if (!evt) return { title: "Not found", robots: { index: false, follow: false } };
  const displayTitle = evt.title ?? evt.eventName ?? `${category}/${slug}`;
  const title = `${displayTitle} — When Is Due?`;
  const description = evt.description ?? "Countdown and due-date info for upcoming events, releases, sales, and deadlines.";
  const canonicalPath = isNonEmptyString(evt.canonicalSlug) ? `/${evt.canonicalSlug.replace(/^\/+|\/+$/g, "")}` : `/${normalizeSeg(category)}/${normalizeSeg(slug)}`;
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${canonicalPath}`;
  const noindex = shouldNoindex(evt);
  return {
    title, description, alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description, url, siteName: "WhenIsDue.com", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EventPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const evt = await getEvent(category, slug);
  if (!evt) notFound();
  
  const allEvents = await loadEvents();
  const historicalData = evt.seriesKey ? aggregateSeries(allEvents, evt.seriesKey) : null;
  const cci = historicalData?.cci;
  const showCci = cci?.eligible;
  const statusKind = getStatusKind(evt);
  const requestedKey = `${normalizeSeg(category)}/${normalizeSeg(slug)}`;
  const canonicalKey = isNonEmptyString(evt.canonicalSlug) ? normalizeSeg(evt.canonicalSlug.replace(/^\/+|\/+$/g, "")) : requestedKey;
  if (canonicalKey && canonicalKey !== requestedKey) permanentRedirect(`/${canonicalKey}`);
  
  const displayTitle = evt.title ?? evt.eventName ?? `${category}/${slug}`;
  const dueIso = pickDueIso(evt);
  const dueDateOnly = isoToDateOnly(dueIso);
  const pageCategory = normalizeSeg(evt.category ?? category).toUpperCase();
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/${canonicalKey}`;
  const sourceUrl = isNonEmptyString(evt.sourceUrl) ? evt.sourceUrl.trim() : null;
  const lastVerifiedUtc = parseIsoOrNull(evt.lastVerifiedUtc);

  let activeProgram: "SNAP" | "SSA" | "VA" | null = null;
  let dynamicStateCode: string | null = null;

  const lowerId = evt.eventId?.toLowerCase() || "";
  const lowerTitle = (evt.title || evt.eventName || "").toLowerCase();
  
  if (lowerId.includes("snap") || lowerTitle.includes("snap") || lowerTitle.includes("calfresh")) {
    activeProgram = "SNAP";
    const stateMatch = /^snap-([a-z]{2})-/i.exec(lowerId);
    if (stateMatch) dynamicStateCode = stateMatch[1].toUpperCase();
  } else if (lowerId.includes("ssa") || lowerId.includes("ssi") || lowerTitle.includes("social security") || lowerTitle.includes("ssi")) {
    activeProgram = "SSA";
  } else if (lowerId.includes("va-") || lowerTitle.includes("va disability") || lowerTitle.includes("veterans")) {
    activeProgram = "VA";
  }

  const catalogData = await loadAnomalyCatalog(activeProgram);
  const registryData = await loadProvenanceRegistry();
  const stateOverridesData = await loadStateOverrides();
  const couplingRegData = await loadCouplingRegistry();
  const eligibilityRegData = await loadEligibilityRegistry();

  const isoDateOnlyStr = (d: Date): string => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const now = new Date();
  const todayLocal = isoDateOnlyStr(now);
  const yesterdayLocal = isoDateOnlyStr(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  
  let scheduledDateLocal = "";
  let gapMonthData: any = undefined;
  let portalFrictionData: any = undefined;
  let amountFrictionData: any = undefined;

  if (evt.officialDates && evt.officialDates.length > 0) {
    const futureDates = evt.officialDates.filter(d => d.date >= todayLocal).sort((a,b) => a.date.localeCompare(b.date));
    const targetRow = futureDates.length > 0 ? futureDates[0] : evt.officialDates[evt.officialDates.length-1];
    scheduledDateLocal = targetRow.date;

    if (activeProgram === "SSA") {
      portalFrictionData = { show: true };
      amountFrictionData = { ssa: true };
      
      const isSSI = lowerTitle.includes("ssi");
      const isSSA3 = lowerTitle.includes("3rd") || lowerTitle.includes("pre-1997");

      if ((isSSI || isSSA3) && targetRow.month && targetRow.date) {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const bMonthIdx = monthNames.indexOf(targetRow.month);

        if (bMonthIdx !== -1) {
          const issuedParts = targetRow.date.split("-").map(Number);
          const issuedOnDate = new Date(Date.UTC(issuedParts[0], issuedParts[1] - 1, issuedParts[2]));

          let bYear = issuedOnDate.getUTCFullYear();
          if (issuedOnDate.getUTCMonth() === 11 && bMonthIdx === 0) bYear++;

          const benefitMonthStart = new Date(Date.UTC(bYear, bMonthIdx, 1));
          
          const isGapMonth =
            (issuedOnDate.getUTCFullYear() !== benefitMonthStart.getUTCFullYear() ||
             issuedOnDate.getUTCMonth() !== benefitMonthStart.getUTCMonth()) &&
            issuedOnDate.getTime() < benefitMonthStart.getTime();

          if (isGapMonth) {
            const perceivedDate = new Date(Date.UTC(bYear, bMonthIdx, isSSI ? 1 : 3));
            const nextRowIdx = evt.officialDates.findIndex(r => r === targetRow) + 1;
            const nextRow = evt.officialDates[nextRowIdx];
            
            let nextISO = "";
            if (nextRow && nextRow.date) {
              nextISO = nextRow.date;
            } else {
              const nextMonth = new Date(Date.UTC(bYear, bMonthIdx + 1, isSSI ? 1 : 3));
              nextISO = isoDateOnlyStr(nextMonth);
            }

            gapMonthData = {
              isGapMonth: true,
              programLabel: isSSI ? "SSI" : "Social Security",
              benefitMonthLabel: `${targetRow.month} ${bYear}`,
              issuedOnISO: targetRow.date,
              perceivedMissingOnISO: isoDateOnlyStr(perceivedDate),
              nextScheduledISO: nextISO
            };
          }
        }
      }
    } else if (activeProgram === "SNAP") {
      amountFrictionData = { snap: true };
    }
  }

  let couplingHintsProps: any[] = [];
  if (activeProgram && couplingRegData && Array.isArray(couplingRegData.couplings)) {
    const rawHints = deriveCouplingHints({
      pageProgram: activeProgram,
      pageTopic: "payment_schedule", 
      nowMsUtc: now.getTime()
    });

    couplingHintsProps = rawHints.map(rh => {
      const regEntry = couplingRegData.couplings.find((c: any) => c.couplingId === rh.couplingId);
      return {
        couplingId: rh.couplingId,
        tier: rh.tier,
        evidenceRefs: regEntry ? [regEntry.citationLabel] : []
      };
    }).filter(h => h.evidenceRefs.length > 0); 
  }

  const eligCtx: PageContext = {
    pageProgram: activeProgram ? activeProgram.toLowerCase() : "unknown",
    pageKind: "schedule", 
    jurisdiction: dynamicStateCode || "US",
  };
  const nowUtcMs = Date.now();
  const eligibilityGuards = getActiveEligibilityGuards({
    registry: eligibilityRegData,
    ctx: eligCtx,
    nowUtcMs,
  });

  const anomalyCtx = activeProgram ? {
    program: activeProgram,
    stateCode: dynamicStateCode,
    isScheduledDateToday: scheduledDateLocal === todayLocal,
    isScheduledDateYesterday: scheduledDateLocal === yesterdayLocal,
    userExpectedDeposit: true, 
    benefitTypeHint: activeProgram === "SSA" ? (lowerTitle.includes("ssi") ? "SSI" : "Social Security") : undefined,
    gapMonth: gapMonthData,
    portalFriction: portalFrictionData,
    amountFriction: amountFrictionData
  } : null;

  const sameAs: string[] = [];
  if (sourceUrl) sameAs.push(sourceUrl);
  const statusLower = (evt.statusLabel ?? "").toLowerCase();
  const eventStatus = statusLower.includes("cancel") ? "https://schema.org/EventCancelled" : statusLower.includes("postpon") || statusLower.includes("delay") ? "https://schema.org/EventPostponed" : "https://schema.org/EventScheduled";
  
  const fullDescription = (evt.description ?? "Countdown and due-date info for upcoming events, releases, sales, and deadlines.") + (statusKind !== "confirmed" && evt.patternReasoning ? ` ${evt.patternReasoning}` : "") + (historicalData ? ` Historically occurred in ${historicalData.mostCommonMonth} in ${historicalData.monthFrequency} confirmed cycles.` : "") + (showCci && statusKind !== "confirmed" ? ` CCI: ${cci!.cci} (${cci!.tier}).` : "");
  
  const isFederal = normalizeSeg(evt.category ?? category) === "federal";
  const isExplicitlyExpected = (evt.statusLabel ?? "").trim().toUpperCase() === "EXPECTED";

  let distribution: Parameters<typeof webPageJsonLd>[0]["distribution"];
  if (!isFederal && isExplicitlyExpected && cci && cci.cycleCount >= 3) {
    distribution = { cciScore: cci.cci, cycleCount: cci.cycleCount, windowDays: cci.windowDays, p10Date: cci.p10Date, p50Date: cci.p50Date, p90Date: cci.p90Date };
  }
  
  const rawWebPageSchema = webPageJsonLd({ url: canonicalUrl, name: displayTitle, description: fullDescription, distribution });
  let finalWebPageSchema = rawWebPageSchema;

  if (isFederal && sourceUrl) {
    try {
      const schemaObj = JSON.parse(rawWebPageSchema);
      const pubName = getFederalPublisher(sourceUrl);
      schemaObj.publisher = { "@type": "Organization", "name": pubName };
      schemaObj.isBasedOn = { "@type": "CreativeWork", "name": "Official source", "url": sourceUrl };
      if (lastVerifiedUtc) {
        schemaObj.dateModified = lastVerifiedUtc.split("T")[0];
      }
      finalWebPageSchema = JSON.stringify(schemaObj);
    } catch (e) { console.error("Failed to parse webPageSchema"); }
  }
  
  const eventJsonLd: Record<string, unknown> | null = (!isFederal && dueIso) ? {
    "@context": "https://schema.org", "@type": "Event", name: displayTitle, description: fullDescription, startDate: dueIso, eventStatus, eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode", location: { "@type": "VirtualLocation", url: canonicalUrl }, url: canonicalUrl, isAccessibleForFree: true, ...(sameAs.length ? { sameAs } : {}),
    ...(lastVerifiedUtc || evt.confidenceScore !== undefined || showCci ? {
      additionalProperty: [
        ...(lastVerifiedUtc ? [{ "@type": "PropertyValue", name: "lastVerifiedUtc", value: lastVerifiedUtc }] : []),
        ...(evt.confidenceScore !== undefined ? [{ "@type": "PropertyValue", name: "confidenceScore", value: evt.confidenceScore }] : []),
        ...(showCci ? [{ "@type": "PropertyValue", name: "Cadence Confidence Index", value: cci!.cci, minValue: 0, maxValue: 1, unitText: "0-1", description: `Derived from ${cci!.cycleCount} cycles.`, valueReference: `${siteUrl}/methodology` }] : []),
      ],
    } : {}),
  } : null;
  
  const breadcrumbJsonLd = buildBreadcrumbJsonLd({ siteUrl, category: evt.category ?? category, slug: evt.slug ?? slug, displayTitle });

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {eventJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} /> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: finalWebPageSchema }} />
      
      {/* STATIC SEO CONTENT */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wide opacity-60">{pageCategory}</span>
        {evt.statusLabel ? <span className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-xs font-semibold tracking-wide opacity-80">{evt.statusLabel}</span> : null}
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{displayTitle}</h1>

      {/* SUSPENSE SHIELD FOR CLIENT HOOKS */}
      <Suspense fallback={<div className="mt-12 p-8 border border-white/10 rounded-xl text-center text-sm opacity-50 animate-pulse">Loading verified schedule data...</div>}>
        <FederalSnapshot event={evt} cci={cci} />

        {eligibilityGuards.length > 0 && (
          <div className="mt-6 mb-6">
            <EligibilityExpansionGuardBlock guards={eligibilityGuards} />
          </div>
        )}
        
        {evt.eventType === "SCHEDULE" && evt.officialDates && evt.officialDates.length > 0 ? (
          <>
            {evt.eventId?.startsWith("snap-") ? (
              <SnapNextBenefitBlock dates={evt.officialDates} eventId={evt.eventId} />
            ) : (
              <NextPaymentAnswerBlock dates={evt.officialDates} />
            )}
            <ScheduleTable dates={evt.officialDates} />

            {couplingHintsProps.length > 0 && (
               <div className="mt-8">
                 <CrossProgramCouplingBlock hints={couplingHintsProps} />
               </div>
            )}

            {activeProgram && anomalyCtx && catalogData && (
              <BenefitAnomalyBlock 
                catalog={catalogData}
                ctx={anomalyCtx as any}
                stateOverrides={stateOverridesData}
                resolveProvenance={(key) => {
                  if (registryData && registryData[key]) {
                    return { url: registryData[key].url, publisher: registryData[key].publisher, label: registryData[key].label };
                  }
                  return null;
                }}
              />
            )}
          </>
        ) : (
          <div className="mt-10">
            {dueIso ? <Countdown targetIso={dueIso} /> : (
              <div className="mt-6"><div className="text-5xl font-semibold tracking-tight">Date not confirmed</div><div className="mt-3 text-sm opacity-75">Official start time not yet confirmed.</div></div>
            )}
          </div>
        )}
        
        {statusKind !== "confirmed" && showCci ? <CadenceSnapshot data={historicalData} /> : null}
        
        <PatternLogicBlock statusKind={statusKind} confidenceScore={evt.confidenceScore} patternReasoning={evt.patternReasoning} />
        <HistoricalPatternBlock data={historicalData} />
        <TemporalMesh currentEvent={evt} allEvents={allEvents} />

        <SnapExplanationCompact eventId={evt.eventId || ""} eventName={evt.eventName || ""} sourceLabel="USDA FNS" />
        <FederalProvenanceBlock event={evt} />
        <VerificationBlock statusLabel={evt.statusLabel} sourceUrl={evt.sourceUrl} source={evt.source} lastVerifiedUtc={evt.lastVerifiedUtc} verificationMethod={evt.verificationMethod} nextScheduledCheck={evt.nextScheduledCheck} />
      </Suspense>
    </main>
  );
}