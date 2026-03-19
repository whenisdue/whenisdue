"use client";

import React from 'react';
import { Calendar, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Subscription } from '../../context/DashboardProvider';

interface Props {
  subscription: Subscription;
  onDelete: (id: string) => void;
}

export function SubscriptionCard({ subscription, onDelete }: Props) {
  const isLocked = subscription.isSyncing;

  const formatDateSafe = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }).format(date);
  };

  return (
    <article 
      className={`group relative flex h-[200px] flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/60 ${isLocked ? 'opacity-40 grayscale-[50%]' : ''}`}
      aria-busy={isLocked}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              {subscription.stateCode}
            </span>
            <h3 className="text-sm font-bold tracking-tight text-slate-200 uppercase">{subscription.programCode}</h3>
          </div>
          <p className="text-[11px] font-medium text-slate-500 italic">{subscription.identifierLabel}</p>
        </div>
        <div 
          role="status"
          aria-label={`Status: ${subscription.status}`}
          className={`h-2 w-2 rounded-full ${subscription.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} 
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Next Expected Deposit</span>
            <span className="text-sm font-semibold text-slate-200">{formatDateSafe(subscription.nextDepositDate)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800/50 pt-4">
        <div className="flex gap-3">
          <button disabled={isLocked} aria-label={`Edit tracking for ${subscription.programCode}`} className="text-slate-500 hover:text-slate-300">
            <Pencil className="h-4 w-4" />
          </button>
          <button disabled={isLocked} aria-label={`View full ${subscription.stateCode} schedule`} className="text-slate-500 hover:text-emerald-400">
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
        <button 
          disabled={isLocked}
          onClick={() => !isLocked && onDelete(subscription.id)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-red-400 transition-colors uppercase tracking-tighter"
        >
          {isLocked ? (
             <span className="flex items-center gap-1.5 text-amber-500/80">
               <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
               <span className="animate-pulse">Removing</span>
             </span>
          ) : (
            <><Trash2 className="h-3.5 w-3.5" />Remove</>
          )}
        </button>
      </div>
    </article>
  );
}