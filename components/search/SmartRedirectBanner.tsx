"use client";

import { History, X, ArrowRight } from "lucide-react";
import { SavedLookup } from "@/lib/search/use-search-persistence";

interface SmartRedirectBannerProps {
  data: SavedLookup;
  onResume: (data: SavedLookup) => void;
  onDismiss: () => void;
}

export default function SmartRedirectBanner({ data, onResume, onDismiss }: SmartRedirectBannerProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-3 shadow-sm group hover:border-blue-200 transition-all">
        <button 
          onClick={() => onResume(data)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
            <History className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resume Last Lookup</p>
            <p className="text-sm font-bold text-slate-900">
              Continue with {data.stateName} SNAP?
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button 
             onClick={() => onResume(data)}
            className="hidden sm:flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700"
          >
            Resume <ArrowRight className="w-3 h-3" />
          </button>
          <div className="w-px h-8 bg-slate-100 mx-1 hidden sm:block" />
          <button 
            onClick={onDismiss}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
            aria-label="Dismiss suggestion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}