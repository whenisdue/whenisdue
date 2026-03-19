"use client";

import { useState } from "react";
import { BellRing, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { createSubscriptionAction } from "../../actions/subscribe";

interface Props {
  stateCode: string;
  programCode: string;
  identifierValue: string;
  nextDepositDateIso: string;
}

export default function SubscribeWidget({ stateCode, programCode, identifierValue, nextDepositDateIso }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"IDLE" | "PENDING" | "SUCCESS" | "ERROR">("IDLE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("PENDING");

    const result = await createSubscriptionAction({
      email,
      stateCode,
      programCode,
      identifierValue,
      nextDepositDateIso
    });

    if (result?.success) setStatus("SUCCESS");
    else setStatus("ERROR");
  };

  if (status === "SUCCESS") {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center animate-in zoom-in duration-300">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="font-black text-emerald-900 text-sm uppercase tracking-tighter">Alerts Enabled</p>
        <p className="text-emerald-700 text-xs font-medium">Subscription intent verified and synced.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <form onSubmit={handleSubmit} className="relative group flex items-center">
        <div className="absolute left-4 pointer-events-none">
          <BellRing className={`w-4 h-4 ${status === 'ERROR' ? 'text-red-400' : 'text-slate-400'}`} />
        </div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Get email alerts for this date"
          className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-11 pr-32 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all shadow-sm"
        />
        <button
          type="submit"
          disabled={status === "PENDING"}
          className="absolute right-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
        >
          {status === "PENDING" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remind Me"}
        </button>
      </form>
      {status === "ERROR" && (
        <p className="text-[10px] font-bold text-red-500 mt-2 flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" /> System error. Please try again later.
        </p>
      )}
    </div>
  );
}