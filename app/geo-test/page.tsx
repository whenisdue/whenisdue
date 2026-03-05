import React from 'react';
import { AnswerBlock } from '../../components/geo/AnswerBlock';
import { AnswerBlockBinding } from '../../types/geo-contracts';

export default function GeoTestPage() {
  const mockBinding: AnswerBlockBinding = {
    version: "1.0.0",
    id: "snap-benefits-california-2026",
    origin: "https://whenisdue.com",
    canonicalUrl: "https://whenisdue.com/federal/snap-california",
    question: "When are SNAP benefits deposited in California?",
    answerText: "In California, CalFresh (SNAP) benefits are deposited onto EBT cards during the first 10 days of the month, based on the last digit of your case number.",
    answerTextSha256: "sha256:dummyhash1234567890abcdef1234567890abcdef1234567890abcdef12345",
    eventTime: {
      kind: "DATE_TIME",
      timezone: "PT",
      display: "First 10 days of every month",
      isoUtc: "2026-03-01T08:00:00Z"
    },
    status: "CONFIRMED",
    lastVerifiedUtc: "2026-03-03T00:00:00Z",
    scoreIdentityTuple: {
      verdict: "PASS",
      trustScore: 98,
      citeabilityScore: 95,
      tupleHash: "sha256:anothummyhash1234567890abcdef1234567890abcdef1234567890abcdef1"
    },
    refs: {
      trustSummaryUrl: "https://whenisdue.com/api/ai/trust-summary/snap-benefits-california-2026",
      proofBundleUrl: "https://whenisdue.com/api/ai/proof-bundle/snap-benefits-california-2026?profile=FAST&encoding=application/json",
      explainUrl: "https://whenisdue.com/api/ai/explain/snap-benefits-california-2026",
      trustVerdictUrl: "https://whenisdue.com/verify/trustVerdict/snap-benefits-california-2026.json"
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-extrabold text-white mb-6">GEO Surface Test Page</h1>
      <p className="mb-8 text-gray-400">
        Below is the SSR Answer Block. If you inspect the DOM, you will see the invisible JSON-LD schema and the AI link tags bound perfectly to the visible text.
      </p>
      
      <AnswerBlock binding={mockBinding} />
      
    </main>
  );
}