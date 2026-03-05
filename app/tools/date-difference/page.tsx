import type { Metadata } from "next";
import DateDifferenceClient from "./DateDifferenceClient";
import {
  makeToolMetadata,
  spGet,
  parseYmd,
  dateUtcFromYmd,
  getSiteUrl,
  webPageJsonLd,
} from "../../../lib/toolMetadata";

type SearchParams = Record<string, string | string[] | undefined>;

const TOOL_NAME = "Date Difference";
const PATHNAME = "/tools/date-difference";

function buildQueryString(sp: SearchParams): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") {
      if (v.trim().length > 0) params.set(k, v);
    } else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string" && item.trim().length > 0) params.append(k, item);
      }
    }
  }
  const qs = params.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

function computeDiffSummary(aYmd: string, bYmd: string): {
  days: number;
  weeks: number;
  hours: number;
  minutes: number;
} | null {
  const a = parseYmd(aYmd);
  const b = parseYmd(bYmd);
  if (!a || !b) return null;

  const aDt = dateUtcFromYmd(a);
  const bDt = dateUtcFromYmd(b);

  const diffMs = Math.abs(bDt.getTime() - aDt.getTime());
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);

  return { days, weeks, hours, minutes };
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<SearchParams> }
): Promise<Metadata> {
  const sp = await searchParams;
  const a = spGet(sp, "a");
  const b = spGet(sp, "b");

  const summary = a && b ? computeDiffSummary(a, b) : null;

  const resultTitlePrefix =
    summary && Number.isFinite(summary.days)
      ? `${summary.days.toLocaleString()} days between`
      : null;

  const description =
    summary && a && b
      ? `There are ${summary.days.toLocaleString()} days between ${a} and ${b}. That’s ${summary.weeks.toLocaleString()} weeks, or ${summary.hours.toLocaleString()} hours.`
      : "Find the difference between two dates in days, weeks, hours, and minutes. Fast, precise, and shareable.";

  return makeToolMetadata({
    toolName: TOOL_NAME,
    pathname: PATHNAME,
    searchParams: sp,
    resultTitlePrefix,
    description,
  });
}

export default async function Page(
  { searchParams }: { searchParams: Promise<SearchParams> }
) {
  const sp = await searchParams;
  const a = spGet(sp, "a");
  const b = spGet(sp, "b");

  const summary = a && b ? computeDiffSummary(a, b) : null;

  const resultTitlePrefix =
    summary && a && b
      ? `${summary.days.toLocaleString()} days between ${a} and ${b}`
      : null;

  const description =
    summary && a && b
      ? `There are ${summary.days.toLocaleString()} days between ${a} and ${b}.`
      : "Find the difference between two dates in days, weeks, hours, and minutes.";

  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${PATHNAME}${buildQueryString(sp)}`;
  const lastCalculatedUtc = new Date().toISOString();

  const jsonLd = webPageJsonLd({
    url,
    name: resultTitlePrefix ? `${resultTitlePrefix} | ${TOOL_NAME}` : `${TOOL_NAME} | WhenIsDue`,
    description,
    lastCalculatedUtc,
  });

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to calculate the difference between two dates",
    description: "Compare two dates to see how many days are between them.",
    step: [
      { "@type": "HowToStep", name: "Pick the first date", text: "Choose a first date." },
      { "@type": "HowToStep", name: "Pick the second date", text: "Choose a second date." },
      { "@type": "HowToStep", name: "Read the difference", text: "The tool shows the number of days between the two dates." },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Does this include weekends?",
        acceptedAnswer: { "@type": "Answer", text: "Yes. This tool compares dates using calendar days." },
      },
      {
        "@type": "Question",
        name: "Why can the result look off by 1 day?",
        acceptedAnswer: { "@type": "Answer", text: "Timezone parsing can shift dates. This tool uses local midnight to avoid drift." },
      },
      {
        "@type": "Question",
        name: "Is the result signed or absolute?",
        acceptedAnswer: { "@type": "Answer", text: "The main display is an absolute day count. The tool also shows which date comes first." },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <h1 className="text-4xl font-semibold tracking-tight">Date Difference</h1>
      <p className="mt-2 text-sm opacity-75">How far apart are two dates?</p>

      <DateDifferenceClient />
    </main>
  );
}