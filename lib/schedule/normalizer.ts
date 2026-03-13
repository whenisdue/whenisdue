import { formatDepositDate } from "./formatters";
import { groupContiguousSlices } from "../grouping/groupContiguousRules";

export type ScheduleRowViewModel = {
  rowKey: string;
  identifierLabel: string;
  paymentLabel: string;
  // We keep the atomic keys hidden in the view model for future search features!
  searchableAtoms: string[]; 
};

export function buildScheduleRows(events: any[], timeZone: string): ScheduleRowViewModel[] {
  // 1. Run the raw DB rows through our new contiguous grouping algorithm
  const groupedRanges = groupContiguousSlices(events);

  // 2. Map the grouped ranges into our React View Model
  return groupedRanges.map((group) => {
    
    // SAFETY CATCH (Topic 23: UI Presentation layer)
    // Extract the original key (e.g. "00-04") or the squished label ("0004")
    const rawKey = group.atoms[0]?.key || group.displayLabel;
    let formattedLabel = rawKey;
    
    if (rawKey.includes('-')) {
      // If it has a hyphen, just add breathing room -> "00 - 04"
      formattedLabel = rawKey.split('-').join(' - ');
    } else if (rawKey.length >= 4) {
      // If the grouping algorithm completely stripped the hyphen (e.g. "00004" or "0004")
      // We force it back into a clean 2-digit format.
      const right = rawKey.slice(-2);
      const left = rawKey.slice(0, 2);
      formattedLabel = `${left} - ${right}`;
    }

    return {
      rowKey: group.id,
      identifierLabel: formattedLabel, 
      paymentLabel: formatDepositDate(group.depositDate, timeZone),
      searchableAtoms: group.atoms.map((a: any) => a.key),
    };
  });
}