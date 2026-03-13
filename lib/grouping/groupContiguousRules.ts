// RESEARCH APPLIED: Batch 1, Tab 1 (O(n) Single Pass run accumulator)
// RESEARCH APPLIED: Batch 1, Tab 3 (Dual-Representation Model: displayLabel + atoms)
// RESEARCH APPLIED: Batch 1, Tab 4 (Strict continuity break detection)
// RESEARCH APPLIED: Batch 1, Tab 5 (Numeric Normalization for sorting)

export type AtomicIdentifierSlice = {
  value: number;
  key: string;       // e.g., "04"
  depositDate: Date;
};

export type GroupedIdentifierRange = {
  id: string;
  start: number;
  end: number;
  displayLabel: string; // e.g., "04-06" or "07"
  depositDate: Date;
  atoms: AtomicIdentifierSlice[];
};

export function groupContiguousSlices(
  atomicRows: { identifierMatch: string; depositDate: Date; id: string }[]
): GroupedIdentifierRange[] {
  if (!atomicRows || atomicRows.length === 0) return [];

  // 1. Normalize and Sort (Batch 1, Tab 5 & 6)
  // We must sort by Date FIRST, then by Numeric Value to ensure deterministic runs
  const normalized = atomicRows
    .map(row => {
      // Extract numeric value safely. If it's a token like "NYC", it falls back to NaN.
      const numValue = parseInt(row.identifierMatch.replace(/\D/g, ""), 10);
      return {
        originalId: row.id,
        key: row.identifierMatch,
        value: isNaN(numValue) ? 0 : numValue, // Handle non-numeric safely
        depositDate: row.depositDate,
      };
    })
    .sort((a, b) => {
      const timeDiff = a.depositDate.getTime() - b.depositDate.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.value - b.value;
    });

  const groups: GroupedIdentifierRange[] = [];
  const width = normalized[0].key.length; // e.g., 2 for "00", 1 for "0"

  // Initialize the first run
  let currentAtoms: AtomicIdentifierSlice[] = [normalized[0]];
  let runStart = normalized[0].value;
  let runEnd = normalized[0].value;
  let runDate = normalized[0].depositDate.getTime();

  // 2. The O(n) Single-Pass Scanner (Batch 1, Tab 1)
  for (let i = 1; i < normalized.length; i++) {
    const current = normalized[i];
    const isConsecutive = current.value === runEnd + 1;
    const isSameDate = current.depositDate.getTime() === runDate;

    // STRICT RULE: Only extend if numerically consecutive AND dates match exactly (Batch 1, Tab 4)
    if (isConsecutive && isSameDate) {
      runEnd = current.value;
      currentAtoms.push(current);
    } else {
      // Break the run: Flush current group and start a new one
      groups.push(buildGroup(runStart, runEnd, width, runDate, currentAtoms));
      
      runStart = current.value;
      runEnd = current.value;
      runDate = current.depositDate.getTime();
      currentAtoms = [current];
    }
  }

  // Flush the final remaining group
  groups.push(buildGroup(runStart, runEnd, width, runDate, currentAtoms));

  return groups;
}

// Helper to format the final display string (Batch 1, Tab 1)
function buildGroup(
  start: number, 
  end: number, 
  width: number, 
  dateMs: number, 
  atoms: AtomicIdentifierSlice[]
): GroupedIdentifierRange {
  const pad = (n: number) => String(n).padStart(width, "0");
  
  // If start and end are the same, display "04". If different, display "04-06".
  const displayLabel = start === end ? pad(start) : `${pad(start)}-${pad(end)}`;

  return {
    id: `group-${start}-${end}-${dateMs}`,
    start,
    end,
    displayLabel,
    depositDate: new Date(dateMs),
    atoms,
  };
}