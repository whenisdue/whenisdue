import type { Metadata } from "next";
import DeadlineCalculatorClient from "./DeadlineCalculatorClient";
import {
  makeToolMetadata,
  parseYmd,
  dateUtcFromYmd,
  formatYmdUtc,
  spGet,
  webPageJsonLd,
  getSiteUrl,
} from "../../../lib/toolMetadata";

export const dynamic = "force-dynamic";

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

type Unit = "days" | "weeks" | "months";

function addMonthsUtc(date: Date, deltaMonths: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  const targetMonth = m + deltaMonths;
  const firstOfTarget = new Date(Date.UTC(y, targetMonth, 1, 0, 0, 0, 0));
  const lastDay = new Date(
    Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, 0, 0, 0, 0, 0)
  ).getUTCDate();
  const clampedDay = Math.min(d, lastDay);

  return new Date(Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth(), clampedDay, 0, 0, 0, 0));
}

function subtractDurationUtc(deadlineUtc: Date, duration: number, unit: Unit): Date {
  const dur = clampInt(toInt(duration, 0), 0, 1_000_000);
  if (dur === 0) return new Date(deadlineUtc.getTime());

  if (unit === "days") {
    return new Date(deadlineUtc.getTime() - dur * 24 * 60 * 60 * 1000);
  }
  if (unit === "weeks") {
    return new Date(deadlineUtc.getTime() - dur * 7 * 24 * 60 * 60 * 1000);
  }
  return addMonthsUtc(deadlineUtc, -dur);
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }
): Promise<Metadata> {
  const sp = await searchParams;

  const deadlineStr = spGet(sp, "date");
  const deadlineYmd = parseYmd(deadlineStr);

  const durationStr = spGet(sp, "duration");
  const duration = clampInt(toInt(durationStr, 0), 0, 1_000_000);

  const unitRaw = spGet(sp, "unit");
  const unit: Unit = unitRaw === "weeks" || unitRaw === "months" ? unitRaw : "days";

  let resultPrefix: string | null = null;
  let desc = "Calculate the start date you need to begin work so you can finish by your deadline.";

  if (deadlineYmd && duration > 0) {
    const deadlineUtc = dateUtcFromYmd(deadlineYmd);
    const startUtc = subtractDurationUtc(deadlineUtc, duration, unit);

    const deadlineHuman = formatYmdUtc(deadlineUtc);
    const startHuman = formatYmdUtc(startUtc);

    resultPrefix = `Start on ${startHuman}`;
    desc = `Start on ${startHuman} to finish by ${deadlineHuman}. Duration: ${duration} ${unit}.`;
  }

  return makeToolMetadata({
    toolName: "When Should I Start?",
    pathname: "/tools/deadline-calculator",
    searchParams: sp,
    resultTitlePrefix: resultPrefix,
    description: desc,
  });
}

export default async function Page(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const sp = await searchParams;
  const siteUrl = getSiteUrl();

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && v.trim()) qs.set(k, v);
    else if (Array.isArray(v)) v.filter(Boolean).forEach((x) => typeof x === "string" && qs.append(k, x));
  }

  const urlWithParams = `${siteUrl}/tools/deadline-calculator${qs.toString() ? `?${qs.toString()}` : ""}`;
  const lastCalculatedUtc = new Date().toISOString();

  const jsonLd = webPageJsonLd({
    url: urlWithParams,
    name: "Deadline Calculator",
    description: "Count backward from your deadline by your expected work duration.",
    lastCalculatedUtc,
  });

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to calculate your start date from a deadline",
    description: "Count backward from your deadline by your expected work duration.",
    step: [
      { "@type": "HowToStep", name: "Set your finish-by date", text: "Pick the date you must finish by." },
      { "@type": "HowToStep", name: "Enter how long the work takes", text: "Choose a duration and unit (days, weeks, or months)." },
      { "@type": "HowToStep", name: "Read your start date", text: "The tool tells you the latest date to start." },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Does this include weekends?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. This tool uses calendar time. If you only work on weekdays, add buffer days for safety.",
        },
      },
      {
        "@type": "Question",
        name: "Why does the date sometimes look off by one day?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Timezone parsing can shift dates. This tool uses local date inputs and consistent date math to reduce drift.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <DeadlineCalculatorClient />
    </main>
  );
}