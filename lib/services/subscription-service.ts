import { 
  PrismaClient, 
  IdentifierMatchType, 
  Subscription, 
  Subscriber, 
  Prisma,
  SubscriptionStatus
} from '@prisma/client';
import { prisma } from "@/lib/prisma";
import { RULES_INVENTORY } from "../engine/rules";
import { BenefitEngine } from "../engine/benefit-engine";
import { IdentifierNormalization } from "../engine/normalization";

/**
 * OPERATION-SPECIFIC OUTCOME CONTRACTS
 */
export type SubscribeOutcome = 
  | { type: 'SUCCESS'; data: Subscription }
  | { type: 'ALREADY_ACTIVE'; data: Subscription }
  | { type: 'ALREADY_PAUSED'; data: Subscription }
  | { type: 'INVALID_INPUT'; message: string }
  | { type: 'CONCURRENCY_ANOMALY'; message: string };

export type VerifyEmailOutcome = 
  | { type: 'SUCCESS'; data: Subscriber }
  | { type: 'IDENTITY_MISMATCH'; message: string }
  | { type: 'VERIFICATION_IDEMPOTENT'; data: Subscriber };

export type UpdateEmailOutcome = 
  | { type: 'SUCCESS'; data: Subscriber }
  | { type: 'EMAIL_CONFLICT'; message: string }
  | { type: 'INVALID_INPUT'; message: string };

export interface IntegrityLogger {
  logAnomaly(event: string, context: Record<string, unknown>): void;
}

export const CANONICAL_PROGRAM_LIST = ['SNAP', 'TANF', 'WIC'] as const;

export class SubscriptionService {
  constructor(private readonly logger: IntegrityLogger) {}

  /**
   * REPAIR: Updated to use deterministic BenefitEngine and 
   * Boss State normalization (FL/TX).
   */
  async subscribe(input: {
    email: string;
    stateCode: string;
    programCode: string;
    matchType: IdentifierMatchType;
    rawInput: string;
  }): Promise<SubscribeOutcome> {
    
    // 1. BOUNDARY SANITIZATION
    const normalizedEmail = input.email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { type: 'INVALID_INPUT', message: 'Valid email required.' };
    }

    const stateCode = input.stateCode.toUpperCase().trim();
    const programCode = input.programCode.toUpperCase().trim();

    // 🚀 2. BOSS STATE NORMALIZATION
    let matchCanonical: string;
    try {
      if (stateCode === 'FL') {
        matchCanonical = IdentifierNormalization.forFlorida(input.rawInput);
      } else if (stateCode === 'TX') {
        matchCanonical = IdentifierNormalization.forTexas(input.rawInput);
      } else {
        const canonicalResult = this.canonicalize(input.matchType, input.rawInput);
        if (canonicalResult.type === 'INVALID_INPUT') return canonicalResult;
        matchCanonical = canonicalResult.value;
      }
    } catch (err: any) {
      return { type: 'INVALID_INPUT', message: err.message };
    }

    try {
      return await prisma.$transaction(async (tx) => {
        // 3. ATOMIC IDENTITY RESOLUTION
        const subscriber = await tx.subscriber.upsert({
          where: { normalizedEmail },
          update: {}, 
          create: { email: input.email.trim(), normalizedEmail },
        });

        // 4. LIFECYCLE CHECK
        const existing = await tx.subscription.findUnique({
          where: {
            subscription_identity_key: { 
              subscriberId: subscriber.id, 
              stateCode, 
              programCode, 
              identifierValue: matchCanonical 
            }
          },
        });

        if (existing) {
          return existing.status === 'PAUSED' 
            ? { type: 'ALREADY_PAUSED', data: existing }
            : { type: 'ALREADY_ACTIVE', data: existing };
        }

        // 5. RULE LOOKUP
        const rule = RULES_INVENTORY.find(r => r.state === stateCode && r.program === programCode);
        if (!rule) {
          return { type: 'INVALID_INPUT', message: `Location ${stateCode} ${programCode} is not currently supported.` };
        }

        // 🛡️ 6. DEFENSE-IN-DEPTH VALIDATION
        if (!rule.validate(matchCanonical)) {
          return { type: 'INVALID_INPUT', message: `Identifier format is invalid for ${stateCode} ${programCode} rules.` };
        }

       // --- 2 lines above ---
// 🚀 7. DETERMINISTIC ENGINE RESOLUTION
const { date, details } = BenefitEngine.resolve(stateCode, matchCanonical);

const newSub = await tx.subscription.create({
// --- 2 lines below ---

          data: {
            subscriberId: subscriber.id,
            stateCode,
            programCode,
            identifierValue: matchCanonical,
            nextDepositDate: date,
            nextDepositReason: rule.reason,
            nextDepositDetails: { ...details, ruleApplied: rule.reason },
            status: 'ACTIVE'
          },
        });

        return { type: 'SUCCESS', data: newSub };
      });
    } catch (e: any) {
      // 🚨 8. AUDITED CATCH PATH
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return { type: 'CONCURRENCY_ANOMALY', message: 'A subscription attempt is already in progress.' };
      }

