"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { useDashboard } from '../../context/DashboardProvider';
import { AuditRow } from './AuditRow';

export function AuditFeed() {
  const { state, dispatch } = useDashboard();
  const { logs, filter } = state.audit;

  const filteredLogs = logs.filter(log => 
    log.subject.toLowerCase().includes(filter.toLowerCase()) ||
    log.providerMessageId?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <section className="space-y-4" aria-labelledby="audit-heading">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 id="audit-heading" className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Delivery Audit Feed</h2>
          <p className="text-[10px] text-slate-600 font-mono">IMMUTABLE LOGS // TRACEABILITY ACTIVE</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
          <input 
            type="text" placeholder="Search logs..." value={filter}
            onChange={(e) => dispatch({ type: 'SET_AUDIT_FILTER', payload: e.target.value })}
            className="w-full md:w-80 bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-300 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
        <table className="w-full border-collapse">
          <caption className="sr-only">Delivery audit ledger: UTC timestamps, events, status, and provider IDs.</caption>
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-left">Timestamp (UTC)</th>
              <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-left">Event</th>
              <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-left">Status</th>
              <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Provider ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (<AuditRow key={log.id} log={log} />))}
          </tbody>
        </table>
      </div>
    </section>
  );
}