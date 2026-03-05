/**
 * Phase 7: Deterministic Build‑Fail Moat (UI Policy Addendum)
 *
 * This copy is intentionally strict, factual, and non-speculative.
 * It describes our verification posture without implying guarantees about government systems.
 */

export const DeterministicBuildFailPolicy = {
  title: "Verification policy (deterministic build checks)",
  bullets: [
    "We publish benefit schedules using a deterministic ruleset and official source anchors.",
    "Before each release, our build runs integrity checks against our source registry (for example: SSA calendar publication IDs and state policy anchors).",
    "If a required anchor is missing or outdated, the build fails closed and the schedule is not published until a human reviewer updates the registry with an official source.",
    "We do not guess missing dates and we do not publish unverified changes.",
  ],
  footerNote:
    "Tip: For account-specific issues (eligibility, holds, address changes), your agency account or case worker is the authoritative source.",
} as const;