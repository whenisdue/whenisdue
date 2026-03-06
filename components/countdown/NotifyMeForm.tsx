'use client';

import { useActionState, useEffect, useState } from 'react';
import { subscribeToEvent, type SubscribeState } from '@/app/actions/subscribe';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const initialState: SubscribeState = { status: 'idle', message: '' };

export default function NotifyMeForm({ topicKey }: { topicKey: string }) {
  const [state, formAction, isPending] = useActionState(subscribeToEvent, initialState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Prevent hydration mismatch by rendering a skeleton matching the form's height
    return <div className="h-32 animate-pulse bg-zinc-900/50 rounded-xl max-w-md mx-auto"></div>;
  }

  if (state.status === 'success') {
    return (
      <div className="max-w-md mx-auto bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-xl text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-bold text-white mb-1">Alert Confirmed</h3>
        <p className="text-emerald-400/80 text-sm">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-zinc-900/80 backdrop-blur border border-zinc-800 p-6 rounded-xl">
      <h3 className="font-bold text-white mb-2">Don't miss the reveal.</h3>
      <p className="text-zinc-400 text-sm mb-4">We will email you 5 minutes before the stream goes live.</p>
      
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="topicKey" value={topicKey} />
        
        {/* Cloudflare Turnstile Mock - Inject actual Turnstile script in production */}
        <input type="hidden" name="cf-turnstile-response" value="mock-token-for-dev" />

        <div className="flex gap-2">
          <input 
            type="email" 
            name="email"
            required
            disabled={isPending}
            placeholder="you@example.com" 
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 flex-grow text-white focus:outline-none focus:border-purple-500 disabled:opacity-50" 
          />
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Notify Me'}
          </button>
        </div>

        {state.status === 'error' && (
          <div className="flex items-center gap-2 text-red-400 text-xs mt-2 bg-red-400/10 p-2 rounded">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{state.message}</p>
          </div>
        )}

        <div className="flex items-start gap-2 text-left pt-2">
          <input type="checkbox" className="mt-1" required disabled={isPending} />
          <span className="text-[10px] text-zinc-500 leading-tight">
            Email me when this event starts. I understand I can unsubscribe at any time. See Privacy Policy.
          </span>
        </div>
      </form>
    </div>
  );
}