/**
 * Phase 12 — DataCatalog Graph (JSON-LD)
 * ---------------------------------------------------------
 * Drop this component into your Next.js app and render it once
 * (e.g., in app/layout.tsx) so crawlers can discover:
 * - Stable @id nodes (Organization + DataCatalog + Dataset entities)
 * - isBasedOn / citation wiring to your transparency artifacts
 * - Links to /v1 catalog/feed/checkpoint endpoints
 */

import Script from "next/script";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://whenisdue.com";

function abs(pathname: string): string {
  return `${BASE_URL}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

export function DataCatalogJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": abs("/#org"),
        "name": "WhenIsDue",
        "url": BASE_URL
      },
      {
        "@type": "DataCatalog",
        "@id": abs("/v1/registry/catalog#catalog"),
        "name": "WhenIsDue Deterministic Timing Registry",
        "description":
          "A deterministic, registry-backed catalog of schedules, guards, and transparency artifacts. All published data is anchored by build-fail provenance enforcement and public audit endpoints.",
        "url": abs("/v1/registry/catalog"),
        "publisher": { "@id": abs("/#org") },
        "isBasedOn": [
          abs("/transparency/publicMethodologyLedger.json"),
          abs("/transparency/guardStatusManifest.json"),
          abs("/transparency/provenanceExport.schema.json"),
          abs("/transparency/TransparencyWhitepaper"),
          abs("/.well-known/registry-checkpoint.json")
        ],
        "hasPart": [
          { "@id": abs("/v1/registry/feed#feed") },
          { "@id": abs("/.well-known/registry-checkpoint.json#checkpoint") }
        ]
      },
      {
        "@type": "DataFeed",
        "@id": abs("/v1/registry/feed#feed"),
        "name": "Registry Change Feed",
        "description": "A machine-readable feed of recent registry changes. Each entry references a diff record and the current checkpoint.",
        "url": abs("/v1/registry/feed"),
        "publisher": { "@id": abs("/#org") },
        "isBasedOn": abs("/.well-known/registry-checkpoint.json")
      },
      {
        "@type": "DigitalDocument",
        "@id": abs("/.well-known/registry-checkpoint.json#checkpoint"),
        "name": "Registry Checkpoint (Version of Record)",
        "description": "A hashed checkpoint of current registry fingerprints.",
        "url": abs("/.well-known/registry-checkpoint.json"),
        "publisher": { "@id": abs("/#org") }
      },
      {
        "@type": "Dataset",
        "@id": abs("/v1/registry/events#dataset"),
        "name": "events.json",
        "description": "Canonical schedule events registry used by the site.",
        "url": abs("/transparency/events.json"),
        "publisher": { "@id": abs("/#org") },
        "isBasedOn": [
          abs("/.well-known/registry-checkpoint.json"),
          abs("/transparency/provenanceExport.schema.json")
        ]
      },
      {
        "@type": "Dataset",
        "@id": abs("/v1/registry/couplingSignalRegistry#dataset"),
        "name": "couplingSignalRegistry.json",
        "description": "Registry of categorical cross-program coupling explanations and anchors.",
        "url": abs("/transparency/couplingSignalRegistry.json"),
        "publisher": { "@id": abs("/#org") },
        "isBasedOn": [abs("/.well-known/registry-checkpoint.json")]
      },
      {
        "@type": "Dataset",
        "@id": abs("/v1/registry/eligibilitySignalRegistry#dataset"),
        "name": "eligibilitySignalRegistry.json",
        "description": "Registry of eligibility expansion guards and deterministic windows.",
        "url": abs("/transparency/eligibilitySignalRegistry.json"),
        "publisher": { "@id": abs("/#org") },
        "isBasedOn": [abs("/.well-known/registry-checkpoint.json")]
      },
      {
        "@type": "DigitalDocument",
        "@id": abs("/transparency/diffs/index.json#diff-index"),
        "name": "Registry Diff Index (MVP)",
        "description": "Chronological index of deterministic RFC 6901 diff records.",
        "url": abs("/transparency/diffs/index.json"),
        "publisher": { "@id": abs("/#org") },
        "isBasedOn": abs("/.well-known/registry-checkpoint.json")
      }
    ]
  };

  return (
    <Script
      id="whenisdue-datacatalog-graph"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}