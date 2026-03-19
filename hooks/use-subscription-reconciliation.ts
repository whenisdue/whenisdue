'use client';

import { z } from 'zod';
import { useSubscriptionStore } from '@/store/subscription-store';

const ServerSubscriptionStatus = z.enum(['ACTIVE', 'PAUSED']);

const ServerResponseSchema = z.object({
  subscription: z.object({
    id: z.string(),
    stateCode: z.string(),
    programCode: z.string(),
    identifierValue: z.string(),
    nextDepositDate: z.string(),
    status: ServerSubscriptionStatus, 
  }),
  metadata: z.object({
    resultType: z.enum(['CREATED', 'EXISTING']),
    idempotencyKey: z.string().uuid(),
  }),
});

const ErrorResponseSchema = z.object({ error: z.string() });
const inFlightKeys = new Set<string>();

async function computeFingerprint(data: Record<string, string>): Promise<string> {
  const sortedKeys = Object.keys(data).sort();
  const canonical = JSON.stringify(sortedKeys.reduce((acc, key) => {
    acc[key] = data[key];
    return acc;
  }, {} as Record<string, string>));
  
  const msgBuffer = new TextEncoder().encode(canonical);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useSubscriptionReconciliation() {
  const { upsert, getById } = useSubscriptionStore();

  const commit = async (formData: { stateCode: string; programCode: string; identifier: string }, existingKey?: string) => {
    const normalized = {
      stateCode: formData.stateCode.trim().toUpperCase(),
      programCode: formData.programCode.trim().toUpperCase(),
      identifierValue: formData.identifier.trim(),
    };
    
    const payloadHash = await computeFingerprint(normalized);
    const idempotencyKey = existingKey || window.crypto.randomUUID();

    if (inFlightKeys.has(idempotencyKey)) return;

    const existingRecord = getById(idempotencyKey);
    if (existingRecord && existingRecord.payloadHash !== payloadHash) {
      upsert({ id: idempotencyKey, syncStatus: 'ERROR', isOptimistic: false, errorKind: 'CONFLICT', error: 'Integrity: Mutation.' });
      return;
    }

    inFlightKeys.add(idempotencyKey);
    let timerId: number | undefined;

    try {
      upsert({ id: idempotencyKey, ...normalized, payloadHash, syncStatus: 'PENDING', isOptimistic: true, error: null, errorKind: null });

      const controller = new AbortController();
      timerId = window.setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ ...normalized, idempotencyKey }),
        signal: controller.signal
      });

      if (timerId) window.clearTimeout(timerId);

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) throw new Error('CONTRACT_VIOLATION_JSON');

      const rawJson = await res.json();
      
      if (res.status === 409 || res.status === 422) {
        const errorData = ErrorResponseSchema.parse(rawJson);
        upsert({ id: idempotencyKey, syncStatus: 'ERROR', isOptimistic: false, errorKind: res.status === 409 ? 'CONFLICT' : 'VALIDATION', error: errorData.error });
        return;
      }

      if (!res.ok) throw new Error(`SERVER_FAULT_${res.status}`);

      const parsed = ServerResponseSchema.parse(rawJson);
      if (parsed.metadata.idempotencyKey !== idempotencyKey) throw new Error('CONTRACT_VIOLATION_IDENTITY');

      upsert({
        id: idempotencyKey,
        serverId: parsed.subscription.id,
        stateCode: parsed.subscription.stateCode,
        programCode: parsed.subscription.programCode,
        identifierValue: parsed.subscription.identifierValue,
        nextDepositDate: parsed.subscription.nextDepositDate,
        serverStatus: parsed.subscription.status, 
        syncStatus: parsed.metadata.resultType === 'EXISTING' ? 'REPLAYED' : 'SYNCED',
        isOptimistic: false, error: null, errorKind: null
      });

    } catch (err: unknown) {
      if (timerId) window.clearTimeout(timerId);
      const isZodError = err instanceof z.ZodError;
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      const errorMessage = err instanceof Error ? err.message : 'UNKNOWN';
      const isContractFailure = isZodError || errorMessage.startsWith('CONTRACT_VIOLATION');

      upsert({
        id: idempotencyKey,
        syncStatus: isTimeout ? 'STALE' : 'ERROR',
        isOptimistic: isTimeout, 
        errorKind: isTimeout ? 'TRANSPORT' : (isContractFailure ? 'PROTOCOL' : 'TRANSPORT'),
        error: isTimeout ? 'Network timeout. Ready to retry.' : 'System error.'
      });
    } finally {
      inFlightKeys.delete(idempotencyKey);
    }
  };

  return { commit };
}