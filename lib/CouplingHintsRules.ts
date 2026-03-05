/**
 * Phase 10 — Coupling Hints Injection Rules (Deterministic Mapper)
 * ----------------------------------------------------------------
 * Purpose:
 * - Deterministically decide which cross-program coupling hints to display
 * based ONLY on page context + current UTC month.
 * - NO user data. NO personalized calculations. NO probabilistic inference.
 */

import { type CouplingId } from "../components/federal/PanicProofCopy";

export type PageProgram = "SSA" | "SSI" | "SNAP" | "MEDICARE" | "HUD" | "GENERAL" | string;
export type PageTopic = "benefit_amounts" | "payment_schedule" | "cola" | "overpayments" | "methodology" | "general" | string;

export type CouplingHintResult = {
  couplingId: CouplingId;
  tier: "essential" | "contextual" | "technical";
  reasonCode: string;
};

export function deriveCouplingHints(params: {
  pageProgram: PageProgram;
  pageTopic: PageTopic;
  nowMsUtc: number;
  flags?: {
    colaAnnounced?: boolean;
    medicarePremiumsAnnounced?: boolean;
    overpaymentAdvisorySeason?: boolean;
  };
}): CouplingHintResult[] {
  const { pageProgram, pageTopic, nowMsUtc, flags } = params;
  const hints: CouplingHintResult[] = [];

  if (pageTopic === "methodology") return [];

  const d = new Date(nowMsUtc);
  const currentMonth = d.getUTCMonth(); // 0 = Jan, 11 = Dec
  const isQ4orQ1 = currentMonth >= 9 || currentMonth <= 2; // Oct through March (Heavy coupling season)

  // 1. SSA COLA -> SNAP Recalc
  if (pageProgram === "SNAP") {
    if (isQ4orQ1 || flags?.colaAnnounced) {
      hints.push({
        couplingId: "ssa_cola_snap_recalc",
        tier: "essential",
        reasonCode: "SEASONAL_COLA_WINDOW"
      });
    }
  }

  // 2. Medicare Withholding & IRMAA
  if (pageProgram === "SSA") {
    if (isQ4orQ1 || flags?.medicarePremiumsAnnounced) {
      hints.push({
        couplingId: "ssa_medicare_partb_withholding",
        tier: "essential",
        reasonCode: "SEASONAL_MEDICARE_WINDOW"
      });
      hints.push({
        couplingId: "ssa_irmaa_two_year_lookback",
        tier: "technical",
        reasonCode: "SEASONAL_MEDICARE_WINDOW"
      });
    }
  }

  // 3. SSI ISM (In-Kind Support)
  if (pageProgram === "SSI") {
    hints.push({
      couplingId: "ssi_in_kind_support_ism",
      tier: "contextual",
      reasonCode: "SAFETY_CONTEXT"
    });
  }

  // 4. HUD Income Recalc
  if (pageProgram === "SSA" || pageProgram === "SSI") {
    if (isQ4orQ1 || flags?.colaAnnounced) {
      hints.push({
        couplingId: "hud_income_total_tenant_payment",
        tier: "contextual",
        reasonCode: "SEASONAL_COLA_WINDOW"
      });
    }
  }

  // 5. Overpayment Recovery
  if (pageProgram === "SSA" || pageProgram === "SSI") {
    // We treat payment schedule pages as an acceptable proxy for 'benefit amounts' here
    hints.push({
      couplingId: "ssa_overpayment_recovery_withholding",
      tier: "essential",
      reasonCode: "SAFETY_CONTEXT"
    });
  }

  // Deduplicate
  const seen = new Set<string>();
  return hints.filter(h => {
    if (seen.has(h.couplingId)) return false;
    seen.add(h.couplingId);
    return true;
  });
}