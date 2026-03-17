"use client";

import React from 'react';
import { ShieldCheck, BellOff, AlertCircle, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../../context/DashboardProvider';

export function StatusHeader() {
  const { state, dispatch } = useDashboard();
  const { subscriber, isSyncing, error } = state.account;

  if (!subscriber) return <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-900/50 border border-slate-800" />;

  const handleTogglePause = async () => {
    const nextState = !subscriber.globalPause;
    dispatch({ type: "START_GLOBAL_PAUSE_SYNC", payload: nextState });

    try {
      // simulate delay: await new Promise(res => setTimeout(res, 1000));
      dispatch({ type: "COMMIT_GLOBAL_PAUSE" });
    } catch (e) {
      dispatch({ type: "ROLLBACK_GLOBAL_PAUSE", payload: { error: "Network error: Failed to sync notification status." } });
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="status-section-title">
      <h2 id="status-section-title" className="sr-only">Account and Delivery Status</h2>
      
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all">
        {/* Identity Block */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
            {subscriber.email[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight leading-none">
                {subscriber.email.replace(/(.{3})(.*)(?=@)/, "$1***")}
              </span>
              
              {/* Symmetrical Badging */}
              {subscriber.emailVerifiedAt ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" /> VERIFIED
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                  <AlertCircle className="h-3 w-3" /> UNVERIFIED
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-wider">Account ID: {subscriber.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Semantic Switch */}
        <div className="flex items-center gap-4 md:border-l md:border-slate-800 md:pl-6">
          <div className="text-right">
            <p id="notifications-active-label" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Notifications active
            </p>
            <p className={`text-sm font-medium transition-colors ${subscriber.globalPause ? 'text-amber-400' : 'text-emerald-400'}`}>
              {subscriber.globalPause ? 'Temporarily Paused' : 'Live & Monitoring'}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={!subscriber.globalPause}
            aria-labelledby="notifications-active-label"
            disabled={isSyncing}
            onClick={handleTogglePause}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
              subscriber.globalPause ? 'bg-slate-700' : 'bg-emerald-600'
            } ${isSyncing ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${subscriber.globalPause ? 'translate-x-1' : 'translate-x-6'}`} />
          </button>
        </div>
      </div>

      {/* Error Visibility */}
      {error && (
        <div role="alert" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Unverified Action Surface */}
      {!subscriber.emailVerifiedAt && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
          <BellOff className="h-5 w-5 text-amber-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-200">Delivery Blocked</h3>
            <p className="text-sm text-amber-200/70">Automatic benefit alerts are suspended until your address is confirmed.</p>
          </div>
          <button className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-tight">
            Resend Link
          </button>
        </div>
      )}
    </section>
  );
}