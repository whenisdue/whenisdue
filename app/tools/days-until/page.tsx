import type { Metadata } from "next";
import DaysUntilClient from "./DaysUntilClient";
import {
  makeToolMetadata,
  parseYmd,
  dateUtcFromYmd,
  nowUtcYmd,
  formatYmdUtc,
  spGet,
  webPageJsonLd,
  getSiteUrl,
} from "@/lib/toolMetadata";

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }
): Promise<Metadata> {
  const sp = await searchParams;

  const dateStr = spGet(sp, "date");
  const target = parseYmd(dateStr);

  const fromStr = spGet(sp, "from");
  const from = parseYmd(fromStr) ?? nowUtcYmd();

  const lastCalculatedUtc = new Date().toISOString();

  let resultPrefix: string | null = null;
  let desc =
    "Instantly see how many days remain until a target date. Shareable, link-based state with calm mathematical authority.";

  if (target) {
    const a = dateUtcFromYmd(from);
    const b = dateUtcFromYmd(target);
    const diffDays = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

    const prettyTarget = formatYmdUtc(b);
    const fromLabel = formatYmdUtc(a);

    if (diffDays === 0) resultPrefix = `Today is ${prettyTarget}`;
    else if (diffDays > 0) resultPrefix = `${diffDays.toLocaleString()} days until ${prettyTarget}`;
    else resultPrefix = `${Math.abs(diffDays).toLocaleString()} days since ${prettyTarget}`;

    desc = `${resultPrefix}. Calculated from ${fromLabel} (UTC date) using deterministic date math. Last calculated ${lastCalculatedUtc}.`;
  }

  return makeToolMetadata({
    toolName: "Days Until",
    pathname: "/tools/days-until",
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

  const urlWithParams = `${siteUrl}/tools/days-until${qs.toString() ? `?${qs.toString()}` : ""}`;
  const lastCalculatedUtc = new Date().toISOString();

  const jsonLd = webPageJsonLd({
    url: urlWithParams,
    name: "Days Until Calculator",
    description: "Compute days until (or since) a date with shareable URL state.",
    lastCalculatedUtc,
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <DaysUntilClient />
    </main>
  );
}
