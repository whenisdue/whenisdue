'use client';

import { useActionState, useEffect, useState } from 'react';
import { subscribeToEvent, type SubscribeState } from '@/app/actions/subscribe';
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

const initialState: SubscribeState = { status: 'idle', message: '' };

export default function FederalNotifyMeForm({ topicKey }: { topicKey: string }) {
  const [state, formAction, isPending] = useActionState(subscribeToEvent, initialState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-32 animate-pulse bg-slate-100 rounded-xl max-w-md mx-auto"></div>;
  }

  if (state.status === 'success') {
    return (
      <div className="max-w-md mx-auto bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center shadow-sm">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 mb-1">Alerts Confirmed</h3>
        <p className="text-emerald-700 text-sm">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="topicKey" value={topicKey} />
        
        {/* Cloudflare Turnstile Mock */}
        <input type="hidden" name="cf-turnstile-response" value="mock-token-for-dev" />

        <div className="flex flex-col sm:flex-row gap-2">
          <input 
            type="email" 
            name="email"
            required
            disabled={isPending}
            placeholder="you@example.com" 
            className="flex-grow px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-slate-900 bg-white" 
          />
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Alerts'}
          </button>
        </div>

        {state.status === 'error' && (
          <div className="flex items-center gap-2 text-red-700 text-sm mt-2 bg-red-50 border border-red-200 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{state.message}</p>
          </div>
        )}

        <div className="mt-4 flex items-start sm:items-center justify-center gap-2 text-xs text-slate-500 text-left sm:text-center">
          <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400 mt-0.5 sm:mt-0" />
          <span>We never ask for SSN or banking info. Unsubscribe anytime.</span>
        </div>
      </form>
    </div>
  );
}