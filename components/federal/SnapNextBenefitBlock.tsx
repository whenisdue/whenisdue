"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface OfficialDate {
  month?: string;
  date: string;
  group?: string;
}

export default function SnapNextBenefitBlock({ dates, eventId }: { dates: OfficialDate[], eventId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [copied, setCopied] = useState(false);
  const [todayDateOnly, setTodayDateOnly] = useState("");

  const g = searchParams.get("g");
  const m = searchParams.get("m");

  useEffect(() => {
    // Determine user's local "today" without timezone hydration mismatch
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setTodayDateOnly(`${year}-${month}-${day}`);
  }, []);

  // Filter groups dynamically based on selected month (handles CT rule switch automatically)
  const availableDatesForMonth = m ? dates.filter(d => d.month === m) : dates;
  const groups = Array.from(new Set(availableDatesForMonth.map(d => d.group || "Unknown"))).sort((a, b) => a.localeCompare(b));
  const months = Array.from(new Set(dates.map(d => d.month || "Unknown")));

  const filteredDates = dates.filter(d => {
    if (g && d.group !== g) return false;
    if (m && d.month !== m) return false;
    return true;
  });

  const upcomingDates = filteredDates
    .filter(d => todayDateOnly ? d.date >= todayDateOnly : true)
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextPayment = upcomingDates.length > 0 ? upcomingDates[0] : null;

  const handleFilter = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(key, val);
    else params.delete(key);

    // If month changes, and the current group isn't valid for the new month (e.g., CT), clear group
    if (key === 'm') {
       const validGroupsForNewMonth = new Set(dates.filter(d => d.month === val || !val).map(d => d.group));
       if (g && !validGroupsForNewMonth.has(g)) {
           params.delete('g');
       }
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const copyLink = () => {
    const url = `${window.location.origin}${pathname}?${searchParams.toString()}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!todayDateOnly) return null; // Avoid hydration flash

  // Determine state label
  let stateLabel = "SNAP";
  if (eventId?.includes("tx-")) stateLabel = "TX";
  if (eventId?.includes("ca-")) stateLabel = "CA";
  if (eventId?.includes("ct-")) stateLabel = "CT";

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
      
      {/* Answer Block */}
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Next Benefit Availability Date</p>
        {nextPayment ? (
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {new Date(nextPayment.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}
            </div>
            <div className="text-sm font-medium text-slate-600 mt-1">
              State: <span className="text-slate-800 mr-2">{stateLabel}</span>
              Group: <span className="text-slate-800">{nextPayment.group?.replace(/^(TX SNAP |CA CalFresh |CT SNAP )/i, '') || "All"}</span>
            </div>
          </div>
        ) : (
          <div className="text-lg font-medium text-slate-600">
            {filteredDates.length === 0 ? "No matching dates for this selection." : "No upcoming dates in this schedule."}
          </div>
        )}
      </div>

      {/* Selectors & Actions */}
      <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
        <select 
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 max-w-[200px]"
          value={g || ""}
          onChange={(e) => handleFilter("g", e.target.value)}
        >
          <option value="">All Groups</option>
          {groups.map(group => <option key={group} value={group}>{group.replace(/^(TX SNAP |CA CalFresh |CT SNAP )/i, '')}</option>)}
        </select>

        <select 
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          value={m || ""}
          onChange={(e) => handleFilter("m", e.target.value)}
        >
          <option value="">All Months</option>
          {months.map(month => <option key={month} value={month}>{month}</option>)}
        </select>

        <button 
          onClick={copyLink}
          className="bg-slate-900 text-white hover:bg-slate-800 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors text-center"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}