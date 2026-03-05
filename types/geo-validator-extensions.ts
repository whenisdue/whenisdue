import { z } from "zod";

// Append these to the existing Validator Taxonomy from Phase 22
export const SeriesValidatorExtensions = {
  GEO_SERIES_PAGE_CLAIM_SOURCE_FAIL: {
    code: "GEO_SERIES_PAGE_CLAIM_SOURCE_FAIL",
    severity: "FATAL",
    predicate: "SSR-rendered claim text is not found verbatim in SeriesDistribution.derivedClaims[].text and is not one of the allowed locked templates.",
    pointers: ["DOM_PATH", "JSON_POINTER (SeriesDistribution)"]
  },
  
  GEO_SERIES_SCHEMA_FAQ_ANSWER_MISMATCH: {
    code: "GEO_SERIES_SCHEMA_FAQ_ANSWER_MISMATCH",
    severity: "FATAL",
    predicate: "FAQPage answer text !== normalized SSR SeriesAnswerBlock answer text.",
    pointers: ["JSON_POINTER (FAQPage.acceptedAnswer)", "DOM_PATH (SeriesAnswerBlock)"]
  },

  GEO_SERIES_DATASET_DISTRIBUTION_REF_MISSING: {
    code: "GEO_SERIES_DATASET_DISTRIBUTION_REF_MISSING",
    severity: "FATAL",
    predicate: "Dataset JSON-LD does not include a DataDownload link pointing exactly to the distribution artifact URL.",
    pointers: ["JSON_POINTER (Dataset.distribution)"]
  },

  GEO_SERIES_DATE_MODIFIED_DRIFT: {
    code: "GEO_SERIES_DATE_MODIFIED_DRIFT",
    severity: "FATAL",
    predicate: "WebPage.dateModified !== SeriesProfile.lastVerifiedUtc.",
    pointers: ["JSON_POINTER (WebPage.dateModified)", "JSON_POINTER (SeriesProfile.lastVerifiedUtc)"]
  }
} as const;