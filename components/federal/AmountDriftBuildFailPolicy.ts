/**
 * AmountDriftBuildFailPolicy.ts
 * Methodology addendum (UI copy).
 */

export const AMOUNT_DRIFT_BUILD_FAIL_POLICY = {
  title: "Amount Drift Guard (Build-Fail Policy)",
  paragraphs: [
    "Benefit amounts can change even when payment dates stay the same. This is often misread as an outage.",
    "To prevent outdated guidance, we maintain a build-time registry of official policy anchors (SSA and SNAP).",
    "If a new rule source is missing—or a new SNAP state enters our ledger without amount-rule coverage—the site build fails until a human reviews and updates the registry.",
    "We do not estimate your personal benefit amount. We provide deterministic, provenance-linked rule explanations only."
  ],
  guarantees: [
    "No live scraping is used for amount explanations.",
    "No speculative or personalized amount claims are generated.",
    "Missing coverage triggers a fail-closed build error."
  ]
} as const;