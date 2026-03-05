import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Transparency Whitepaper | WhenIsDue",
  description: "The Physics of the WhenIsDue Engine: Determinism, Fail-Closed Logic, and No Inference.",
  alternates: { canonical: "https://whenisdue.com/transparency/whitepaper" },
};

export default function WhitepaperPage() {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://whenisdue.com/#org",
      name: "WhenIsDue",
      url: "https://whenisdue.com/",
      description: "Deterministic benefit timing reference with build-time integrity enforcement and public transparency artifacts.",
      publishingPrinciples: "https://whenisdue.com/transparency/whitepaper",
      foundingDate: "2026-02-20",
      knowsAbout: [
        "Social Security",
        "Supplemental Security Income",
        "SNAP",
        "EBT",
        "public benefits schedules"
      ],
      sameAs: [],
      hasPart: [
        { "@id": "https://whenisdue.com/transparency/publicMethodologyLedger.json#doc" },
        { "@id": "https://whenisdue.com/transparency/guardStatusManifest.json#doc" },
        { "@id": "https://whenisdue.com/transparency/provenanceExport.schema.json#doc" }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://whenisdue.com/#website",
      url: "https://whenisdue.com/",
      name: "WhenIsDue",
      publisher: { "@id": "https://whenisdue.com/#org" },
      inLanguage: "en"
    },
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": "https://whenisdue.com/transparency/publicMethodologyLedger.json#doc",
      name: "Public Methodology Ledger",
      url: "https://whenisdue.com/transparency/publicMethodologyLedger.json",
      isPartOf: { "@id": "https://whenisdue.com/#website" },
      publisher: { "@id": "https://whenisdue.com/#org" },
      datePublished: "2026-02-28",
      inLanguage: "en",
      encodingFormat: "application/json"
    },
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": "https://whenisdue.com/transparency/guardStatusManifest.json#doc",
      name: "Guard Status Manifest",
      url: "https://whenisdue.com/transparency/guardStatusManifest.json",
      isPartOf: { "@id": "https://whenisdue.com/#website" },
      publisher: { "@id": "https://whenisdue.com/#org" },
      datePublished: "2026-02-28",
      inLanguage: "en",
      encodingFormat: "application/json"
    },
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": "https://whenisdue.com/transparency/provenanceExport.schema.json#doc",
      name: "Provenance Export Schema",
      url: "https://whenisdue.com/transparency/provenanceExport.schema.json",
      isPartOf: { "@id": "https://whenisdue.com/#website" },
      publisher: { "@id": "https://whenisdue.com/#org" },
      datePublished: "2026-02-28",
      inLanguage: "en",
      encodingFormat: "application/schema+json"
    }
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="mb-6">
        <Link href="/" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
          ← Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
        <article className="max-w-none">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 mb-6">
            Transparency Whitepaper: The Physics of the WhenIsDue Engine
          </h1>
          
          <p className="text-lg text-slate-700 mb-8 leading-relaxed">
            <strong className="text-slate-900">Purpose:</strong> This document explains how WhenIsDue produces benefit schedules and user-facing explanations <strong className="text-slate-900">without inference</strong>. We publish this so that readers, auditors, and answer engines can verify our boundaries.
          </p>

          <hr className="my-8 border-slate-200" />

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">1) Core Claim: Deterministic or Fail-Closed</h2>
          <p className="text-slate-700 mb-4">WhenIsDue operates on a single rule:</p>
          <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-800 mb-4 bg-slate-50 py-3 pr-2 rounded-r">
            If we cannot prove a claim with pinned anchors, we do not publish it.
          </blockquote>
          <p className="text-slate-700 mb-10">
            This is enforced at <strong className="text-slate-900">build time</strong>, not at runtime. <br />
            <strong className="text-slate-900">Why build time?</strong> Because a runtime &ldquo;best guess&rdquo; becomes a hidden hallucination risk in YMYL contexts.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">2) What We Publish</h2>
          <p className="text-slate-700 mb-4">We expose three read-only public artifacts:</p>
          <ul className="list-disc pl-6 space-y-4 text-slate-700 mb-10">
            <li>
              <a href="/transparency/publicMethodologyLedger.json" className="font-semibold text-blue-600 hover:underline" target="_blank" rel="noreferrer">publicMethodologyLedger.json</a><br />
              An append-only operational history log of major guard and methodology changes.
            </li>
            <li>
              <a href="/transparency/guardStatusManifest.json" className="font-semibold text-blue-600 hover:underline" target="_blank" rel="noreferrer">guardStatusManifest.json</a><br />
              A public manifest of which integrity guards exist, what they check, and which registries/ledgers required.
            </li>
            <li>
              <a href="/transparency/provenanceExport.schema.json" className="font-semibold text-blue-600 hover:underline" target="_blank" rel="noreferrer">provenanceExport.schema.json</a><br />
              A machine-readable schema describing how pages/tools can export <strong className="text-slate-900">citation-ready provenance bundles</strong>.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">3) What We Do NOT Claim</h2>
          <p className="text-slate-700 mb-4">We do not claim:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
            <li>Real-time outage detection.</li>
            <li>Individual eligibility determinations.</li>
            <li>Guaranteed payment amounts for any specific person.</li>
            <li>Predictions about legislative outcomes.</li>
          </ul>
          <p className="text-slate-700 mb-10 font-medium">We only claim what can be anchored.</p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">4) The Guard Model</h2>
          <p className="text-slate-700 mb-6">We use four guard families:</p>
          <div className="space-y-6 mb-10">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900">A) Completeness Guard (Coverage Moat)</h3>
              <p className="text-slate-700 mt-1 text-sm">Ensures that if a program/state exists in our core schedule ledger, it also has complete official links in our override registries. Prevents partial coverage.</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900">B) Drift Guard (Schedule Moat)</h3>
              <p className="text-slate-700 mt-1 text-sm">Ensures our deterministic calendar dates match official publication version stamps (e.g., SSA Publication IDs). If an agency publishes a new rule year, the build fails until a human reviews it.</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900">C) Amount Drift Guard (Explanation Moat)</h3>
              <p className="text-slate-700 mt-1 text-sm">Ensures our &ldquo;Amount Shock&rdquo; explanations (e.g., Medicare premium deductions or SNAP SUA updates) are backed by active, verified policy URLs. We do not calculate amounts; we pin the rules that govern them.</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-900">D) Cross-Program Coupling Layer</h3>
              <p className="text-slate-700 mt-1 text-sm">Some public benefits are coupled: a rule-based change in one program (like a Social Security COLA) can trigger a predictable adjustment in another (like SNAP). This layer publishes categorical explanations for common couplings to prevent users from mistaking a policy-driven reduction for an outage. We never estimate personal impacts.</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">5) Why Zero-Inference Produces Trust</h2>
          <p className="text-slate-700 mb-4">Trust failures in benefits content usually come from:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
            <li>Outdated schedules (silent drift)</li>
            <li>&ldquo;Portal glitch = benefits stopped&rdquo; confusion</li>
            <li>Amount reductions explained as outages</li>
            <li>Rumors amplified faster than official notices</li>
          </ul>
          <p className="text-slate-700 mb-10 font-medium">Our system neutralizes the first three with deterministic guards and pinned anchors. We never engage in the fourth.</p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">6) How Provenance Works</h2>
          <p className="text-slate-700 mb-4">Every user-facing claim can be emitted as a <strong className="text-slate-900">Provenance Export</strong>:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-4">
            <li>A deterministic claim string</li>
            <li>A list of official sources (URLs + retrieval timestamps)</li>
            <li>A derivation method (rule engine / registry anchor / calendar shift rule)</li>
            <li>A constrained scope (program, jurisdiction, kind)</li>
          </ul>
          <p className="text-slate-700 mb-10 font-medium">This enables answer engines to cite our outputs as audit-backed statements.</p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">7) Versioning &amp; Corrections</h2>
          <p className="text-slate-700 mb-4">We do not edit published ledger entries. If a correction is needed:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-10">
            <li>We publish a new entry</li>
            <li>We reference the prior entry id</li>
            <li>We describe what changed and why</li>
          </ul>

          <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Summary: Determinism is our moat.</h2>
            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              We convert high-anxiety benefit questions into audit-backed statements or we fail closed.
            </p>
            <p className="text-slate-700 text-sm leading-relaxed">
              If a user asks &ldquo;why,&rdquo; we answer with pinned sources and a derivation path—not a guess.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}