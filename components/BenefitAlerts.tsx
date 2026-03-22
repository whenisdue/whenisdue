"use client";

import { Mail, BellRing, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function BenefitAlerts({ stateName }: { stateName: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for your newsletter service (e.g., Beehiiv, ConvertKit) goes here
    console.log("Subscribed:", email);
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div className="my-8 p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] text-center space-y-3">
        <div className="bg-emerald-500 w-12 h-12 rounded-full flex items-center justify-center text-white mx-auto shadow-lg">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-black text-slate-900">You're on the list!</h3>
        <p className="text-slate-600 font-bold">We'll email you if the {stateName} 2026 schedule changes.</p>
      </div>
    );
  }

  return (
    <div className="my-8 p-8 bg-white border-2 border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-100 relative overflow-hidden group">
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3 text-blue-600">
          <BellRing className="w-6 h-6 animate-bounce" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-900">Benefit Alerts</span>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
            Get {stateName} 2026 Schedule Updates
          </h3>
          <p className="text-slate-500 font-medium leading-relaxed max-w-md">
            State agencies often change deposit dates during holidays. Join 4,200+ families getting verified alerts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input 
            type="email" 
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-blue-600 transition-all"
          />
          <button 
            type="submit"
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
          >
            Notify Me <Mail className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}