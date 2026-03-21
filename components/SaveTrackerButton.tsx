"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, Loader2, CheckCircle2, ChevronRight } from "lucide-react";

interface SaveProps {
  stateCode: string;
  stateName: string;
  programCode: string;
  isAuthenticated: boolean;
}

export default function SaveTrackerButton({ stateCode, stateName, programCode, isAuthenticated }: SaveProps) {
  const [isExpanding, setIsExpanding] = useState(false);
  const [digit, setDigit] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleInitialClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setIsExpanding(true);
  };

  const confirmSave = async () => {
    if (!/^\d$/.test(digit)) return; // Simple validation: must be 1 digit
    
    setLoading(true);
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateCode,
          programCode,
          identifier: digit, // REAL DATA ONLY
          idempotencyKey: crypto.randomUUID(), // For network retry safety
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => router.push("/dashboard"), 1200);
      }
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-green-100 animate-in zoom-in-95 duration-200">
        <CheckCircle2 className="w-5 h-5" /> Added to Dashboard
      </div>
    );
  }

  return (
    <div className="relative">
      {!isExpanding ? (
        <button
          onClick={handleInitialClick}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-100 flex items-center gap-3"
        >
          <BookmarkPlus className="w-5 h-5" />
          Track {stateName} {programCode}
        </button>
      ) : (
        <div className="bg-white p-2 border-2 border-blue-600 rounded-2xl flex items-center gap-2 shadow-2xl animate-in slide-in-from-right-4 duration-200">
          <input
            type="text"
            maxLength={1}
            placeholder="#"
            className="w-12 h-12 text-center font-black text-xl text-slate-900 bg-slate-50 rounded-xl outline-none focus:bg-white transition-colors"
            value={digit}
            onChange={(e) => setDigit(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
          <div className="pr-2">
            <p className="text-[10px] font-black uppercase text-slate-400 leading-none">Enter Last Digit</p>
            <p className="text-[8px] font-bold text-slate-300 uppercase leading-tight">To verify schedule</p>
          </div>
          <button
            onClick={confirmSave}
            disabled={!digit || loading}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      )}
    </div>
  );
}