      this.logger.logAnomaly('SUBSCRIPTION_ENGINE_FAILURE', { 
        error: e.message, 
        context: { stateCode, programCode, matchCanonical } 
      });

      throw e; 
    }
  }

  async updateEmail(subscriberId: string, newEmail: string): Promise<UpdateEmailOutcome> {
    const normalizedNew = newEmail.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedNew)) {
      return { type: 'INVALID_INPUT', message: 'Invalid email format.' };
    }

    try {
      const updated = await prisma.subscriber.update({
        where: { id: subscriberId },
        data: {
          email: newEmail.trim(),
          normalizedEmail: normalizedNew,
          verifiedEmail: null,
          emailVerifiedAt: null,
        },
      });
      return { type: 'SUCCESS', data: updated };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return { type: 'EMAIL_CONFLICT', message: 'Email already registered.' };
      }
      throw e;
    }
  }

  async verifyEmail(subscriberId: string, tokenEmail: string): Promise<VerifyEmailOutcome> {
    const normalizedTokenEmail = tokenEmail.toLowerCase().trim();
    const subscriber = await prisma.subscriber.findUnique({ where: { id: subscriberId } });
    
    if (!subscriber || subscriber.normalizedEmail !== normalizedTokenEmail) {
      return { type: 'IDENTITY_MISMATCH', message: 'Verification identity mismatch.' };
    }

    if (subscriber.verifiedEmail === normalizedTokenEmail && subscriber.emailVerifiedAt) {
      return { type: 'VERIFICATION_IDEMPOTENT', data: subscriber };
    }

    const updated = await prisma.subscriber.update({
      where: { id: subscriberId },
      data: { verifiedEmail: normalizedTokenEmail, emailVerifiedAt: new Date() },
    });

    return { type: 'SUCCESS', data: updated }; 
  }

  private canonicalize(type: IdentifierMatchType, input: string): { type: 'SUCCESS', value: string } | { type: 'INVALID_INPUT', message: string } {
    const raw = input.trim();
    if (!raw) return { type: 'INVALID_INPUT', message: 'Input required.' };

    switch (type) {
      case 'CASE_NUMBER_LAST_DIGIT':
        return /^\d$/.test(raw) ? { type: 'SUCCESS', value: raw } : { type: 'INVALID_INPUT', message: 'Exactly one digit required.' };
      case 'CASE_NUMBER_REMAINDER':
        return /^\d{3,20}$/.test(raw) 
          ? { type: 'SUCCESS', value: (parseInt(raw, 10) % 100).toString().padStart(2, '0') } 
          : { type: 'INVALID_INPUT', message: 'Full numeric case number required.' };
      case 'LAST_NAME_INITIAL':
        return /^[a-zA-Z]$/.test(raw) ? { type: 'SUCCESS', value: raw.toUpperCase() } : { type: 'INVALID_INPUT', message: 'Exactly one letter required.' };
      case 'BIRTH_DATE_DAY':
        const day = parseInt(raw, 10);
        return (!isNaN(day) && /^\d{1,2}$/.test(raw) && day >= 1 && day <= 31) 
          ? { type: 'SUCCESS', value: day.toString().padStart(2, '0') } 
          : { type: 'INVALID_INPUT', message: 'Day (1-31) required.' };
      default:
        return { type: 'INVALID_INPUT', message: 'Unsupported match type.' };
    }
  }
}