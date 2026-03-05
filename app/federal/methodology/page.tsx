import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { DeterministicBuildFailPolicy } from "../../../components/federal/DeterministicBuildFailPolicy";
import { AMOUNT_DRIFT_BUILD_FAIL_POLICY } from "../../../components/federal/AmountDriftBuildFailPolicy";

export const metadata: Metadata = {
  title: "Methodology: Federal Schedules | WhenIsDue",
  description: "How WhenIsDue.com verifies, sources, and renders federal payment schedules and announcements.",
  alternates: { canonical: "https://whenisdue.com/federal/methodology" },
};

export default function FederalMethodologyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/federal" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
          ← Back to Federal Hub
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
        <article className="max-w-none">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 mb-6">
            Methodology: How WhenIsDue.com Verifies Federal Schedules
          </h1>
          
          <p className="text-lg text-slate-700 mb-8 leading-relaxed">
            WhenIsDue.com publishes federal payment schedules as <strong className="text-slate-900">verified, deterministic reference pages</strong>. 
            For our government schedule nodes (including SSA, VA, and SNAP), our goal is simple:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-slate-700 font-medium mb-12">
            <li>Use official sources</li>
            <li>Render dates deterministically</li>
            <li>Show verification timestamps</li>
            <li>Avoid misleading structured data</li>
          </ul>

          <hr className="my-8 border-slate-200" />

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">1) What we publish (and what we don’t)</h2>
          <p className="text-slate-700 mb-4">We publish:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
            <li><strong className="text-slate-900">Payment Schedules (SCHEDULE nodes)</strong> — the official calendar of payment dates.</li>
            <li><strong className="text-slate-900">COLA Announcements (Announcement pages)</strong> — official agency announcements of annual cost-of-living adjustments.</li>
          </ul>
          <p className="text-slate-700 mb-4">We do <strong className="text-slate-900">not</strong> publish:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-10">
            <li>Predictions without explicit historical methodology</li>
            <li>Rumors or unverified dates</li>
            <li>Automatically inferred schedules not backed by official publications or statutes</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">2) Sources and provenance</h2>
          <p className="text-slate-700 mb-4">
            For each federal page, we provide an <strong className="text-slate-900">Official source</strong> link and a <strong className="text-slate-900">Last verified</strong> date.
          </p>
          <p className="text-slate-700 font-medium mb-2">Primary sources include:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
            <li>SSA “Schedule of Social Security Benefit Payments” publications (PDF calendars)</li>
            <li>SSA press releases for COLA announcements</li>
            <li>U.S. Code rules (e.g., 38 U.S.C. §5120) for VA payment timing</li>
            <li>USDA FNS issuance schedules and State DSS policy pages</li>
          </ul>
          <p className="text-slate-700 mb-10">
            Each page’s source URL is displayed and stored in the site’s underlying dataset so it can be audited.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">3) Deterministic date rendering (no rule engines on-page)</h2>
          <p className="text-slate-700 mb-4">
            For schedule pages, the displayed schedule is rendered from a static list of official dates (<strong className="text-slate-900">officialDates</strong>). The UI uses that list to power:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
            <li>“Next payment date” answer-first blocks</li>
            <li>Machine-readable tables</li>
            <li>Shareable URL states (e.g., group/month filters)</li>
          </ul>
          <p className="text-slate-700 mb-10">
            This avoids “smart” inference logic that could accidentally mislead users.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">4) Verification and update policy</h2>
          <p className="text-slate-700 mb-4">Every federal page shows:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
            <li><strong className="text-slate-900">Last verified</strong> (the date we last checked the official source)</li>
            <li><strong className="text-slate-900">Official source</strong> (the government publication, press release, or statute)</li>
          </ul>
          <p className="text-slate-700 mb-10">
            If an official source changes, the page is updated and the verification timestamp is refreshed.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">5) Schema safety (YMYL protection)</h2>
          <p className="text-slate-700 mb-4">
            Federal payment schedules and announcement pages are <strong className="text-slate-900">not treated as events</strong> in structured data.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
            <li>We use <strong className="text-slate-900">WebPage / CollectionPage</strong> as the primary schema types.</li>
            <li>We do <strong className="text-slate-900">not</strong> use <code className="bg-slate-100 px-1 py-0.5 rounded text-sm font-mono text-slate-800">schema.org/Event</code> for SSA, VA, or SNAP schedules.</li>
            <li>If we include lists in JSON-LD (e.g., ItemList), they mirror the visible table order.</li>
          </ul>
          <p className="text-slate-700 mb-10">
            This policy reduces the risk of search engines misclassifying payment schedules as “events” with start times, ticketing, attendance modes, or other misleading attributes.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">6) VA Disability Compensation Rules</h2>
          <div className="space-y-4 text-slate-700 mb-10">
            <p><strong className="text-slate-900">VA payment date rule (deterministic):</strong> VA disability compensation is paid monthly, on the first business day of the following month. If the first day is a weekend or a U.S. federal holiday, payment is issued on the last business day before the first.</p>
            <p><strong className="text-slate-900">Holiday handling:</strong> We apply U.S. federal holiday observance rules (holiday observed on Friday if it falls on Saturday; observed on Monday if it falls on Sunday). Payment dates are moved only backward (never forward) because the statute triggers a “preceding business day” adjustment.</p>
            <p><strong className="text-slate-900">Provenance + verification:</strong> Each VA schedule page includes a statutory citation (38 U.S.C. §5120(e)–(f)) as the authoritative basis for timing logic, and a “Last verified” timestamp for governance. Rate/COLA pages cite VA.gov rate tables and link to the SSA COLA announcement that drives the annual adjustment.</p>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">7) Panic-Proof Verification Layer (SNAP)</h2>
          <div className="space-y-4 text-slate-700 mb-10">
            <p>This site publishes <strong className="text-slate-900">deterministic, source-linked issuance truth</strong> for public benefit schedules. We are intentionally strict about what we will and will not claim.</p>
            
            <h3 className="font-semibold text-slate-900 pt-2">What we publish as deterministic truth</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-slate-900">Official issuance schedules</strong> (as published by the administering agency)</li>
              <li><strong className="text-slate-900">Statutory and policy rules</strong> that deterministically affect a date</li>
              <li><strong className="text-slate-900">Source provenance</strong> (a direct link to the official publisher)</li>
            </ul>

            <h3 className="font-semibold text-slate-900 pt-2">What can vary in the real world</h3>
            <p>Even when an issuance date is correct, users may experience differences due to posting time variance, balance portal latency, retail POS behavior, case-level changes (like recertification), or household changes (like moving counties). These are real-world variability factors, not evidence of a system-wide event.</p>

            <h3 className="font-semibold text-slate-900 pt-2">Strict outage policy (no rumors)</h3>
            <p>We <strong className="text-slate-900">do not</strong> claim or imply system-wide service events based on social media posts, user reports, or third-party outage trackers. We only display a service notice when an official agency notice exists and we can link directly to it.</p>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">8) Panic-Proof Verification Layer (Social Security / SSI)</h2>
          <div className="space-y-4 text-slate-700 mb-10">
            <p>This site publishes <strong className="text-slate-900">deterministic, source-linked payment timing</strong> for Social Security and SSI schedules. We are intentionally strict about what we will and will not claim.</p>
            
            <h3 className="font-semibold text-slate-900 pt-2">What we publish as deterministic truth</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-slate-900">Official payment schedules</strong> (as published by SSA in official publications)</li>
              <li><strong className="text-slate-900">Deterministic date rules</strong> reflected in official guidance (for example: SSI paid on the 1st, paid earlier when the 1st falls on a weekend or federal holiday)</li>
              <li><strong className="text-slate-900">Source provenance</strong> (direct link to the official publisher whenever possible)</li>
            </ul>

            <h3 className="font-semibold text-slate-900 pt-2">What can vary in the real world</h3>
            <p>Even when the payment date is correct, users may experience differences due to bank posting time variance, card program timing, “early deposit” marketing by banks, account or address changes, or representative payee distribution timing. These are real-world variability factors, not evidence of a system-wide event.</p>

            <h3 className="font-semibold text-slate-900 pt-2">Strict outage policy (no speculation)</h3>
            <p>We <strong className="text-slate-900">do not</strong> claim or imply service events based on social media posts, user reports, or third-party outage trackers. We only display a service notice when an official SSA notice exists and we can link directly to it.</p>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">9) Integrity Guard</h2>
          <p className="text-slate-700 mb-4">We run automated checks to confirm:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-10">
            <li>Dates are valid ISO formats</li>
            <li>Federal pages do not emit Event structured data for schedules/announcements</li>
            <li>“Last verified” displayed on the page matches the stored verification timestamp</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">10) {DeterministicBuildFailPolicy.title}</h2>
          <div className="space-y-4 text-slate-700 mb-10">
            <ul className="list-disc pl-6 space-y-2">
              {DeterministicBuildFailPolicy.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
            <p className="text-sm italic mt-4">{DeterministicBuildFailPolicy.footerNote}</p>
          </div>

          {/* NEW PHASE 8 ADDITION */}
          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">11) {AMOUNT_DRIFT_BUILD_FAIL_POLICY.title}</h2>
          <div className="space-y-4 text-slate-700 mb-10">
            {AMOUNT_DRIFT_BUILD_FAIL_POLICY.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <ul className="list-disc pl-6 space-y-2 mt-4">
              {AMOUNT_DRIFT_BUILD_FAIL_POLICY.guarantees.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>

          <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Important note (official interpretation)</h2>
            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              WhenIsDue.com is an informational reference service. Official policy questions should be directed to the corresponding federal agency (e.g., SSA, VA, or state DSS).
            </p>
            <p className="text-slate-700 text-sm leading-relaxed">
              If you spot a discrepancy, always consult the <strong className="text-slate-900">Official source</strong> link shown on the page.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}