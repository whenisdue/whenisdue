import { getDeadLetterCount } from "./actions";
import { prisma } from "@/lib/prisma";
import { Activity, CheckCircle2, AlertCircle, Clock, RefreshCcw } from "lucide-react";

export default async function AdminDashboard() {
  // 1. HARDENED TIME CAPTURE: Frozen UTC for Audit Integrity
  const serverTime = new Date();
  Object.freeze(serverTime);
  const canonicalUtc = serverTime.toISOString();
  
  // 2. HUMAN DISPLAY: Formatted for operator readability
  const friendlyTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', 
    minute: 'numeric', 
    second: 'numeric', 
    hour12: true
  }).format(serverTime);

  // 3. PARALLEL METRIC FETCH: Strictly aligned with DB Status Invariants
  const [deadLetterCount, pendingCount, totalSent] = await Promise.all([
    getDeadLetterCount(),
    prisma.notificationOutbox.count({ where: { status: 'PENDING' } }),
    prisma.notificationOutbox.count({ where: { status: 'SENT' } }),
  ]);

  const stats = [
    { label: "Total Sent", value: totalSent, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Currently Pending", value: pendingCount, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Action Required", value: deadLetterCount, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="p-10 space-y-10 max-w-6xl">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 font-medium mt-1">Live health of the 2026 Notification Engine.</p>
        </div>
        
        {/* AUDIT-GRADE FRESHNESS TAG: Hover for ISO-8601 Canonical Time */}
        <div 
          className="flex flex-col items-end gap-1 cursor-help"
          title={`Canonical UTC: ${canonicalUtc}`}
        >
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
            <RefreshCcw className="w-3 h-3 text-blue-500 animate-spin-slow" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Last Rendered: {friendlyTime}
            </span>
          </div>
          {/* Dev-Mode Transparency: Surfaces exact UTC during development */}
          {process.env.NODE_ENV === "development" && (
            <span className="text-[9px] font-bold text-slate-400 font-mono pr-2">
              {canonicalUtc}
            </span>
          )}
        </div>
      </header>

      {/* STAT CARDS: Quantitative System Health */}
      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SYSTEM STATUS: Observability Pulse */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl shadow-blue-900/20 overflow-hidden relative border border-slate-800">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-400">Engine Live</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Observability initialized.</h2>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed font-medium">
            The notification orchestrator is monitoring terminal failures and pending deliveries across all state programs.
          </p>
        </div>
        <Activity className="w-40 h-40 text-slate-800 absolute -right-10 -bottom-10 rotate-12 opacity-50" />
      </div>

      {/* AUDIT ANCHOR: Canonical Time Visibility in Footer */}
      <footer className="pt-10 border-t border-slate-200 flex justify-between items-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          2026 Notification Infrastructure • Secure Segment
        </p>
        <p className="text-[9px] font-mono text-slate-300">
          REF: {canonicalUtc}
        </p>
      </footer>
    </div>
  );
}