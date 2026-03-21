import Link from "next/link";
import { Home, Map, AlertCircle, Search, ChevronRight } from "lucide-react";

// Note: not-found.tsx does not support metadata export in Next.js 13+, 
// it uses the root layout metadata automatically.

export default function NotFound() {
  return (
    <main className="min-h-[75vh] flex items-center justify-center p-6 font-sans bg-slate-50">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-slate-200/50 text-center relative overflow-hidden">
        
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* ICON */}
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm border border-blue-100 animate-pulse">
            <AlertCircle className="w-10 h-10" />
          </div>

          {/* TEXT CONTENT */}
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
              Route <span className="text-blue-600">Unresolved.</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto">
              The orchestration engine could not find the requested path. It may have moved or the link is expired.
            </p>
          </div>

          {/* QUICK LINKS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Link 
              href="/" 
              className="flex items-center justify-between gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] shadow-lg shadow-blue-200 group"
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4" />
                Return Home
              </div>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              href="/states" 
              className="flex items-center justify-between gap-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <Map className="w-4 h-4 text-blue-600" />
                State Directory
              </div>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* HELP TEXT */}
          <div className="pt-8 border-t border-slate-100 flex items-center justify-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-300" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              Verification System Active
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}