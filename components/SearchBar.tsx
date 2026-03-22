"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, ChevronRight, MapPin } from "lucide-react";

// Updated type to handle States
type StateDefinition = {
  name: string;
  slug: string;
  code: string;
};

export default function SearchBar({ states }: { states: StateDefinition[] }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown if user clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter logic for States
  const filteredStates = states.filter(s => {
    const q = query.toLowerCase().trim();
    if (!q) return false;
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  }).slice(0, 6);

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    setIsOpen(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative z-40" ref={wrapperRef}>
      
      {/* 1. THE SEARCH INPUT - Osa Approved (Large & High Contrast) */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        </div>
        <input
          type="text"
          className="w-full h-20 pl-16 pr-16 bg-white border-4 border-slate-100 rounded-[2rem] text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-600 shadow-2xl transition-all"
          placeholder="Type your state name..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button 
            onClick={() => { setQuery(""); setIsOpen(false); }}
            className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-300 hover:text-slate-900"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* 2. QUICK CHIPS */}
      {!query && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {["Alabama", "California", "Florida", "New York", "Texas"].map((term) => (
            <button
              key={term}
              onClick={() => handleQuickSearch(term)}
              className="bg-white border-2 border-slate-100 hover:border-blue-200 text-slate-500 hover:text-blue-600 text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-sm"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* 3. DROPDOWN RESULTS */}
      {isOpen && query.length > 0 && (
        <div className="absolute w-full mt-4 bg-white border-2 border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden p-2">
          {filteredStates.length > 0 ? (
            <div className="space-y-1">
              {filteredStates.map((state) => (
                <Link
                  key={state.slug}
                  href={`/states/${state.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-5 hover:bg-blue-50 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl group-hover:bg-blue-100 transition-colors text-slate-400 group-hover:text-blue-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-800">
                        {state.name}
                      </h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Official 2026 Schedule
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase opacity-0 group-hover:opacity-100 transition-all">
                    View Dates <ChevronRight className="h-5 w-5" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-400 font-bold italic">No state found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}