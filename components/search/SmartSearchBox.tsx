"use client";

// RESEARCH APPLIED: Batch 2, Tab 9 (Request-keyed async state machine)
// RESEARCH APPLIED: Batch 2, Tab 7 (300ms debounce + AbortController + Stale Guard)
// RESEARCH APPLIED: Batch 2, Tab 6 (Rendering Exact Match vs Adjacent Context)

import React, { useState, useEffect, useRef } from "react";

// The shape of our Trust-Preserving API response
type SearchResponse = {
  status: string;
  message?: string;
  query?: { stateCode: string; programCode: string; rawIdentifier: string };
  match?: {
    sliceKey: string;
    groupLabel: string;
    depositDate: string;
    isExact: boolean;
  };
  adjacentGroups?: Array<{
    position: "previous" | "next";
    groupLabel: string;
    depositDate: string;
  }>;
};

export function SmartSearchBox() {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // 1. The 300ms Debounce Layer
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // 2. The Abortable Fetch Layer
  useEffect(() => {
    // If input is too short, explicitly clear results and don't hit the network
    if (debouncedQuery.trim().length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    let isCurrentRequest = true; // Stale-response sequence guard

    async function fetchSearch() {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        // Only commit the result if this is still the active request
        if (isCurrentRequest) {
          setResults(data);
          setIsLoading(false);
        }
      } catch (error: any) {
        // Ignore AbortErrors (caused by the user typing fast and canceling this fetch)
        if (error.name !== "AbortError" && isCurrentRequest) {
          setIsLoading(false);
        }
      }
    }

    fetchSearch();

    // 3. The Cleanup Function: Cancel in-flight requests if the user types again
    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [debouncedQuery]);

  // Close dropdown if user clicks outside (basic UX)
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

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg">
      
      {/* SEARCH INPUT */}
      <div className="relative">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
          placeholder="E.g., Texas SNAP 04..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        
        {/* Subtle Loading Indicator (preserves previous results while fetching) */}
        {isLoading && (
          <div className="absolute right-3 top-3.5">
            <div className="h-5 w-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* DROPDOWN RESULTS */}
      {isOpen && inputValue.length >= 2 && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
          
          {/* State: Incomplete Intent */}
          {results?.status === "incomplete_intent" && (
            <div className="p-4 text-sm text-gray-500 bg-gray-50">{results.message}</div>
          )}

          {/* State: Not Found */}
          {results?.status === "not_found" && (
            <div className="p-4 text-sm text-gray-500 bg-gray-50">{results.message}</div>
          )}

          {/* State: Exact Match Found */}
          {results?.status === "success" && results.match && (
            <div className="flex flex-col">
              
              {/* PRIMARY RESULT: The Exact Date */}
              <div className="p-5 border-b border-gray-100 bg-green-50/30">
                <p className="text-xs font-bold tracking-wider text-green-700 uppercase mb-1">
                  {results.query?.stateCode} {results.query?.programCode} Match
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  Group: <strong>{results.match.groupLabel}</strong>
                </p>
                <div className="text-2xl font-black text-gray-900">
                  {results.match.depositDate}
                </div>
              </div>

              {/* SECONDARY RESULT: Adjacent Context Window */}
              {results.adjacentGroups && results.adjacentGroups.length > 0 && (
                <div className="p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Nearby Schedule</p>
                  <div className="space-y-2">
                    {results.adjacentGroups.map((adj, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">Group {adj.groupLabel}</span>
                        <span className="font-medium text-gray-800">{adj.depositDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}