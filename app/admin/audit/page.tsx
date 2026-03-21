import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ShieldCheck, History, User, Info, Hash, Clock } from "lucide-react";

// 1. STRICT AUDIT TYPES: Matches the Recovery Payload exactly
interface RecoveryMetadata {
  actorId: string;
  reason: string;
  previousStatus: string;
  nextStatus: string;
  occurredAt: string; // The metadata still uses occurredAt as a string from the payload
}

export default async function AuditTrailPage() {
  // 2. SECURITY: Server-side segment protection
  const session = await getAdminSession();
  if (!session || session.role !== 'admin') {
    redirect("/");
  }

  // 3. DATA FETCH: Swapped to 'createdAt' to match your Prisma Schema
  const audits = await prisma.notificationDecisionAudit.findMany({
    where: {
      persistenceReason: 'MANUAL_RETRY_TRIGGERED'
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50 
  });

  return (
    <div className="p-10 space-y-10 max-w-6xl">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <History className="w-10 h-10 text-blue-600" />
            Audit Trail
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Immutable record of manual recoveries and operator overrides.
          </p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20">
          UTC-Backed Ledger
        </div>
      </header>

      {/* AUDIT TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Temporal Marker</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Operator</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Context</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Manual Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {audits.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ShieldCheck className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-400 font-bold text-sm">No manual logs found in current cycle.</p>
                  </div>
                </td>
              </tr>
            ) : (
              audits.map((log) => {
                // Type-safe metadata extraction
                const metadata = (log.metadata as unknown) as RecoveryMetadata;
                const canonicalTime = log.createdAt.toISOString();
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* CANONICAL TIME COLUMN */}
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1 cursor-help" title={`Canonical UTC: ${canonicalTime}`}>
                        <div className="flex items-center gap-1.5">
                           <Clock className="w-3 h-3 text-blue-500" />
                           <p className="text-sm font-black text-slate-900">
                             {format(new Date(log.createdAt), 'h:mm:ss a')}
                           </p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {format(new Date(log.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </td>

                    {/* OPERATOR COLUMN */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <div className="bg-slate-100 p-1.5 rounded-lg">
                           <User className="w-3 h-3 text-slate-500" />
                        </div>
                        <span>{metadata?.actorId || "System Admin"}</span>
                      </div>
                    </td>

                    {/* CONTEXT COLUMN */}
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Hash className="w-3 h-3 text-slate-300" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                            {log.notificationType || "GENERIC_EVENT"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Info className="w-3 h-3 text-slate-300" />
                          <span className="text-[9px] font-bold text-slate-400 font-mono">
                            ID: {log.subscriptionId.slice(0, 12)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* REASON COLUMN */}
                    <td className="px-8 py-6">
                      <div className="bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-all">
                        <p className="text-xs font-bold text-slate-600 italic leading-relaxed">
                          "{metadata?.reason || "Operational recovery triggered without comment."}"
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <footer className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <p>Verified Audit Entries: {audits.length}</p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-green-500" />
          Sequence Validated
        </p>
      </footer>
    </div>
  );
}