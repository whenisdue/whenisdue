import { BenefitRule, CyclePolicy } from "./rules";
import { isHoliday } from "./holidays";
import { addDays, subDays, isSaturday, isSunday, setDate, startOfDay, addMonths, isBefore } from 'date-fns';
import { DateOffsetStrategy } from "@prisma/client";

export class BenefitEngine {
  static resolve(rule: BenefitRule, identifier: string) {
    // 1. Calculate and GUARD the Nominal Day
    const nominalDay = rule.calculateDay(identifier);
    
    if (!Number.isInteger(nominalDay) || nominalDay < 1 || nominalDay > 31) {
      throw new Error(`MATHEMATICAL_FAILURE: Rule for ${rule.state} returned invalid day: ${nominalDay}`);
    }

    const today = startOfDay(new Date());
    
    // 2. Deterministic Cycle Anchoring (Contract: FIXED_NEXT_MONTH respects nominalDay)
    let targetDate = setDate(today, nominalDay);

    if (rule.cyclePolicy === CyclePolicy.STAGGERED_MONTHLY) {
      if (isBefore(targetDate, today)) {
        targetDate = addMonths(targetDate, 1);
      }
    } else if (rule.cyclePolicy === CyclePolicy.FIXED_NEXT_MONTH) {
      // Logic: Force anchor to the next calendar month's nominal day
      targetDate = addMonths(targetDate, 1);
    }

    // 3. Apply Calendar Policy (Recursive Weekend/Holiday shift)
    const finalDate = this.applyPolicy(targetDate, rule.offsetStrategy);

    return {
      date: finalDate,
      details: { 
        nominalDay, 
        cycle: rule.cyclePolicy, 
        wasShifted: finalDate.getTime() !== targetDate.getTime() 
      }
    };
  }

  private static applyPolicy(date: Date, strategy: DateOffsetStrategy): Date {
    let result = date;
    while (isSaturday(result) || isSunday(result) || isHoliday(result)) {
      result = (strategy === DateOffsetStrategy.PREV_BUSINESS_DAY) 
        ? subDays(result, 1) 
        : addDays(result, 1);
    }
    return result;
  }
}