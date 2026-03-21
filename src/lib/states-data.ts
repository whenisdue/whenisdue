export interface StateDefinition {
  code: string; 
  slug: string;
  name: string;
  description: string;
}

export const STATE_REGISTRY: Record<string, StateDefinition> = {
  "AL": { code: "AL", slug: "alabama", name: "Alabama", description: "Official 2026 Alabama benefit issuance schedules." },
  "AK": { code: "AK", slug: "alaska", name: "Alaska", description: "Official 2026 Alaska benefit issuance schedules." },
  "AZ": { code: "AZ", slug: "arizona", name: "Arizona", description: "Official 2026 Arizona benefit issuance schedules." },
  "CA": { code: "CA", slug: "california", name: "California", description: "Official 2026 California benefit issuance schedules." },
  "FL": { code: "FL", slug: "florida", name: "Florida", description: "Official 2026 Florida benefit issuance schedules." },
  "NY": { code: "NY", slug: "new-york", name: "New York", description: "Official 2026 New York benefit issuance schedules." },
  "TX": { code: "TX", slug: "texas", name: "Texas", description: "Official 2026 Texas benefit issuance schedules." },
};

export const getStateBySlug = (slug: string) => {
  // Defensive check: if no slug is passed, don't try to lowercase it
  if (!slug) return undefined;
  
  return Object.values(STATE_REGISTRY).find(s => 
    s.slug?.toLowerCase() === slug.toLowerCase()
  );
};