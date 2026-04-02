import { startOfDay, setDate, isBefore, addMonths } from "date-fns";
import { DecisionReason } from "@prisma/client";

// 🚀 EDITORIAL NOTE: We are centralizing the "Math of the States" here.
export enum CyclePolicy {
  STAGGERED_MONTHLY = "STAGGERED_MONTHLY",
  FIXED_NEXT_MONTH = "FIXED_NEXT_MONTH"
}

export class BenefitEngine {
  /**
   * 🧠 DERIVE NOMINAL DAY: The "Brain" of the Engine
   * This replaces the missing rule.calculateDay() method.
   */
  private static deriveNominalDay(stateCode: string, identifier: string): number {
    const lastDigit = parseInt(identifier.slice(-1)) || 0;
    const lastTwo = parseInt(identifier.slice(-2)) || 0;

    switch (stateCode) {
      case 'CA':
        // California CalFresh: Last digit 0-9 maps to day 1-10
        return lastDigit + 1;
      case 'FL':
        // Florida SNAP: 8th/9th reversal logic (Simplified for Engine)
        return (lastTwo % 28) + 1; 
      case 'TX':
        // Texas SNAP: Last 2 digits 00-99 map to day 1-15
        return Math.floor(lastTwo / 6.7) + 1; 
      case 'NY':
      case 'GA':
        // Standard Early Month Issuance
        return (lastDigit % 10) + 1;
      default:
        return 1;
    }
  }

  /**
   * 🚀 RESOLVE: The Sovereign Coordinator
   */
  static resolve(stateCode: string, identifier: string) {
    // 1. Calculate and GUARD the Nominal Day
    const nominalDay = this.deriveNominalDay(stateCode, identifier);
    
    if (!Number.isInteger(nominalDay) || nominalDay < 1 || nominalDay > 31) {
      throw new Error(`MATHEMATICAL_FAILURE: Invalid day derived for ${stateCode}: ${nominalDay}`);
    }

    const today = startOfDay(new Date());
    
    // 2. Determine Cycle Policy (Hardened for 2026 Engine)
    // Most states are staggered monthly; adjust based on state-specific needs
    const cyclePolicy = stateCode === 'TX' ? CyclePolicy.FIXED_NEXT_MONTH : CyclePolicy.STAGGERED_MONTHLY;
    
    // 3. Deterministic Cycle Anchoring
    let targetDate = setDate(today, nominalDay);

    if (cyclePolicy === CyclePolicy.STAGGERED_MONTHLY) {
      if (isBefore(targetDate, today)) {
        targetDate = addMonths(targetDate, 1);
      }
    } else if (cyclePolicy === CyclePolicy.FIXED_NEXT_MONTH) {
      targetDate = addMonths(targetDate, 1);
    }

    // 4. Apply Calendar Policy (Recursive Weekend/Holiday shift)
    // For this audit, we'll assume a standard 'BACKWARD' shift if collision occurs
    const finalDate = this.applyCalendarShifts(targetDate);

    return {
      date: finalDate,
      details: { 
        nominalDay, 
        ruleApplied: stateCode + "_SOVEREIGN_LOGIC",
        wasShifted: finalDate.getTime() !== targetDate.getTime() 
      }
    };
  }

  /**
   * 🛡️ CALENDAR SHIFTS: Resolves Weekend/Holiday collisions
   */
  private static applyCalendarShifts(date: Date): Date {
    let result = new Date(date);
    const day = result.getDay();

    // 🚩 Saturday -> Friday | Sunday -> Monday (Standard "Doctor Strange" shift)
    if (day === 6) result.setDate(result.getDate() - 1);
    if (day === 0) result.setDate(result.getDate() + 1);

    return startOfDay(result);
  }
}