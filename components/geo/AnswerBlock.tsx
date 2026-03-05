import React from 'react';
import { AnswerBlockBinding } from '../../types/geo-contracts';

export function AnswerBlock({ binding }: { binding: AnswerBlockBinding }) {
  const isConflict = binding.scoreIdentityTuple.verdict === 'CONFLICT';

  // Strict normalizer to prevent AnswerText byte-mismatch errors
  const normalizedAnswerText = binding.answerText
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/ {2,}/g, ' ');

  // 1. Generate the exact FAQPage JSON-LD schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": binding.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": normalizedAnswerText
      }
    }]
  };

  // 2. Render the Server-Side HTML
  return (
    <div id="wid-answerblock" className="border border-gray-300 rounded-lg p-6 my-8 bg-white shadow-sm">
      {/* Invisible JSON-LD bound physically inside the block */}
      <script 
        type="application/ld+json" 
        data-wid="faq"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} 
      />

      <h2 data-wid="question" className="text-2xl font-bold mb-4 text-gray-900">
        {binding.question}
      </h2>

      {/* Human-visible Conflict Banner */}
      {isConflict && (
        <div className="bg-red-100 text-red-800 font-bold px-4 py-3 mb-4 rounded border border-red-300 uppercase tracking-wide text-sm">
          Conflict Active. Do Not Cite.
        </div>
      )}

      {/* The Canonical Answer Text */}
      <p data-wid="answerText" className="text-lg text-gray-800 whitespace-pre-wrap leading-relaxed mb-6">
        {normalizedAnswerText}
      </p>

      {/* Meta-Data Grid for strict deterministic rendering */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="font-semibold block text-gray-900">Event Date:</span> 
          {binding.eventTime.display} ({binding.eventTime.timezone})
        </div>
        <div>
          <span className="font-semibold block text-gray-900">Status:</span> 
          <span className={binding.status === 'CONFIRMED' ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>
            {binding.status}
          </span>
        </div>
        <div>
          <span className="font-semibold block text-gray-900">Last Verified (UTC):</span> 
          <time dateTime={binding.lastVerifiedUtc}>{binding.lastVerifiedUtc}</time>
        </div>
        <div>
          <span className="font-semibold block text-gray-900">Trust Breakdown:</span> 
          <a href={binding.refs.explainUrl} className="text-blue-600 hover:text-blue-800 underline">
            Verify Cryptographic Proof
          </a>
        </div>
      </div>
      
      {/* Invisible AI upgrade path links */}
      <link rel="whenisdue-ai-trust-summary" href={binding.refs.trustSummaryUrl} />
      <link rel="whenisdue-ai-proof-bundle" href={binding.refs.proofBundleUrl} />
      <link rel="whenisdue-trust-verdict" href={binding.refs.trustVerdictUrl} />
    </div>
  );
}