"use client";

import { useActionState, useOptimistic, startTransition } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { urlBase64ToUint8Array } from "@/lib/notifications";
import { toggleSubscription } from "@/actions/notifications";

export default function SubscribeButton({ eventId, initialSubscribed }: { eventId: string; initialSubscribed: boolean }) {
  const [state, formAction, isPending] = useActionState(toggleSubscription, { subscribed: initialSubscribed });
  const [optimisticSubscribed, setOptimisticSubscribed] = useOptimistic(state.subscribed);

  async function handleSubscribe(formData: FormData) {
    try {
      if (!optimisticSubscribed) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Please enable notifications in your browser settings to subscribe.");
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          alert("VAPID key is missing! Please restart your dev server (Ctrl+C then npm run dev).");
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js");
        const pushSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });
        
        formData.append("pushDetails", JSON.stringify(pushSub));
      }

      startTransition(() => {
        setOptimisticSubscribed(!optimisticSubscribed);
        formAction(formData);
      });
    } catch (error: any) {
      alert("Subscription Error: " + error.message);
    }
  }

  return (
    <form action={handleSubscribe}>
      <input type="hidden" name="eventId" value={eventId} />
      <button 
        type="submit"
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