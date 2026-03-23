export interface StateDefinition {
  code: string; 
  slug: string;
  name: string;
  agency: string;
  description: string;
  officialUrl?: string; // 🚀 Added to support the new Authority layer
}

export const STATE_REGISTRY: Record<string, StateDefinition> = {
  "AL": { code: "AL", slug: "alabama", name: "Alabama", agency: "DHR", description: "Official 2026 Alabama DHR benefit issuance schedules and payment dates.", officialUrl: "https://dhr.alabama.gov/food-assistance/" },
  "AK": { code: "AK", slug: "alaska", name: "Alaska", agency: "DPA", description: "Alaska Division of Public Assistance 2026 issuance timeline for SNAP and Quest cards.", officialUrl: "https://health.alaska.gov/dpa/Pages/snaps/default.aspx" },
  "AZ": { code: "AZ", slug: "arizona", name: "Arizona", agency: "DES", description: "Arizona DES 2026 benefit availability dates and EBT deposit windows.", officialUrl: "https://des.az.gov/services/basic-needs/food-assistance" },
  "AR": { code: "AR", slug: "arkansas", name: "Arkansas", agency: "DHS", description: "Arkansas DHS 2026 SNAP issuance schedule and holiday deposit adjustments.", officialUrl: "https://humanservices.arkansas.gov/divisions-shared-services/county-operations/supplemental-nutrition-assistance-program/" },
  "CA": { code: "CA", slug: "california", name: "California", agency: "CDSS", description: "California CalFresh (SNAP) and CalWORKs 2026 distribution dates by case digit.", officialUrl: "https://www.cdss.ca.gov/calfresh" },
  "CO": { code: "CO", slug: "colorado", name: "Colorado", agency: "CDHS", description: "Colorado PEAK 2026 benefit issuance windows and EBT schedule.", officialUrl: "https://cdhs.colorado.gov/snap" },
  "CT": { code: "CT", slug: "connecticut", name: "Connecticut", agency: "DSS", description: "Connecticut DSS 2026 SNAP and TFA issuance dates and EBT availability.", officialUrl: "https://portal.ct.gov/dss/SNAP/Supplemental-Nutrition-Assistance-Program---SNAP" },
  "DE": { code: "DE", slug: "delaware", name: "Delaware", agency: "DSS", description: "Delaware DSS 2026 SNAP issuance timeline and benefit deposit dates.", officialUrl: "https://dhss.delaware.gov/dhss/dss/foodstamps.html" },
  "FL": { code: "FL", slug: "florida", name: "Florida", agency: "DCF", description: "Florida DCF 2026 SNAP and TANF benefit availability dates and holiday shifts.", officialUrl: "https://www.myflfamilies.com/services/public-assistance/food-assistance-and-smarter-choices" },
  "GA": { code: "GA", slug: "georgia", name: "Georgia", agency: "DFCS", description: "Georgia Division of Family & Children Services 2026 benefit issuance timeline.", officialUrl: "https://dfcs.georgia.gov/snap-food-stamps" },
  "HI": { code: "HI", slug: "hawaii", name: "Hawaii", agency: "BESSD", description: "Hawaii BESSD 2026 SNAP and Financial Assistance issuance windows.", officialUrl: "https://humanservices.hawaii.gov/bess/snap/" },
  "ID": { code: "ID", slug: "idaho", name: "Idaho", agency: "DHW", description: "Idaho DHW 2026 benefit issuance schedule and EBT deposit dates.", officialUrl: "https://healthandwelfare.idaho.gov/services-programs/food-assistance/about-snap" },
  "IL": { code: "IL", slug: "illinois", name: "Illinois", agency: "IDHS", description: "Illinois Link Card (SNAP) 2026 payment schedule and availability calendar.", officialUrl: "https://www.dhs.state.il.us/page.aspx?item=30357" },
  "IN": { code: "IN", slug: "indiana", name: "Indiana", agency: "FSSA", description: "Indiana FSSA 2026 SNAP and TANF issuance dates by last name digit.", officialUrl: "https://www.in.gov/fssa/dfr/snap-food-assistance/" },
  "IA": { code: "IA", slug: "iowa", name: "Iowa", agency: "HHS", description: "Iowa HHS 2026 SNAP benefit issuance windows and EBT schedule.", officialUrl: "https://hhs.iowa.gov/food-assistance" },
  "KS": { code: "KS", slug: "kansas", name: "Kansas", agency: "DCF", description: "Kansas DCF 2026 Vision Card (SNAP) issuance dates and schedule.", officialUrl: "https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx" },
  "KY": { code: "KY", slug: "kentucky", name: "Kentucky", agency: "DCBS", description: "Kentucky DCBS 2026 SNAP issuance timeline and EBT deposit dates.", officialUrl: "https://www.kynect.ky.gov/benefits/s/cash-food-medical-assistance" },
  "LA": { code: "LA", slug: "louisiana", name: "Louisiana", agency: "DCFS", description: "Louisiana DCFS 2026 SNAP issuance windows and EBT availability.", officialUrl: "https://www.dcfs.louisiana.gov/page/snap" },
  "ME": { code: "ME", slug: "maine", name: "Maine", agency: "DHHS", description: "Maine DHHS 2026 Pine Tree Card (SNAP) issuance dates and schedule.", officialUrl: "https://www.maine.gov/dhhs/ofi/programs-services/food-supplement" },
  "MD": { code: "MD", slug: "maryland", name: "Maryland", agency: "DHS", description: "Maryland DHS 2026 SNAP benefit issuance timeline and EBT schedule.", officialUrl: "https://dhs.maryland.gov/supplemental-nutrition-assistance-program/" },
  "MA": { code: "MA", slug: "massachusetts", name: "Massachusetts", agency: "DTA", description: "Massachusetts DTA 2026 SNAP and TAFDC issuance dates by SSN.", officialUrl: "https://www.mass.gov/snap-benefits-food-stamps" },
  "MI": { code: "MI", slug: "michigan", name: "Michigan", agency: "MDHHS", description: "Michigan Bridge Card (SNAP) 2026 issuance schedule and deposit dates.", officialUrl: "https://www.michigan.gov/mdhhs/assistance-programs/food-assistance" },
  "MN": { code: "MN", slug: "minnesota", name: "Minnesota", agency: "DHS", description: "Minnesota DHS 2026 SNAP issuance windows and EBT deposit dates.", officialUrl: "https://mn.gov/dhs/people-we-serve/children-and-families/economic-assistance/food-nutrition/programs-and-services/supplemental-nutrition-assistance-program.jsp" },
  "MS": { code: "MS", slug: "mississippi", name: "Mississippi", agency: "MDHS", description: "Mississippi MDHS 2026 SNAP issuance timeline and benefit availability.", officialUrl: "https://www.mdhs.ms.gov/economic-assistance/snap/" },
  "MO": { code: "MO", slug: "missouri", name: "Missouri", agency: "DSS", description: "Missouri DSS 2026 SNAP benefit issuance windows and EBT schedule.", officialUrl: "https://mydss.mo.gov/food-assistance/food-stamp-program" },
  "MT": { code: "MT", slug: "montana", name: "Montana", agency: "DPHHS", description: "Montana DPHHS 2026 SNAP issuance dates and EBT availability.", officialUrl: "https://dphhs.mt.gov/hcsd/SNAP" },
  "NE": { code: "NE", slug: "nebraska", name: "Nebraska", agency: "DHHS", description: "Nebraska DHHS 2026 SNAP issuance timeline and benefit deposit dates.", officialUrl: "https://dhhs.ne.gov/Pages/SNAP.aspx" },
  "NV": { code: "NV", slug: "nevada", name: "Nevada", agency: "DWSS", description: "Nevada DWSS 2026 SNAP issuance windows and EBT deposit dates.", officialUrl: "https://dwss.nv.gov/SNAP/Food_Assistance_(SNAP)_Details/" },
  "NH": { code: "NH", slug: "new-hampshire", name: "New Hampshire", agency: "DHHS", description: "New Hampshire DHHS 2026 SNAP and FANF issuance schedule.", officialUrl: "https://www.dhhs.nh.gov/programs-services/financial-assistance/food-stamp-program" },
  "NJ": { code: "NJ", slug: "new-jersey", name: "New Jersey", agency: "DHS", description: "New Jersey Families First (SNAP) 2026 issuance dates and schedule.", officialUrl: "https://www.nj.gov/humanservices/dfd/programs/njsnap/" },
  "NM": { code: "NM", slug: "new-mexico", name: "New Mexico", agency: "HSD", description: "New Mexico HSD 2026 SNAP benefit issuance windows and EBT schedule.", officialUrl: "https://www.hsd.state.nm.us/lookingforassistance/supplemental_nutrition_assistance_program__snap/" },
  "NY": { code: "NY", slug: "new-york", name: "New York", agency: "OTDA", description: "New York State OTDA 2026 benefit issuance dates for SNAP and HEAP.", officialUrl: "https://otda.ny.gov/programs/snap/" },
  "NC": { code: "NC", slug: "north-carolina", name: "North Carolina", agency: "DHHS", description: "North Carolina EBT 2026 issuance windows and weekend deposit adjustments.", officialUrl: "https://www.ncdhhs.gov/divisions/social-services/food-and-nutrition-services-food-stamps" },
  "ND": { code: "ND", slug: "north-dakota", name: "North Dakota", agency: "HHS", description: "North Dakota HHS 2026 SNAP issuance timeline and EBT deposit dates.", officialUrl: "https://www.hhs.nd.gov/apply-for-help/snap" },
  "OH": { code: "OH", slug: "ohio", name: "Ohio", agency: "ODJFS", description: "Ohio Department of Job and Family Services 2026 SNAP issuance dates.", officialUrl: "https://jfs.ohio.gov/food-assistance/index.stm" },
  "OK": { code: "OK", slug: "oklahoma", name: "Oklahoma", agency: "OKDHS", description: "Oklahoma DHS 2026 SNAP benefit issuance windows and EBT schedule.", officialUrl: "https://oklahoma.gov/okdhs/services/snap.html" },
  "OR": { code: "OR", slug: "oregon", name: "Oregon", agency: "ODHS", description: "Oregon ODHS 2026 SNAP issuance timeline and benefit deposit dates.", officialUrl: "https://www.oregon.gov/odhs/food/pages/snap.aspx" },
  "PA": { code: "PA", slug: "pennsylvania", name: "Pennsylvania", agency: "DHS", description: "Pennsylvania COMPASS 2026 SNAP and cash assistance payment schedules.", officialUrl: "https://www.pa.gov/agencies/dhs/resources/snap" },
  "RI": { code: "RI", slug: "rhode-island", name: "Rhode Island", agency: "DHS", description: "Rhode Island DHS 2026 SNAP issuance windows and EBT schedule.", officialUrl: "https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap" },
  "SC": { code: "SC", slug: "south-carolina", name: "South Carolina", agency: "DSS", description: "South Carolina DSS 2026 SNAP issuance timeline and EBT deposit dates.", officialUrl: "https://dss.sc.gov/assistance-programs/snap/" },
  "SD": { code: "SD", slug: "south-dakota", name: "South Dakota", agency: "DSS", description: "South Dakota DSS 2026 SNAP benefit issuance windows and EBT schedule.", officialUrl: "https://dss.sd.gov/economicassistance/snap/" },
  "TN": { code: "TN", slug: "tennessee", name: "Tennessee", agency: "DHS", description: "Tennessee DHS 2026 SNAP issuance timeline and benefit deposit dates.", officialUrl: "https://www.tn.gov/humanservices/for-families/supplemental-nutrition-assistance-program-snap.html" },
  "TX": { code: "TX", slug: "texas", name: "Texas", agency: "HHSC", description: "Texas HHSC 2026 SNAP benefit schedule and Lone Star Card deposit dates.", officialUrl: "https://www.hhs.texas.gov/services/food/snap-food-benefits" },
  "UT": { code: "UT", slug: "utah", name: "Utah", agency: "DWS", description: "Utah DWS 2026 SNAP issuance windows and EBT availability.", officialUrl: "https://jobs.utah.gov/customereducation/services/foodstamps/index.html" },
  "VT": { code: "VT", slug: "vermont", name: "Vermont", agency: "DCF", description: "Vermont DCF 2026 SNAP issuance timeline and benefit deposit dates.", officialUrl: "https://dcf.vermont.gov/benefits/snap" },
  "VA": { code: "VA", slug: "virginia", name: "Virginia", agency: "DSS", description: "Virginia DSS 2026 SNAP benefit issuance windows and EBT schedule.", officialUrl: "https://www.dss.virginia.gov/benefit/snap.cgi" },
  "WA": { code: "WA", slug: "washington", name: "Washington", agency: "DSHS", description: "Washington DSHS 2026 SNAP issuance timeline and EBT deposit dates.", officialUrl: "https://www.dshs.wa.gov/esa/community-services-offices/food-assistance" },
  "WV": { code: "WV", slug: "west-virginia", name: "West Virginia", agency: "DHHR", description: "West Virginia DHHR 2026 SNAP benefit issuance windows and EBT schedule.", officialUrl: "https://dhhr.wv.gov/bcf/Services/family-assistance/Pages/Supplemental-Nutrition-Assistance-Program-(SNAP).aspx" },
  "WI": { code: "WI", slug: "wisconsin", name: "Wisconsin", agency: "DHS", description: "Wisconsin QUEST (SNAP) 2026 issuance dates and schedule.", officialUrl: "https://www.dhs.wisconsin.gov/foodshare/index.htm" },
  "WY": { code: "WY", slug: "wyoming", name: "Wyoming", agency: "DFS", description: "Wyoming DFS 2026 SNAP issuance timeline and benefit deposit dates.", officialUrl: "https://health.wyo.gov/healthcarefin/medicaid/programs-and-eligibility/snap/" },
};

export const getStateBySlug = (slug: string) => {
  if (!slug) return undefined;
  return Object.values(STATE_REGISTRY).find(s => 
    s.slug.toLowerCase() === slug.toLowerCase()
  );
};