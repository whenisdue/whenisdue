"use client";

import React, { useEffect, useState, useMemo } from "react";
import { savePushSubscription } from "@/app/actions/save-subscription";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isAppleMobile = /iPhone|iPad|iPod/i.test(ua);
  const isIpadOS13Plus = /Macintosh/i.test(ua) && typeof (navigator as any).maxTouchPoints === "number" && (navigator as any).maxTouchPoints > 1;
  return isAppleMobile || isIpadOS13Plus;
}

export default function SubscribeButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "subscribed" | "error" | "unsupported">("idle");
  const [isStandalone, setIsStandalone] = useState(false);
  const [vapidKeyArray, setVapidKeyArray] = useState<Uint8Array | null>(null);
  
  const isIOS = useMemo(() => detectIOS(), []);

  useEffect(() => {
    // 1. Pre-compute the cryptographic key on idle to save INP time during click
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (vapidPublicKey) {
      setVapidKeyArray(urlBase64ToUint8Array(vapidPublicKey));
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    } else {
      setStatus("unsupported");
    }

    if (typeof window !== "undefined") {
      const navStandalone = Boolean((window.navigator as any).standalone);
      const mqlStandalone = window.matchMedia("(display-mode: standalone)").matches;
      setIsStandalone(navStandalone || mqlStandalone);
      
      if ("Notification" in window && Notification.permission === "granted") {
        setStatus("subscribed");
      }
    }
  }, []);

  const handleSubscribe = async () => {
    // INP Optimization: Set state immediately and yield to the browser paint cycle
    setStatus("loading");
    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
      if (Notification.permission === "denied") throw new Error("Notifications blocked.");
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") throw new Error("Permission denied.");
      }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setStatus("subscribed");
        return;
      }

      if (!vapidKeyArray) throw new Error("Missing VAPID key");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // TypeScript Fix: Cast to any to bypass the ArrayBufferLike mismatch
        applicationServerKey: vapidKeyArray as any, 
      });

      const res = await savePushSubscription(sub.toJSON());
      if (!res.ok) throw new Error("Failed to save to database");

      setStatus("subscribed");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (status === "unsupported") return null;

  if (isIOS && !isStandalone) {
    return (
      <div className="bg-black/30 border border-blue-500/30 p-4 rounded-xl text-xs text-blue-200 text-left animate-in fade-in">
        <strong className="text-blue-400 block mb-1">iOS Detected:</strong> 
        To enable millisecond alerts, tap the <span className="text-white border border-gray-600 px-1 rounded mx-1">Share</span> 
        icon below and select <span className="text-white border border-gray-600 px-1 rounded mx-1">Add to Home Screen</span>.
      </div>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={status === "loading" || status === "subscribed"}
      className={`w-full md:w-auto px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
        status === "subscribed" 
          ? "bg-green-500 text-black cursor-default" 
          : "bg-white text-blue-600 hover:bg-gray-100 disabled:opacity-50"
      }`}
    >
      {status === "idle" && "Notify Me"}
      {status === "loading" && "Securing Protocol..."}
      {status === "subscribed" && "✓ Protocol Active"}
      {status === "error" && "Error - Try Again"}
    </button>
  );
}