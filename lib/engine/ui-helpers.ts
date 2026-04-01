import { DecisionReason } from "@prisma/client";

export interface NextDepositDetails {
  nominalDay: number;
  ruleApplied: string;
  wasShifted: boolean;
  appliedStrategy?: string;
}

const REASON_LABELS: Record<string, string> = {
  CASE_NUMBER_LAST_DIGIT: "Case Number (Last Digit)",
  CASE_NUMBER_LAST_TWO_DIGITS: "Case Number (Last 2 Digits)",
  FLORIDA_REVERSED_DIGIT_LOGIC: "Florida Case Number Rule",
  PAYMENT_CYCLE_STANDARD: "Standard Monthly Issuance",
};

export const formatReasonLabel = (reason: string) => {
  return REASON_LABELS[reason] || reason.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * 🚀 HARDENED FORENSIC PARSER
 * Strictly enforces 1-31 integer range for nominalDay.
 * Uses Math.floor for UI normalization as approved by audit.
 */
export const parseDepositDetails = (details: unknown): NextDepositDetails => {
  const obj = (details && typeof details === "object") ? details as Record<string, unknown> : {};
  
  const rawDay = typeof obj.nominalDay === "number" ? obj.nominalDay : 1;
  
  // 🛡️ Range Guard & Integer Coercion
  let nominalDay = Math.floor(rawDay);
  if (nominalDay < 1 || nominalDay > 31) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Forensic Alert] nominalDay ${rawDay} normalized to 1.`);
    }
    nominalDay = 1;
  }

  return {
    nominalDay,
    ruleApplied: typeof obj.ruleApplied === "string" 
      ? obj.ruleApplied 
      : DecisionReason.PAYMENT_CYCLE_STANDARD,
    wasShifted: typeof obj.wasShifted === "boolean" ? obj.wasShifted : false,
    appliedStrategy: typeof obj.appliedStrategy === "string" ? obj.appliedStrategy : undefined,
  };
};