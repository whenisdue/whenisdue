import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import Script from "next/script";
import { getBaseUrl } from "@/lib/siteUrl";

export async function generateMetadata(): Promise<Metadata> {
  const manifestPath = path.join(
    process.cwd(),
    "public/assets/og/generated/manifest.json"
  );

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  const slug = "gaming/steam-summer-sale-2026";
  const ogImagePath = manifest[slug];

  const baseUrl = getBaseUrl();
  const absoluteOgImage = `${baseUrl}${ogImagePath}`;
  const canonicalUrl = `${baseUrl}/${slug}`;

  const title = "Steam Summer Sale 2026 | WhenIsDue";
  const description =
    "Confirmed date details and a live countdown to the Steam Summer Sale 2026. Timezone-aware and shareable.";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: "Steam Summer Sale 2026",
      description,
      url: canonicalUrl,
      images: [
        {
          url: absoluteOgImage,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Steam Summer Sale 2026",
      description,
      images: [absoluteOgImage],
    },
  };
}

export default function Page() {
  const baseUrl = getBaseUrl();
  const slug = "gaming/steam-summer-sale-2026";
  const canonicalUrl = `${baseUrl}/${slug}`;

  // NOTE:
  // - This page is a Server Component (no "use client").
  // - If you later add an interactive countdown, mount it inside the #countdown slot below.
  // - The content below is intentionally static + crawlable for SEO.

  const faq = [
    {
      question: "When does the Steam Summer Sale 2026 start?",
      answer:
        "This page tracks the confirmed start date once it’s published and keeps the countdown synced. If Valve hasn’t posted the date yet, we show the latest confirmed information as soon as it becomes available.",
    },
    {
      question: "What timezone is the Steam Summer Sale date in?",
      answer:
        "Steam sale start times are typically announced in a specific timezone (often Pacific Time). This page presents the date clearly and the countdown adjusts to the viewer’s local time.",
    },
    {
      question: "How long does the Steam Summer Sale usually last?",
      answer:
        "Steam seasonal sales commonly run for around two weeks. Exact end times are published by Steam, and we update the page once confirmed.",
    },
    {
      question: "Is this an official Steam page?",
      answer:
        "No. WhenIsDue is an independent utility page that summarizes confirmed dates and provides a shareable countdown.",
    },
  ] as const;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Steam Summer Sale 2026",
    url: canonicalUrl,
    description:
      "Confirmed date details and a live countdown to the Steam Summer Sale 2026. Timezone-aware and shareable.",
    isPartOf: {
      "@type": "WebSite",
      name: "WhenIsDue",
      url: baseUrl,
    },
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* JSON-LD (SEO) */}
      <Script
        id="jsonld-webpage-steam-summer-sale-2026"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <Script
        id="jsonld-faq-steam-summer-sale-2026"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="mb-10">
          <div className="text-xs tracking-[0.25em] text-gray-400">
            WHENISDUE
          </div>

          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            Steam Summer Sale 2026
          </h1>

          <p className="mt-4 max-w-2xl text-base text-gray-300">
            Confirmed date details and a live countdown. Built to be shareable,
            crawlable, and timezone-aware.
          </p>
        </div>

        {/* Countdown slot */}
        <section
          className="mb-12 rounded-2xl border border-white/10 bg-white/5 p-6"
          aria-label="Countdown"
        >
          <div className="text-sm font-semibold text-gray-200">
            Countdown
          </div>
          <p className="mt-2 text-sm text-gray-400">
            If your countdown component already exists, mount it here (keep the
            rest of the page static for SEO).
          </p>

          <div
            id="countdown"
            className="mt-5 rounded-xl border border-white/10 bg-black/40 p-5"
          >
            <div className="text-xs text-gray-400">
              Status
            </div>
            <div className="mt-1 text-lg font-semibold">
              Confirmed date and live countdown.
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Canonical URL:{" "}
            <a className="underline hover:text-gray-300" href={canonicalUrl}>
              {canonicalUrl}
            </a>
          </p>
        </section>

        {/* Key info */}
        <section className="mb-12" aria-label="Key information">
          <h2 className="text-xl font-semibold">Key details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold">What this page does</div>
              <p className="mt-2 text-sm text-gray-400">
                Tracks the confirmed date, shows a clean countdown, and keeps
                everything easy to share.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold">Timezone clarity</div>
              <p className="mt-2 text-sm text-gray-400">
                If Steam posts a timezone (often PT), we display it and the
                countdown still adapts to each visitor’s local time.
              </p>
            </div>
          </div>
        </section>

        {/* What to expect */}
        <section className="mb-12" aria-label="What to expect">
          <h2 className="text-xl font-semibold">What to expect</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-300">
            <li>Deep discounts across thousands of PC games.</li>
            <li>Daily highlights and themed deal categories.</li>
            <li>Wishlist notifications can help you catch price drops.</li>
            <li>
              Refund rules still apply—always review Steam’s policy before
              buying.
            </li>
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-12" aria-label="Frequently asked questions">
          <h2 className="text-xl font-semibold">FAQ</h2>

          <div className="mt-4 space-y-4">
            {faq.map((item) => (
              <details
                key={item.question}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <summary className="cursor-pointer text-sm font-semibold text-gray-100">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm text-gray-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Internal links (future SEO cluster) */}
        <section className="mb-12" aria-label="More countdown pages">
          <h2 className="text-xl font-semibold">More countdown pages</h2>
          <p className="mt-2 text-sm text-gray-400">
            We’re building a small library of clean, single-purpose countdown
            pages.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm hover:bg-white/10"
              href="/gaming/steam-winter-sale-2026"
            >
              Steam Winter Sale 2026 <span className="text-gray-500">→</span>
            </a>
            <a
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm hover:bg-white/10"
              href="/shopping/black-friday-2026"
            >
              Black Friday 2026 <span className="text-gray-500">→</span>
            </a>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            (These pages can be added later—links are here to establish the site
            structure early.)
          </p>
        </section>

        <footer className="border-t border-white/10 pt-8 text-xs text-gray-500">
          © 2026 WhenIsDue. Built for speed and clarity.
        </footer>
      </div>
    </main>
  );
}
