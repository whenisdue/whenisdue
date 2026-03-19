'use client';

import { useSubscriptionStore, SyncStatus, ErrorKind } from '@/store/subscription-store';
import { useSubscriptionReconciliation } from '@/hooks/use-subscription-reconciliation';

export function SubscriptionCard({ id }: { id: string }) {
  const sub = useSubscriptionStore((state) => state.getById(id));
  const { remove } = useSubscriptionStore();
  const { commit } = useSubscriptionReconciliation();

  if (!sub) return null;

  const handleRetry = () => {
    commit({ stateCode: sub.stateCode, programCode: sub.programCode, identifier: sub.identifierValue }, sub.id);
  };

  return (
    <div className="w-full max-w-sm border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b h-16 flex items-center justify-between">
        <h3 className="text-lg font-bold">{sub.programCode}</h3>
        <div className="h-6 flex items-center">
          {sub.serverStatus ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              sub.serverStatus === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
            }`}>{sub.serverStatus}</span>
          ) : ( <span className="text-[10px] font-bold text-gray-300 italic">Unverified</span> )}
        </div>
      </div>
      <div className="px-4 py-3 h-14 flex items-center bg-gray-50/50">
        <SyncStatusView status={sub.syncStatus} kind={sub.errorKind} onRetry={handleRetry} onDismiss={() => remove(sub.id)} />
      </div>
      <div className="p-4 h-20 border-t flex flex-col justify-center">
        <div className="text-xl font-mono font-black tabular-nums">
          {sub.nextDepositDate || <span className="text-gray-200">-- -- ----</span>}
        </div>
      </div>
    </div>
  );
}

function SyncStatusView({ status, kind, onRetry, onDismiss }: { status: SyncStatus; kind?: ErrorKind | null; onRetry: () => void; onDismiss: () => void }) {
  const base = "text-xs font-medium flex items-center gap-2 w-full";
  switch (status) {
    case 'PENDING': return <div className={`${base} text-blue-600 animate-pulse`}>Syncing...</div>;
    case 'STALE': return (
      <div className="flex justify-between w-full">
        <span className={`${base} text-amber-600`}>Network Stale</span>
        <button onClick={onRetry} className="bg-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded">RETRY</button>
      </div>
    );
    case 'ERROR': 
      const isProtocol = kind === 'PROTOCOL';
      return (
        <div className="flex justify-between w-full">
          <span className="text-red-600 font-medium truncate max-w-[150px]">{isProtocol ? 'Protocol Breach' : 'Sync Failed'}</span>
          <button onClick={isProtocol ? () => window.location.reload() : onDismiss} className="text-red-600 text-[10px] font-bold border border-red-600 px-3 py-1 rounded">
            {isProtocol ? 'REFRESH' : 'DISMISS'}
          </button>
        </div>
      );
    case 'REPLAYED': return <div className={`${base} text-gray-500`}>✓ Resolved from prior authoritative request</div>;
    case 'SYNCED': return <div className={`${base} text-green-600`}>✓ Verified Authoritative</div>;
    default: return null;
  }
}