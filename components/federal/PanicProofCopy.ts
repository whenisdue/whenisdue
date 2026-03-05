/**
 * PanicProofCopy.ts (Phases 6.2.2 + 8 + 10)
 *
 * Centralized, deterministic copy strings.
 */

export type GapMonthCopyParams = {
  programLabel: string;
  benefitMonthLabel: string;
  issuedOnLabel: string;
  perceivedMissingOnLabel: string;
  nextScheduledLabel: string;
};

// Phase 10 Additions
export type CouplingId =
  | 'ssa_cola_snap_recalc'
  | 'ssa_medicare_partb_withholding'
  | 'ssa_irmaa_two_year_lookback'
  | 'ssi_in_kind_support_ism'
  | 'hud_income_total_tenant_payment'
  | 'ssa_overpayment_recovery_withholding';

export type CouplingTier = 'essential' | 'contextual' | 'technical';

export const COUPLING_COPY: Record<CouplingId, {
  title: string;
  gist: string;
  explanation: string;
  notAnOutageLine: string;
  safeNextStep: string;
}> = {
  ssa_cola_snap_recalc: {
    title: 'Why SNAP can change after a Social Security COLA',
    gist: 'SNAP is recalculated when other counted income sources change.',
    explanation: 'Social Security payments are generally counted as unearned income for SNAP. When the annual Cost-of-Living Adjustment (COLA) increases Social Security amounts, states may update SNAP budgets using the new income figures. Because SNAP is designed to help cover the gap between income and a basic food budget, a higher counted income can reduce the SNAP amount.',
    notAnOutageLine: 'This pattern reflects program rules and routine recalculation cycles, not a system-wide outage.',
    safeNextStep: 'If your SNAP amount changed, review your most recent SNAP notice for the specific budget line items used this month.',
  },
  ssa_medicare_partb_withholding: {
    title: 'Why Social Security checks change when Medicare premiums update',
    gist: 'Medicare Part B premiums are usually deducted directly from Social Security.',
    explanation: 'When Medicare Part B premiums increase, the new premium amount is withheld from Social Security payments. In some years, a premium increase can offset the Cost-of-Living Adjustment (COLA), resulting in a smaller net deposit even though the gross benefit increased.',
    notAnOutageLine: 'Net reductions driven by premium changes are standard adjustments, not payment errors.',
    safeNextStep: 'Check your annual Social Security Benefit Rate increase letter for the exact breakdown of your gross benefit and Medicare deductions.',
  },
  ssa_irmaa_two_year_lookback: {
    title: 'How prior-year income changes Medicare premiums',
    gist: 'Higher incomes trigger an Income-Related Monthly Adjustment Amount (IRMAA).',
    explanation: 'Medicare uses tax returns from two years prior to determine if you owe an IRMAA surcharge on your Part B or Part D premiums. This surcharge is withheld directly from your Social Security check, which can cause your net deposit to decrease.',
    notAnOutageLine: 'An IRMAA deduction is a tax-based adjustment, not a benefit stoppage.',
    safeNextStep: 'If you experienced a life-changing event that reduced your income, you can appeal the IRMAA determination directly with Social Security.',
  },
  ssi_in_kind_support_ism: {
    title: 'How food and shelter assistance affects SSI',
    gist: 'SSI can be reduced if you receive In-Kind Support and Maintenance (ISM).',
    explanation: 'SSI is a needs-based program. If someone else helps pay for your shelter, Social Security may count that as In-Kind Support and Maintenance (ISM). This can reduce your monthly SSI payment by up to one-third of the federal benefit rate.',
    notAnOutageLine: 'An ISM reduction is a policy-based recalculation, not a missing payment.',
    safeNextStep: 'Report changes in your living arrangements or expenses to Social Security, as this can trigger a recalculation of your benefit amount.',
  },
  hud_income_total_tenant_payment: {
    title: 'Why rent changes when SSI or Social Security changes',
    gist: 'HUD housing programs base your rent on your total household income.',
    explanation: 'In programs like Section 8, your Total Tenant Payment is generally set at 30% of your adjusted monthly income. When your income goes up—such as receiving a Social Security COLA or an SSI increase—your required rent portion will typically increase at your next recertification.',
    notAnOutageLine: 'Rent recalculations following income changes are federal housing policy.',
    safeNextStep: 'Review the income calculation from your housing authority for the effective date shown in your notice.',
  },
  ssa_overpayment_recovery_withholding: {
    title: 'Why your benefit can be reduced during overpayment recovery',
    gist: 'Agencies can withhold part of a benefit to recover past overpayments.',
    explanation: 'If an agency determines that you were paid more than you were eligible for in the past, it may recover that amount by withholding part of ongoing benefits. Recovery rules and default withholding rates vary by program and situation. If withholding creates hardship, official procedures may allow a different repayment arrangement.',
    notAnOutageLine: 'A consistent reduction can indicate recovery withholding rather than a service outage.',
    safeNextStep: 'Check your notice for the overpayment case number and repayment terms, and use the official contact methods listed if you need to request a different rate.',
  },
};

export const COUPLING_INFERENCE_BOUNDARY = {
  title: 'Inference Boundaries (No Personal Calculations)',
  bullets: [
    'We publish categorical program rules and verified policy anchors.',
    'We do not estimate your personal net check change or determine individual eligibility.',
    'We do not infer household composition, tax filing status, MAGI, or living arrangement from browsing.',
    'When a topic requires personal facts, we provide official next steps instead of guessing.',
  ],
} as const;

export const PANIC_PROOF_COPY = {
  gapMonthBanner: {
    title: "This month’s benefit was issued early",
    body: (p: GapMonthCopyParams) =>
      `There is no deposit scheduled on ${p.perceivedMissingOnLabel}. ` +
      `${p.programLabel} for ${p.benefitMonthLabel} was issued on ${p.issuedOnLabel} because the usual date falls on a weekend or federal holiday. ` +
      `Your next scheduled payment is ${p.nextScheduledLabel}.`,
    microLine: "This is not an extra payment."
  },
  portalFriction: {
    line: "Portal errors are usually a browser or sign-in issue—not a payment change.",
    stepsTitle: "If you can’t sign in:",
    steps: [
      "Open a private window (incognito) and try again.",
      "Clear cookies/cache for .ssa.gov and retry.",
      "Turn off VPN/proxy if you use one.",
      "Check your device time if you see redirect loops."
    ],
    fallbackLine: "If sign-in still fails, use official SSA phone support or a local office."
  },
  ssaAmountShock: {
    title: "Not an outage: amount changed",
    bullets: [
      "Medicare premiums (Part B/IRMAA) can be withheld from your Social Security payment.",
      "Treasury offsets (TOP) can reduce a payment for certain debts.",
      "Overpayment recovery can withhold a portion of a payment.",
      "A yearly COLA can change gross amounts, while net amounts can still go down if deductions rise."
    ],
    footer: "We do not estimate your personal amount. Use the official sources below for the rule that applies to your situation.",
    ariaRole: "status" as const
  },
  snapAmountShock: {
    title: "Not an outage: SNAP amount changed",
    bullets: [
      "Standard Utility Allowances (SUA) and deduction rules can change on review cycles.",
      "A recalculation can update your benefit after reported changes or system updates.",
      "Recertification or missing verification can temporarily reduce or pause benefits.",
      "State policy rules can change deductions and net allotments without changing your deposit date."
    ],
    footer: "We do not calculate your household benefit. The sources below explain the rules used by your state and USDA.",
    ariaRole: "status" as const
  }
} as const;