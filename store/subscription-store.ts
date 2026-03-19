import { create } from 'zustand';

export type SyncStatus = 'PENDING' | 'SYNCED' | 'REPLAYED' | 'STALE' | 'ERROR';
export type ServerStatus = 'ACTIVE' | 'PAUSED';
export type ErrorKind = 'VALIDATION' | 'CONFLICT' | 'PROTOCOL' | 'TRANSPORT';

export interface SubscriptionRecord {
  id: string;                // ALWAYS the client-side idempotencyKey
  serverId?: string;         // The Database ID
  stateCode: string;
  programCode: string;
  identifierValue: string;
  syncStatus: SyncStatus;
  serverStatus: ServerStatus | null;
  nextDepositDate: string | null;
  isOptimistic: boolean;
  payloadHash: string;
  error?: string | null;
  errorKind?: ErrorKind | null;
}

interface SubscriptionState {
  subscriptions: Record<string, SubscriptionRecord>;
  upsert: (record: Partial<SubscriptionRecord> & { id: string }) => void;
  remove: (id: string) => void;
  getById: (id: string) => SubscriptionRecord | undefined;
}

function createSubscriptionRecord(data: Partial<SubscriptionRecord> & { id: string }): SubscriptionRecord {
  const required: (keyof SubscriptionRecord)[] = [
    'id', 'stateCode', 'programCode', 'identifierValue', 
    'syncStatus', 'payloadHash', 'isOptimistic'
  ];

  for (const key of required) {
    if (data[key] === undefined) throw new Error(`STORE_INVARIANT: Missing ${key}`);
  }

  return {
    id: data.id,
    stateCode: data.stateCode!,
    programCode: data.programCode!,
    identifierValue: data.identifierValue!,
    syncStatus: data.syncStatus!,
    payloadHash: data.payloadHash!,
    isOptimistic: data.isOptimistic!,
    serverStatus: data.serverStatus ?? null,
    nextDepositDate: data.nextDepositDate ?? null,
    serverId: data.serverId,
    error: data.error ?? null,
    errorKind: data.errorKind ?? null,
  };
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: {},
  upsert: (record) => set((state) => {
    const existing = state.subscriptions[record.id];
    const finalRecord = existing ? { ...existing, ...record } : createSubscriptionRecord(record);
    return { subscriptions: { ...state.subscriptions, [record.id]: finalRecord } };
  }),
  remove: (id) => set((state) => {
    const { [id]: _, ...remaining } = state.subscriptions;
    return { subscriptions: remaining };
  }),
  getById: (id) => get().subscriptions[id],
}));