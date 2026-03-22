"use client";

import { Mail, BellRing, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function BenefitAlerts({ stateName, variant = "default" }: { stateName: string, variant?: "default" | "hero" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const isHero = variant === "hero";

  if (status === "success") {
    return (
      <div className={`p-4 rounded-2xl text-center ${isHero ? 'bg-white/10 text-white' : 'bg-emerald-50 text-slate-900 border-2 border-emerald-100'}`}>
        <p className="text-sm font-black">✓ You're on the list for {stateName} updates!</p>
      </div>
    );
  }

  return (
    <div className={isHero ? "w-full max-w-md" : "my-8 p-8 bg-white border-2 border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-100"}>
      <div className="space-y-4">
        {!isHero && (
          <div className="flex items-center gap-3 text-blue-600">
            <BellRing className="w-6 h-6 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">Benefit Alerts</span>
          </div>
        )}

        <div className="space-y-1">
          <h3 className={`font-black tracking-tight leading-tight ${isHero ? 'text-blue-400 text-sm uppercase tracking-widest' : 'text-slate-900 text-2xl'}`}>
            {isHero ? "Get Schedule Alerts" : `Get ${stateName} 2026 Schedule Updates`}
          </h3>
          {!isHero && (
            <p className="text-slate-500 font-medium leading-relaxed max-w-md">
              State agencies often change dates. Join 4,200+ families getting verified alerts.
            </p>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setStatus("success"); }} className="flex flex-col sm:flex-row gap-2">
          <input 
            type="email" 
            required
            placeholder="Enter email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`flex-1 px-4 py-3 rounded-xl font-bold focus:outline-none transition-all text-sm ${isHero ? 'bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20' : 'bg-slate-50 border-2 border-slate-200 text-slate-900 focus:border-blue-600'}`}
          />
          <button 
            type="submit"
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isHero ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
          >
            Notify Me <Mail className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}