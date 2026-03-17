"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertCircle, Skull, Copy, Check, XCircle } from 'lucide-react';
import { NotificationLog } from '../../context/DashboardProvider';

interface Props { log: NotificationLog; }

export function AuditRow({ log }: Props) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (copyStatus !== 'idle') {
      const t = setTimeout(() => setCopyStatus('idle'), 2500);
      return () => clearTimeout(t);
    }
  }, [copyStatus]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(log.providerMessageId || '');
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
    }
  };

  const getStatusBadge = (status: NotificationLog['status']) => {
    const base = "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase tracking-tighter w-fit";
    const icons = {
      delivered: <CheckCircle2 aria-hidden="true" className="h-3 w-3" />,
      sent: <CheckCircle2 aria-hidden="true" className="h-3 w-3" />,
      retrying: <Clock aria-hidden="true" className="h-3 w-3" />,
      failed: <AlertCircle aria-hidden="true" className="h-3 w-3" />,
      dead_letter: <Skull aria-hidden="true" className="h-3 w-3" />,
    };

    switch (status) {
      case 'delivered': return <span className={`${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>{icons.delivered} Delivered</span>;
      case 'sent': return <span className={`${base} bg-blue-500/10 text-blue-400 border-blue-500/20`}>{icons.sent} Sent</span>;
      case 'retrying': return <span className={`${base} bg-amber-500/10 text-amber-400 border-amber-500/20`}>{icons.retrying} Retrying</span>;
      case 'failed': return <span className={`${base} bg-red-500/10 text-red-400 border-red-500/20`}>{icons.failed} Failed</span>;
      case 'dead_letter': return <span className={`${base} bg-purple-500/10 text-purple-400 border-purple-500/20`}>{icons.dead_letter} Dropped</span>;
      default: return <span className={`${base} bg-slate-500/10 text-slate-400 border-slate-500/20`}>Unknown</span>;
    }
  };

  return (
    <tr className="hover:bg-slate-800/10 transition-colors border-b border-slate-800/50 last:border-0 group">
      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap text-left">
        {new Intl.DateTimeFormat('en-GB', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC'
        }).format(new Date(log.sentAt)).replace(',', '')}
      </td>
      <td className="px-4 py-3 text-xs font-medium text-slate-200 text-left">{log.subject}</td>
      <td className="px-4 py-3 text-left">{getStatusBadge(log.status)}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2 font-mono text-[10px]">
          <span className="text-slate-500 truncate max-w-[120px]">{log.providerMessageId || 'system_internal'}</span>
          {log.providerMessageId && (
            <div className="relative">
              <button 
                onClick={handleCopy}
                className={`p-1 transition-all rounded ${copyStatus === 'error' ? 'text-red-400' : 'text-slate-600 hover:text-slate-300'}`}
                aria-label={copyStatus === 'success' ? `Copied for ${log.subject}` : copyStatus === 'error' ? `Copy failed for ${log.subject}` : `Copy provider ID`}
              >
                {copyStatus === 'success' ? <Check aria-hidden="true" className="h-3 w-3 text-emerald-400" /> : 
                 copyStatus === 'error' ? <XCircle aria-hidden="true" className="h-3 w-3" /> : 
                 <Copy aria-hidden="true" className="h-3 w-3" />}
              </button>
              <div aria-live="polite" className="sr-only">
                {copyStatus === 'success' && `Provider ID copied for ${log.subject}`}
                {copyStatus === 'error' && `Copy failed for ${log.subject}`}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}