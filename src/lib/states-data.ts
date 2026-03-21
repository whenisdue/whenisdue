export interface StateDefinition {
  code: string; 
  slug: string;
  name: string;
  agency: string;
  description: string;
}

export const STATE_REGISTRY: Record<string, StateDefinition> = {
  "AL": { code: "AL", slug: "alabama", name: "Alabama", agency: "DHR", description: "Official 2026 Alabama DHR benefit issuance schedules and payment dates." },
  "AK": { code: "AK", slug: "alaska", name: "Alaska", agency: "DPA", description: "Alaska Division of Public Assistance 2026 issuance timeline for SNAP and Quest cards." },
  "AZ": { code: "AZ", slug: "arizona", name: "Arizona", agency: "DES", description: "Arizona DES 2026 benefit availability dates and EBT deposit windows." },
  "AR": { code: "AR", slug: "arkansas", name: "Arkansas", agency: "DHS", description: "Arkansas DHS 2026 SNAP issuance schedule and holiday deposit adjustments." },
  "CA": { code: "CA", slug: "california", name: "California", agency: "CDSS", description: "California CalFresh (SNAP) and CalWORKs 2026 distribution dates by case digit." },
  "CO": { code: "CO", slug: "colorado", name: "Colorado", agency: "CDHS", description: "Colorado PEAK 2026 benefit issuance windows and EBT schedule." },
  "CT": { code: "CT", slug: "connecticut", name: "Connecticut", agency: "DSS", description: "Connecticut DSS 2026 SNAP and TFA issuance dates and EBT availability." },
  "DE": { code: "DE", slug: "delaware", name: "Delaware", agency: "DSS", description: "Delaware DSS 2026 SNAP issuance timeline and benefit deposit dates." },
  "FL": { code: "FL", slug: "florida", name: "Florida", agency: "DCF", description: "Florida DCF 2026 SNAP and TANF benefit availability dates and holiday shifts." },
  "GA": { code: "GA", slug: "georgia", name: "Georgia", agency: "DFCS", description: "Georgia Division of Family & Children Services 2026 benefit issuance timeline." },
  "HI": { code: "HI", slug: "hawaii", name: "Hawaii", agency: "BESSD", description: "Hawaii BESSD 2026 SNAP and Financial Assistance issuance windows." },
  "ID": { code: "ID", slug: "idaho", name: "Idaho", agency: "DHW", description: "Idaho DHW 2026 benefit issuance schedule and EBT deposit dates." },
  "IL": { code: "IL", slug: "illinois", name: "Illinois", agency: "IDHS", description: "Illinois Link Card (SNAP) 2026 payment schedule and availability calendar." },
  "IN": { code: "IN", slug: "indiana", name: "Indiana", agency: "FSSA", description: "Indiana FSSA 2026 SNAP and TANF issuance dates by last name digit." },
  "IA": { code: "IA", slug: "iowa", name: "Iowa", agency: "HHS", description: "Iowa HHS 2026 SNAP benefit issuance windows and EBT schedule." },
  "KS": { code: "KS", slug: "kansas", name: "Kansas", agency: "DCF", description: "Kansas DCF 2026 Vision Card (SNAP) issuance dates and schedule." },
  "KY": { code: "KY", slug: "kentucky", name: "Kentucky", agency: "DCBS", description: "Kentucky DCBS 2026 SNAP issuance timeline and EBT deposit dates." },
  "LA": { code: "LA", slug: "louisiana", name: "Louisiana", agency: "DCFS", description: "Louisiana DCFS 2026 SNAP issuance windows and EBT availability." },
  "ME": { code: "ME", slug: "maine", name: "Maine", agency: "DHHS", description: "Maine DHHS 2026 Pine Tree Card (SNAP) issuance dates and schedule." },
  "MD": { code: "MD", slug: "maryland", name: "Maryland", agency: "DHS", description: "Maryland DHS 2026 SNAP benefit issuance timeline and EBT schedule." },
  "MA": { code: "MA", slug: "massachusetts", name: "Massachusetts", agency: "DTA", description: "Massachusetts DTA 2026 SNAP and TAFDC issuance dates by SSN." },
  "MI": { code: "MI", slug: "michigan", name: "Michigan", agency: "MDHHS", description: "Michigan Bridge Card (SNAP) 2026 issuance schedule and deposit dates." },
  "MN": { code: "MN", slug: "minnesota", name: "Minnesota", agency: "DHS", description: "Minnesota DHS 2026 SNAP issuance windows and EBT deposit dates." },
  "MS": { code: "MS", slug: "mississippi", name: "Mississippi", agency: "MDHS", description: "Mississippi MDHS 2026 SNAP issuance timeline and benefit availability." },
  "MO": { code: "MO", slug: "missouri", name: "Missouri", agency: "DSS", description: "Missouri DSS 2026 SNAP benefit issuance windows and EBT schedule." },
  "MT": { code: "MT", slug: "montana", name: "Montana", agency: "DPHHS", description: "Montana DPHHS 2026 SNAP issuance dates and EBT availability." },
  "NE": { code: "NE", slug: "nebraska", name: "Nebraska", agency: "DHHS", description: "Nebraska DHHS 2026 SNAP issuance timeline and benefit deposit dates." },
  "NV": { code: "NV", slug: "nevada", name: "Nevada", agency: "DWSS", description: "Nevada DWSS 2026 SNAP issuance windows and EBT deposit dates." },
  "NH": { code: "NH", slug: "new-hampshire", name: "New Hampshire", agency: "DHHS", description: "New Hampshire DHHS 2026 SNAP and FANF issuance schedule." },
  "NJ": { code: "NJ", slug: "new-jersey", name: "New Jersey", agency: "DHS", description: "New Jersey Families First (SNAP) 2026 issuance dates and schedule." },
  "NM": { code: "NM", slug: "new-mexico", name: "New Mexico", agency: "HSD", description: "New Mexico HSD 2026 SNAP benefit issuance windows and EBT schedule." },
  "NY": { code: "NY", slug: "new-york", name: "New York", agency: "OTDA", description: "New York State OTDA 2026 benefit issuance dates for SNAP and HEAP." },
  "NC": { code: "NC", slug: "north-carolina", name: "North Carolina", agency: "DHHS", description: "North Carolina EBT 2026 issuance windows and weekend deposit adjustments." },
  "ND": { code: "ND", slug: "north-dakota", name: "North Dakota", agency: "HHS", description: "North Dakota HHS 2026 SNAP issuance timeline and EBT deposit dates." },
  "OH": { code: "OH", slug: "ohio", name: "Ohio", agency: "ODJFS", description: "Ohio Department of Job and Family Services 2026 SNAP issuance dates." },
  "OK": { code: "OK", slug: "oklahoma", name: "Oklahoma", agency: "OKDHS", description: "Oklahoma DHS 2026 SNAP benefit issuance windows and EBT schedule." },
  "OR": { code: "OR", slug: "oregon", name: "Oregon", agency: "ODHS", description: "Oregon ODHS 2026 SNAP issuance timeline and benefit deposit dates." },
  "PA": { code: "PA", slug: "pennsylvania", name: "Pennsylvania", agency: "DHS", description: "Pennsylvania COMPASS 2026 SNAP and cash assistance payment schedules." },
  "RI": { code: "RI", slug: "rhode-island", name: "Rhode Island", agency: "DHS", description: "Rhode Island DHS 2026 SNAP issuance windows and EBT schedule." },
  "SC": { code: "SC", slug: "south-carolina", name: "South Carolina", agency: "DSS", description: "South Carolina DSS 2026 SNAP issuance timeline and EBT deposit dates." },
  "SD": { code: "SD", slug: "south-dakota", name: "South Dakota", agency: "DSS", description: "South Dakota DSS 2026 SNAP benefit issuance windows and EBT schedule." },
  "TN": { code: "TN", slug: "tennessee", name: "Tennessee", agency: "DHS", description: "Tennessee DHS 2026 SNAP issuance timeline and benefit deposit dates." },
  "TX": { code: "TX", slug: "texas", name: "Texas", agency: "HHSC", description: "Texas HHSC 2026 SNAP benefit schedule and Lone Star Card deposit dates." },
  "UT": { code: "UT", slug: "utah", name: "Utah", agency: "DWS", description: "Utah DWS 2026 SNAP issuance windows and EBT availability." },
  "VT": { code: "VT", slug: "vermont", name: "Vermont", agency: "DCF", description: "Vermont DCF 2026 SNAP issuance timeline and benefit deposit dates." },
  "VA": { code: "VA", slug: "virginia", name: "Virginia", agency: "DSS", description: "Virginia DSS 2026 SNAP benefit issuance windows and EBT schedule." },
  "WA": { code: "WA", slug: "washington", name: "Washington", agency: "DSHS", description: "Washington DSHS 2026 SNAP issuance timeline and EBT deposit dates." },
  "WV": { code: "WV", slug: "west-virginia", name: "West Virginia", agency: "DHHR", description: "West Virginia DHHR 2026 SNAP benefit issuance windows and EBT schedule." },
  "WI": { code: "WI", slug: "wisconsin", name: "Wisconsin", agency: "DHS", description: "Wisconsin QUEST (SNAP) 2026 issuance dates and schedule." },
  "WY": { code: "WY", slug: "wyoming", name: "Wyoming", agency: "DFS", description: "Wyoming DFS 2026 SNAP issuance timeline and benefit deposit dates." },
};

export const getStateBySlug = (slug: string) => {
  if (!slug) return undefined;
  return Object.values(STATE_REGISTRY).find(s => 
    s.slug.toLowerCase() === slug.toLowerCase()
  );
};