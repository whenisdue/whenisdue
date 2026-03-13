// RESEARCH APPLIED: Batch 3, Tab 9 (Program-Agnostic Renderer over Normalized Rows)
// RESEARCH APPLIED: Batch 3, Tab 6 (Semantic HTML: <table>, <caption>, <th scope="col">, <th scope="row">)
// RESEARCH APPLIED: Batch 3, Tab 7 (Visual Hierarchy: Deposit date is bold and visually weighted)
// RESEARCH APPLIED: Batch 3, Tab 5 (Cardified Mobile Layout via Tailwind responsive classes)

import React from "react";
import { getIdentifierMeta } from "@/lib/schedule/registry";
import type { ScheduleRowViewModel } from "@/lib/schedule/normalizer";

interface ScheduleTableProps {
  stateName: string;
  programName: string;
  monthLabel: string; // e.g., "March 2026"
  identifierKind: string;
  rows: ScheduleRowViewModel[];
}

export function ScheduleTable({
  stateName,
  programName,
  monthLabel,
  identifierKind,
  rows,
}: ScheduleTableProps) {
  // Resolve the dynamic column headers without messy if/else statements
  const meta = getIdentifierMeta(identifierKind);

  if (!rows || rows.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">Schedule not available yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm my-6">
      {/* Tailwind 'block md:table' creates the Mobile Cardification (Batch 3, Tab 5).
        On mobile, the table acts like stacked blocks. On desktop, it's a standard table.
      */}
      <table className="w-full text-left text-sm text-gray-700 block md:table">
        
        {/* SEO/Accessibility Requirement (Batch 3, Tab 6) */}
        <caption className="sr-only">
          {stateName} {programName} payment schedule for {monthLabel}
        </caption>

        <thead className="bg-gray-50 hidden md:table-header-group">
          <tr>
            <th scope="col" className="px-6 py-4 font-semibold text-gray-900">
              {meta.columnHeader}
            </th>
            <th
              scope="col"
              className="px-6 py-4 font-semibold text-gray-900 md:text-right"
            >
              Deposit Date
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 block md:table-row-group">
          {rows.map((row) => (
            <tr
              key={row.rowKey}
              className="block md:table-row hover:bg-gray-50 transition-colors p-4 md:p-0"
            >
              {/* MOBILE ONLY: Inline Label for Card View */}
              <td className="block md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                {meta.shortLabel}
              </td>

              {/* Identifier Column: scope="row" for Accessibility (Batch 3, Tab 6) */}
              <th
                scope="row"
                className="block md:table-cell px-0 md:px-6 py-1 md:py-4 font-medium text-gray-900 whitespace-nowrap"
              >
                {row.identifierLabel}
              </th>

              {/* MOBILE ONLY: Inline Label for Card View */}
              <td className="block md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3 mb-1">
                Expected Deposit Date
              </td>

              {/* Date Column: High Visual Weight (Batch 3, Tab 7) 
                Larger text base, bold, and right-aligned on desktop for easy scanning.
              */}
              <td className="block md:table-cell px-0 md:px-6 py-1 md:py-4 md:text-right font-bold text-gray-900 text-base md:text-lg">
                {row.paymentLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}