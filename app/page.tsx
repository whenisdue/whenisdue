import StateCombobox from "@/components/StateCombobox";
import { ShieldCheck, CheckCircle2, Lock, EyeOff } from "lucide-react";

export const metadata = {
  title: "WhenIsDue | 2026 Food Benefits & EBT Payment Dates",
  description: "Find your 2026 food benefit date. Choose your state to see your official payment schedule.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 🚀 THE OFFSET HERO: Deterministic pt-20 handles the h-16 fixed nav */}
      <section className="flex-grow flex flex-col justify-start pt-20 pb-32 px-6 bg-slate-900 text-white relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(37,99,235,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-12">
          
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] text-white">
              Find your 2026 <br/>
              <span className="text-slate-400">food benefit date.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 font-medium max-w-lg mx-auto leading-tight">
              Choose your state to see your official payment schedule.
            </p>
          </div>

          <div className="max-w-2xl mx-auto relative z-30">
            <StateCombobox />
            
            {/* 🚀 RELAXED DISCLOSURE: Improved readability */}
            <p className="mt-8 text-xs font-black uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              Private tool • Not a government agency
            </p>
          </div>

          {/* 🚀 REASSURANCE: Safe from dropdown overlap */}
          <div className="pt-20 border-t border-white/5">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
              
              <div className="flex items-center gap-2.5 text-slate-400 group">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-[0.05em]">Uses official state schedules</span>
              </div>
              
              <div className="hidden md:block w-px h-4 bg-white/10" />
              
              <div className="flex items-center gap-2.5 text-slate-400 group">
                <Lock className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-[0.05em]">No signup required</span>
              </div>

              <div className="hidden md:block w-px h-4 bg-white/10" />

              <div className="flex items-center gap-2.5 text-slate-400 group">
                <EyeOff className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-[0.05em]">No case number needed</span>
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}