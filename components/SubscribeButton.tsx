"use client";

import { useOptimistic, startTransition, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

export default function SubscribeButton({ eventId, initialSubscribed }: { eventId: string; initialSubscribed: boolean }) {
  // We've replaced useActionState with local state temporarily to clear the "toggleSubscription" error.
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [optimisticSubscribed, setOptimisticSubscribed] = useOptimistic(isSubscribed);
  const [isPending, setIsPending] = useState(false);

  async function handleSubscribe(formData: FormData) {
    // We are commenting out the execution logic until your new /api/subscribe route is ready.
    /*
    try {
      setIsPending(true);
      // Future: Call your new /api/subscribe route here
      startTransition(() => {
        setOptimisticSubscribed(!optimisticSubscribed);
      });
    } catch (error: any) {
      alert("Subscription Error: " + error.message);
    } finally {
      setIsPending(false);
    }
    */
    alert("Subscription logic is temporarily disabled while we finish the new Audit-Grade backend.");
  }

  return (
    <form action={handleSubscribe}>
      <input type="hidden" name="eventId" value={eventId} />
      <button 
        type="submit"
        // We commented out the real action to clear the error
        // formAction={handleSubscribe} 
        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
          optimisticSubscribed 
            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
        }`}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 
         optimisticSubscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        <span className="text-xs font-bold uppercase tracking-widest">
          {optimisticSubscribed ? "Subscribed" : "Remind Me"}
        </span>
      </button>
    </form>
  );
}