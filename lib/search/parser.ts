// RESEARCH APPLIED: Batch 2, Tab 4 (Structured lookup query parser)
// RESEARCH APPLIED: Batch 2, Tab 5 (Layered Ranking Strategy)

export function parseSearchIntent(query: string) {
  const normalized = query.toLowerCase().trim();
  
  // 1. Detect State Intent (Expandable for all 50 states)
  let stateCode = null;
  if (normalized.includes("texas") || normalized.includes("tx")) stateCode = "TX";
  if (normalized.includes("alabama") || normalized.includes("al")) stateCode = "AL";
  if (normalized.includes("florida") || normalized.includes("fl")) stateCode = "FL";

  // 2. Detect Program Intent
  let programCode = null;
  if (normalized.includes("snap") || normalized.includes("ebt") || normalized.includes("food stamps")) {
    programCode = "SNAP";
  }

  // 3. Detect Identifier Intent (Extract any digits provided)
  // e.g., "al snap 04" -> extracts "04"
  const digitsMatch = normalized.match(/\b\d+\b/);
  const rawIdentifier = digitsMatch ? digitsMatch[0] : null;

  return {
    stateCode,
    programCode,
    rawIdentifier
  };
}