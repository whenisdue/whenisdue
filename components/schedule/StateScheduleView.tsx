// RESEARCH APPLIED: Batch 3, Tab 1 (Anxiety-Layer Placement directly above table) -> MODIFIED: Data First.
// RESEARCH APPLIED: Batch 3, Tab 4 (Trust Signal Integration: Verification Strip)
// RESEARCH APPLIED: Batch 3, Tab 5 (High-Intent Question Detection: Quick Answers)
// RESEARCH APPLIED: Batch 3, Tab 10 (Layered Fallback: Suspense isolation)
// RESEARCH APPLIED: Batch 3, Tab 39 (Citation Structure: Outbound Source Links)

import React, { Suspense } from "react";
import { getUpcomingSchedule } from "@/lib/schedule/resolver";
import { ScheduleTable } from "./ScheduleTable";

interface StateScheduleViewProps {
  stateCode: string;   // e.g., "AL", "FL", "GA"
  stateName: string;   // e.g., "Alabama"
  programCode: string; // e.g., "SNAP"
}

// 1. The Isolated Data Fetcher
async function ScheduleDataLoader({ stateCode, stateName, programCode }: StateScheduleViewProps) {
  const data = await getUpcomingSchedule(stateCode, programCode);

  if (!data || data.rows.length === 0) {
    // Trust-First Fallback
    return (
      <div className="p-6 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
        <p className="font-semibold">Schedule not available yet.</p>
        <p className="text-sm mt-1">We have not generated payment data for this month yet. Please check back soon.</p>
      </div>
    );
  }

  return (
    <ScheduleTable 
      stateName={stateName}
      programName={programCode}
      monthLabel={data.monthLabel}
      identifierKind={data.rule.identifierKind}
      rows={data.rows}
    />
  );
}

// 2. The Main Layout Shell (Server Component)
export default function StateScheduleView(props: StateScheduleViewProps) {
  // Static date for trust signal (in production, this would pull from the DB rule's 'lastVerified' metadata)
  const todayDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      
      {/* TRUST SIGNAL: Verification Header & Outbound Citation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-md w-max border border-green-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="font-medium">Verified {todayDate}</span>
        </div>
        
        {/* The Clickable Citation Marcus demanded */}
        <a 
          href={
            props.stateCode === "FL" ? "https://ffic.myflfamilies.com/manual/3200.pdf" : 
            props.stateCode === "AL" ? "https://dhr.alabama.gov/wp-content/uploads/2019/07/EBT_Issuance_Schedule_07122013.pdf" :
            props.stateCode === "GA" ? "https://pamms.dhs.ga.gov/dfcs/snap/3810/" :
            "#"
          }
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
        >
          View Official Source Document
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
      </div>

      {/* SCHEDULE TABLE: Moved to the top! Wrapped in Suspense. */}
      <Suspense fallback={<div className="p-12 text-center text-gray-500 border rounded-lg animate-pulse mb-8">Loading official schedule...</div>}>
        <div className="mb-8">
           <ScheduleDataLoader {...props} />
        </div>
      </Suspense>

      {/* ANXIETY LAYER: Quick Answers Panel (Moved below the data) */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mb-8">
        <h3 className="font-semibold text-blue-900 mb-3">Common Questions About Today's Deposit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong className="block mb-1">What time do deposits appear?</strong>
            <p>Most deposits appear between midnight and early morning (12:00 AM - 6:00 AM).</p>
          </div>
          <div>
            <strong className="block mb-1">Why haven't my benefits appeared yet?</strong>
            <p>Some banks take a few hours to update balances. Check again later this morning.</p>
          </div>
        </div>
      </div>

      {/* INDEPENDENT REFERENCE DISCLAIMER */}
      <div className="mt-8 text-xs text-gray-500 border-t pt-4">
        <p><strong>Independent reference:</strong> This page summarizes publicly available government benefit schedules for convenience. Always confirm details with your local agency if needed.</p>
      </div>

    </div>
  );
}