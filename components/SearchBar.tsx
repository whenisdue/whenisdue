"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, ChevronRight, FileText } from "lucide-react";

type SearchEvent = {
  title: string;
  slug: string;
  category: string;
};

// URL INTERCEPTOR: Translates old slugs to the new canonical routes
function buildLink(category: string, slug: string): string {
  const cat = category.toLowerCase();
  
  // Intercept any state SNAP schedules and route to the new clean structure
  if (cat === "state" && slug.includes("snap-deposit-schedule")) {
    const parts = slug.split('-');
    // Extract state name (e.g., from snap-deposit-schedule-michigan-2026 -> michigan)
    const stateName = parts[parts.length - 2];
    
    const activeStates = [
      "alabama", "florida", "georgia", "california", "texas", 
      "new-york", "tennessee", "ohio", "north-carolina", 
      "arizona", "virginia", "michigan", "indiana"
    ];

    if (activeStates.includes(stateName)) {
      return `/snap/${stateName}`;
    }
  }

  return `/${cat}/${slug}`;
}

export default function SearchBar({ events }: { events: SearchEvent[] }) {
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

  // THE FIX: Handles multi-word phrases AND checks beginning of words safely
  const filteredEvents = events.filter(e => {
    const q = query.toLowerCase().trim();
    if (!q) return false;

    const titleLower = e.title.toLowerCase();
    const categoryLower = e.category.toLowerCase();

    // Matches if the title starts with the query, OR if any word inside the title starts with the query (indicated by a space before it)
    const matchesTitle = titleLower.startsWith(q) || titleLower.includes(` ${q}`);
    const matchesCategory = categoryLower.startsWith(q);

    return matchesTitle || matchesCategory;
  }).slice(0, 5); 

  // Handle Quick Chip clicks
  const handleQuickSearch = (term: string) => {
    setQuery(term);
    setIsOpen(true);
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative z-40" ref={wrapperRef}>
      
      {/* 1. THE MASSIVE SEARCH INPUT */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-slate-400" />
        </div>
        <input
          type="text"
          className="w-full h-16 pl-12 pr-12 bg-white border-2 border-slate-200 rounded-xl text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 shadow-sm transition-all"
          placeholder="Search for a benefit program (e.g., SNAP, Social Security)..."
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
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* 2. QUICK ACCESS CHIPS */}
      {!query && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">Popular:</span>
          {["Social Security", "VA Disability", "SSI", "Tax"].map((term) => (
            <button
              key={term}
              onClick={() => handleQuickSearch(term)}
              className="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 text-sm font-semibold px-4 py-2 rounded-full transition-colors shadow-sm"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* 3. AUTO-SUGGEST DROPDOWN RESULTS */}
      {isOpen && query.length > 0 && (
        <div className="absolute w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {filteredEvents.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredEvents.map((event) => (
                <Link
                  key={event.slug}
                  // We use our new buildLink interceptor here
                  href={buildLink(event.category, event.slug)}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-4 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <FileText className="h-5 w-5 text-slate-500 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-800 line-clamp-1">
                        {event.title}
                      </h3>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {event.category}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-base font-medium text-slate-600 mb-1">No exact match found.</p>
              <p className="text-sm text-slate-500">Try browsing the <Link href="/agencies" className="text-blue-600 font-bold hover:underline">Program Directory</Link>.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}