import React from "react";

export default function FederalSnapshot({ event, cci }: { event: any; cci?: any }) {
  if (event.category !== "federal") return null;

  const isSchedule = event.eventType === "SCHEDULE";
  const isConfirmed = event.statusLabel === "CONFIRMED";
  
  // 1. What it is
  const line1 = isSchedule 
    ? `Schedule: ${event.eventName?.match(/\d{4}/)?.[0] || "Federal"} Payments` 
    : `Event: ${event.eventName?.replace(/ \(\d{4}\)$| \d{4}$/, "") || "Announcement"}`;

  // 2. Timing logic
  let line2 = "";
  if (isSchedule && event.officialDates) {
    const now = new Date().getTime();
    const futureDates = event.officialDates
      .map((d: any) => new Date(d.date))
      .filter((d: Date) => d.getTime() > now)
      .sort((a: Date, b: Date) => a.getTime() - b.getTime());
    
    if (futureDates.length > 0) {
      line2 = `Next: ${futureDates[0].toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}`;
    } else {
      const lastDate = new Date(event.officialDates[event.officialDates.length - 1].date);
      line2 = `Last: ${lastDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}`;
    }
  } else {
    const displayDate = event.dateISO 
      ? new Date(event.dateISO).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
      : event.dateLine;
    line2 = isConfirmed ? `Happened: ${displayDate}` : `Expected: ${displayDate}`;
  }

  // 3. Coverage / Status
  let line3 = "";
  if (isSchedule) {
    const count = event.officialDates?.length || 0;
    line3 = `Covers: ${count} official dates`;
  } else {
    line3 = isConfirmed ? "Status: Confirmed" : `Confidence: ${cci?.tier || "Pending"} (CCI ${(cci?.cci * 100)?.toFixed(0) || event.confidenceScore}%)`;
  }

  // 4. Verification
  const verifyDate = event.lastVerifiedUtc 
    ? new Date(event.lastVerifiedUtc).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    : null;
  
  const sourceLabel = event.sourceUrl 
    ? <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-slate-300 hover:text-slate-900">Source</a>
    : "Unverified";

  return (
    <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 font-medium leading-relaxed max-w-md shadow-sm">
      <div className="flex justify-between items-center"><span className="text-slate-500">Type</span> <span className="text-slate-900">{line1}</span></div>
      <div className="flex justify-between items-center mt-1"><span className="text-slate-500">Timing</span> <span className="text-slate-900">{line2}</span></div>
      <div className="flex justify-between items-center mt-1"><span className="text-slate-500">{isSchedule ? "Scope" : "Signal"}</span> <span className="text-slate-900">{line3}</span></div>
      <div className="flex justify-between items-center mt-1"><span className="text-slate-500">Proof</span> <span>Verified {verifyDate} · {sourceLabel}</span></div>
    </div>
  );
}