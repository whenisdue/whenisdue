import type { Metadata } from "next";
import BufferDaysClient from "./BufferDaysClient";
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

type Unit = "days" | "weeks" | "months";

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMonthsUtc(date: Date, deltaMonths: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();

  const targetMonthIndex = m + deltaMonths;
  const firstOfTarget = new Date(Date.UTC(y, targetMonthIndex, 1, 0, 0, 0, 0));

  const lastDayOfTarget = new Date(
    Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth() + 1, 0, 0, 0, 0, 0)
  ).getUTCDate();

  const clampedDay = Math.min(d, lastDayOfTarget);

  return new Date(Date.UTC(firstOfTarget.getUTCFullYear(), firstOfTarget.getUTCMonth(), clampedDay, 0, 0, 0, 0));
}

function computeStartUtc(finishByUtc: Date, workTakes: number, unit: Unit, bufferDays: number): Date {
  const buf = Math.max(0, Math.min(1_000_000, bufferDays));
  const duration = Math.max(0, Math.min(1_000_000, workTakes));

  const finishMinusBuffer = addDaysUtc(finishByUtc, -buf);

  if (unit === "days") return addDaysUtc(finishMinusBuffer, -duration);
  if (unit === "weeks") return addDaysUtc(finishMinusBuffer, -(duration * 7));
  return addMonthsUtc(finishMinusBuffer, -duration);
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }
): Promise<Metadata> {
  const sp = await searchParams;

  const dateStr = spGet(sp, "date");
  const durationStr = spGet(sp, "duration");
  const unitRaw = spGet(sp, "unit");
  const bufferStr = spGet(sp, "buffer");

  const finishBy = parseYmd(dateStr);
  const duration = clampInt(toInt(durationStr, 0), 0, 1_000_000);
  const buffer = clampInt(toInt(bufferStr, 0), 0, 1_000_000);
  const unit: Unit = unitRaw === "weeks" || unitRaw === "months" ? unitRaw : "days";

  let resultPrefix: string | null = null;
  let desc = "Add safety days so you don’t cut it close.";

  if (finishBy && duration > 0) {
    const finishByUtc = dateUtcFromYmd(finishBy);
    const startUtc = computeStartUtc(finishByUtc, duration, unit, buffer);

    const finishHuman = formatYmdUtc(finishByUtc);
    const startHuman = formatYmdUtc(startUtc);

    resultPrefix = `Start on ${startHuman}`;
    desc = `Start on ${startHuman} to finish by ${finishHuman}. Work takes ${duration} ${unit}. Safety days: ${buffer}.`;
  }

  return makeToolMetadata({
    toolName: "Buffer Days",
    pathname: "/tools/buffer-days",
    searchParams: sp,
    resultTitlePrefix: resultPrefix,
    description: desc,
  });
}

export default async function BufferDaysPage(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const sp = await searchParams;
  const siteUrl = getSiteUrl();

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && v.trim()) qs.set(k, v);
    else if (Array.isArray(v)) v.filter(Boolean).forEach((x) => typeof x === "string" && qs.append(k, x));
  }

  const urlWithParams = `${siteUrl}/tools/buffer-days${qs.toString() ? `?${qs.toString()}` : ""}`;
  const lastCalculatedUtc = new Date().toISOString();

  const jsonLd = webPageJsonLd({
    url: urlWithParams,
    name: "Buffer Days Calculator",
    description: "Add safety days so you don’t cut it close.",
    lastCalculatedUtc,
  });

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to add buffer days and find your start date",
    description: "Add safety days, then count backward to find the latest start date.",
    step: [
      { "@type": "HowToStep", name: "Enter finish-by date", text: "Pick the date you must finish by." },
      { "@type": "HowToStep", name: "Enter work duration", text: "Type how long the work takes and choose a unit." },
      { "@type": "HowToStep", name: "Add safety days", text: "Add extra days for delays, weekends, or review time." },
      { "@type": "HowToStep", name: "Read the start date", text: "The tool shows the latest date you should start." },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What are buffer days?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Buffer days are extra calendar days added to protect your deadline from delays.",
        },
      },
      {
        "@type": "Question",
        name: "Are weekends included?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. This tool uses calendar time. If you only work weekdays, increase the safety days.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <BufferDaysClient />
    </main>
  );
}