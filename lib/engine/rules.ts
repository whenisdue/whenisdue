import { DecisionReason, DateOffsetStrategy } from "@prisma/client";

export enum CyclePolicy {
  STAGGERED_MONTHLY = "STAGGERED_MONTHLY", // If day passed, move to next month
  FIXED_NEXT_MONTH = "FIXED_NEXT_MONTH",   // Always anchors to the next month's cycle
}

export interface BenefitRule {
  state: string;
  program: string;
  reason: DecisionReason;
  offsetStrategy: DateOffsetStrategy;
  cyclePolicy: CyclePolicy;
  validate: (input: string) => boolean;
  calculateDay: (input: string) => number;
}

// 🏛️ AUDITED RULES (Phase 1 Scope)
export const RULES_INVENTORY: BenefitRule[] = [
  {
    state: 'CA',
    program: 'SNAP',
    reason: DecisionReason.CASE_NUMBER_LAST_DIGIT,
    offsetStrategy: DateOffsetStrategy.NEXT_BUSINESS_DAY,
    cyclePolicy: CyclePolicy.STAGGERED_MONTHLY,
    validate: (input) => /^\d$/.test(input),
    calculateDay: (input) => parseInt(input, 10) + 1, // Range 1-10
  },
  {
    state: 'CA',
    program: 'TANF',
    reason: DecisionReason.PAYMENT_CYCLE_STANDARD,
    offsetStrategy: DateOffsetStrategy.NEXT_BUSINESS_DAY,
    cyclePolicy: CyclePolicy.STAGGERED_MONTHLY,
    validate: () => true, // Standard for everyone
    calculateDay: () => 1,
  },
  {
    state: 'NY',
    program: 'SNAP',
    reason: DecisionReason.CASE_NUMBER_LAST_DIGIT,
    offsetStrategy: DateOffsetStrategy.NEXT_BUSINESS_DAY,
    cyclePolicy: CyclePolicy.STAGGERED_MONTHLY,
    validate: (input) => /^\d$/.test(input),
    calculateDay: (input) => 10 + parseInt(input, 10), // Range 10-19
  }
];