"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, ChevronRight, MapPin } from "lucide-react";
import { sendGAEvent } from '@next/third-parties/google';

type StateDefinition = {
  name: string;
  slug: string;
  code: string;
};

export default function SearchBar({ states }: { states: StateDefinition[] }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStates = states.filter(s => {
    const q = query.toLowerCase().trim();
    if (!q) return false;
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  }).slice(0, 6);

  return (
    <div className="w-full max-w-2xl mx-auto relative z-40" ref={wrapperRef}>
      
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-blue-600 group-focus-within:scale-110 transition-transform" />
        </div>
        <input
          type="text"
          id="state-search"
          className="w-full h-16 pl-16 pr-16 bg-slate-50 border-2 border-blue-500 rounded-2xl text-lg font-bold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 shadow-lg shadow-blue-100 transition-all"
          placeholder="Start typing your state..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length > 0);
          }}
          onFocus={() => {
            if (query.length > 0) setIsOpen(true);
          }}
        />
        {query && (
          <button 
            onClick={() => { setQuery(""); setIsOpen(false); }}
            className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute w-full mt-3 bg-white border-2 border-blue-100 rounded-2xl shadow-2xl overflow-hidden p-2">
          {filteredStates.length > 0 ? (
            <div className="space-y-1">
              {filteredStates.map((state) => (
                <Link
                  key={state.slug}
                  href={`/states/${state.slug}`}
                  onClick={() => {
                    setIsOpen(false);
                    // 🚀 Track the specific click event
                    sendGAEvent('event', 'state_result_click', {
                      state_name: state.name,
                      state_slug: state.slug,
                      state_code: state.code,
                      search_query: query.trim(),
                    });
                  }}
                  className="flex items-center justify-between p-4 hover:bg-blue-50 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-blue-800">
                        {state.name}
                      </h3>
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        2026 Payment Dates
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 font-bold italic text-sm">
              No state found. Try Alabama or Texas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}