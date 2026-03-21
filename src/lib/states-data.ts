export interface StateDefinition {
  code: string; // FIXED: Reverted to string because EventCategory doesn't contain AL, CA, etc.
  slug: string;
  name: string;
  description: string;
}

export const STATE_REGISTRY: Record<string, StateDefinition> = {
  "AL": { code: "AL", slug: "alabama", name: "Alabama", description: "Official 2026 benefit issuance schedules for Alabama state programs." },
  "AK": { code: "AK", slug: "alaska", name: "Alaska", description: "Official 2026 benefit issuance schedules for Alaska state programs." },
  "AZ": { code: "AZ", slug: "arizona", name: "Arizona", description: "Official 2026 benefit issuance schedules for Arizona state programs." },
  "CA": { code: "CA", slug: "california", name: "California", description: "Official 2026 CalFresh and benefit issuance schedules." },
  "FL": { code: "FL", slug: "florida", name: "Florida", description: "Official 2026 Florida SNAP and benefit issuance schedules." },
  "NY": { code: "NY", slug: "new-york", name: "New York", description: "Official 2026 New York state benefit issuance schedules." },
  "TX": { code: "TX", slug: "texas", name: "Texas", description: "Official 2026 Texas Lone Star and benefit issuance schedules." },
};

export const getStateBySlug = (slug: string) => 
  Object.values(STATE_REGISTRY).find(s => s.slug === slug);