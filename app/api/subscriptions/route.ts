import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { createHash } from 'crypto';
import { Subscription } from '@prisma/client';

// 1. SHARED DOMAIN CONTRACT
const SUPPORTED_RULES: Record<string, Record<string, (digit: string) => number>> = {
  'CA': { 
    'SNAP': (digit) => parseInt(digit, 10) + 1, // Digit 0 = Day 1
    'TANF': () => 1 
  },
  'NY': { 
    'SNAP': (digit) => 10 + parseInt(digit, 10) 
  }
};

const CreateSubscriptionSchema = z.object({
  stateCode: z.enum(['CA', 'NY']),
  programCode: z.enum(['SNAP', 'TANF']),
  identifier: z.string().regex(/^\d$/),
  idempotencyKey: z.string().uuid(), 
}).strict();

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    // REPAIR: Cast to any to access custom session properties like 'id'
    const userId = (session?.user as any)?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.json();
    const result = CreateSubscriptionSchema.safeParse(rawBody);
    
    if (!result.success) {
      return NextResponse.json({ 
        error: "VALIDATION_FAILURE", 
        fields: result.error.flatten().fieldErrors 
      }, { status: 422 });
    }

    const { stateCode, programCode, identifier, idempotencyKey } = result.data;
    const subscriberId = userId;
    const action = "CREATE_SUBSCRIPTION";
    const payloadHash = createHash('sha256').update(JSON.stringify({stateCode, programCode, identifier})).digest('hex');

    // SEAL: TYPE-SAFE RESPONSE CONSTRUCTOR
    const buildResponse = (sub: Subscription, type: 'CREATED' | 'EXISTING', idKey: string) => ({
      subscription: {
        id: sub.id,
        stateCode: sub.stateCode,
        programCode: sub.programCode,
        identifierValue: sub.identifierValue,
        identifierLabel: `Last Digit: ${sub.identifierValue}`,
        nextDepositDate: sub.nextDepositDate.toISOString().split('T')[0],
        status: sub.status,
      },
      metadata: { 
        resultType: type, 
        idempotencyKey: idKey, 
        committedAt: sub.createdAt.toISOString() 
      }
    });

    try {
      const outcome = await prisma.$transaction(async (tx) => {
        // A. IDEMPOTENCY LOOKUP
        const existingReq = await tx.requestLog.findUnique({
          where: { request_idempotency_key: { subscriberId, action, idempotencyKey } }
        });

        if (existingReq) {
          if (existingReq.payloadHash !== payloadHash) throw new Error("IDEMPOTENCY_PAYLOAD_MISMATCH");
          return { body: existingReq.responseBody, status: existingReq.responseStatus };
        }

        // B. LOGICAL IDENTITY LOOKUP
        const existingSub = await tx.subscription.findUnique({
          where: { subscription_identity_key: { subscriberId, stateCode, programCode, identifierValue: identifier } }
        });

        if (existingSub) {
          const res = buildResponse(existingSub, 'EXISTING', idempotencyKey);
          await tx.requestLog.create({
            data: { idempotencyKey, subscriberId, action, payloadHash, responseStatus: 200, responseBody: res }
          });
          return { body: res, status: 200 };
        }

        // C. AUTHORITATIVE DERIVATION
        const rule = SUPPORTED_RULES[stateCode]?.[programCode];
        if (!rule) throw new Error("UNSUPPORTED_RULE_COMBINATION");
        
        const day = rule(identifier);
        const now = new Date();
        const nextDepositDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, day));

        const sub = await tx.subscription.create({
          data: { subscriberId, stateCode, programCode, identifierValue: identifier, nextDepositDate }
        });

        const res = buildResponse(sub, 'CREATED', idempotencyKey);
        await tx.requestLog.create({
          data: { idempotencyKey, subscriberId, action, payloadHash, responseStatus: 201, responseBody: res }
        });

        return { body: res, status: 201 };
      });

      return NextResponse.json(outcome.body, { status: outcome.status });

    } catch (dbError: any) {
      if (dbError.code === 'P2002') {
        const target = (dbError.meta?.target as string[]) || [];

        // RACE ON REQUEST IDENTITY
        if (target.includes('idempotencyKey')) {
          const winnerReq = await prisma.requestLog.findUnique({
            where: { request_idempotency_key: { subscriberId, action, idempotencyKey } }
          });
          if (winnerReq && winnerReq.payloadHash === payloadHash) {
            return NextResponse.json(winnerReq.responseBody, { status: winnerReq.responseStatus });
          }
        }

        // RACE ON LOGICAL IDENTITY
        if (target.includes('identifierValue')) {
          const winnerSub = await prisma.subscription.findUnique({
            where: { subscription_identity_key: { subscriberId, stateCode, programCode, identifierValue: identifier } }
          });
          if (winnerSub) {
            const res = buildResponse(winnerSub, 'EXISTING', idempotencyKey);
            // BACKFILL REPLAY LOG
            await prisma.requestLog.create({
              data: { idempotencyKey, subscriberId, action, payloadHash, responseStatus: 200, responseBody: res }
            }).catch(() => {}); 
            
            return NextResponse.json(res, { status: 200 });
          }
        }
      }
      throw dbError;
    }

  } catch (error: any) {
    if (error.message === "IDEMPOTENCY_PAYLOAD_MISMATCH") {
      return NextResponse.json({ error: "Idempotency conflict: payload mismatch." }, { status: 409 });
    }
    if (error.message === "UNSUPPORTED_RULE_COMBINATION") {
      return NextResponse.json({ error: "Rule combination not supported." }, { status: 422 });
    }
    console.error("[CRITICAL_FAILURE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}