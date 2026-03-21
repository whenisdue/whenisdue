export interface StateDefinition {
  code: string; 
  slug: string;
  name: string;
  description: string;
}

export const STATE_REGISTRY: Record<string, StateDefinition> = {
  "AL": { 
    code: "AL", slug: "alabama", name: "Alabama", 
    description: "Official 2026 Alabama DHR benefit issuance schedules and payment dates." 
  },
  "CA": { 
    code: "CA", slug: "california", name: "California", 
    description: "California CalFresh (SNAP) and CalWORKs 2026 distribution dates by case digit." 
  },
  "FL": { 
    code: "FL", slug: "florida", name: "Florida", 
    description: "Florida DCF 2026 SNAP and TANF benefit availability dates and holiday shifts." 
  },
  "GA": { 
    code: "GA", slug: "georgia", name: "Georgia", 
    description: "Georgia Division of Family & Children Services 2026 benefit issuance timeline." 
  },
  "IL": { 
    code: "IL", slug: "illinois", name: "Illinois", 
    description: "Illinois Link Card (SNAP) 2026 payment schedule and availability calendar." 
  },
  "NY": { 
    code: "NY", slug: "new-york", name: "New York", 
    description: "New York State OTDA 2026 benefit issuance dates for SNAP and HEAP." 
  },
  "NC": { 
    code: "NC", slug: "north-carolina", name: "North Carolina", 
    description: "North Carolina EBT 2026 issuance windows and weekend deposit adjustments." 
  },
  "OH": { 
    code: "OH", slug: "ohio", name: "Ohio", 
    description: "Ohio Department of Job and Family Services 2026 SNAP issuance dates." 
  },
  "PA": { 
    code: "PA", slug: "pennsylvania", name: "Pennsylvania", 
    description: "Pennsylvania COMPASS 2026 SNAP and cash assistance payment schedules." 
  },
  "TX": { 
    code: "TX", slug: "texas", name: "Texas", 
    description: "Texas HHSC 2026 SNAP benefit schedule and Lone Star Card deposit dates." 
  },
};

export const getStateBySlug = (slug: string) => {
  if (!slug) return undefined;
  return Object.values(STATE_REGISTRY).find(s => 
    s.slug.toLowerCase() === slug.toLowerCase()
  );
};