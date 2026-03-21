import { signIn } from "@/auth";
import { ShieldCheck, LogIn, Globe } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-6 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-12 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden">
        
        {/* Decorative branding element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="text-center space-y-4">
          <div className="bg-blue-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]">
            Identity Verification
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Dashboard</h1>
          <p className="text-slate-500 font-medium leading-relaxed text-sm">
            Sign in to securely manage your personalized 2026 benefit schedules and notification alerts.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
          className="space-y-4"
        >
          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white h-14 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all active:scale-[0.98] shadow-xl shadow-slate-200 group"
          >
            <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            Sign in with Google
          </button>
        </form>

        <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-300" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Verified Infrastructure
            </p>
          </div>
          <p className="text-[9px] text-slate-400 text-center leading-relaxed italic">
            By signing in, you agree to our Terms of Service and Privacy Policy regarding automated data synchronization.
          </p>
        </div>
      </div>
      
      <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        WhenIsDue Orchestration Division • 2026
      </p>
    </div>
  );
}