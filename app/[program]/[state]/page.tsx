import { notFound } from "next/navigation";
import StateScheduleView from "@/components/schedule/StateScheduleView";

export default async function StatePage({ params }: { params: Promise<{ state: string; program: string }> }) {
  // UNWRAP THE PARAMS (Required in Next.js 15)
  const { state, program } = await params;
  
  const stateSlug = state.toLowerCase();
  
  /**
   * THE STATE GATEKEEPER
   * Added "vermont" to resolve the 404 block.
   */
  const stateMap: Record<string, string> = {
    "alabama": "AL", 
    "florida": "FL", 
    "georgia": "GA", 
    "california": "CA",
    "texas": "TX", 
    "new-york": "NY", 
    "pennsylvania": "PA", 
    "illinois": "IL",
    "ohio": "OH", 
    "north-carolina": "NC", 
    "washington": "WA", 
    "arizona": "AZ",
    "virginia": "VA", 
    "michigan": "MI", 
    "indiana": "IN", 
    "tennessee": "TN",
    "vermont": "VT" // <--- VERMONT RECONCILIATION ADDED
  };

  const stateCode = stateMap[stateSlug];
  
  // If the slug isn't in the map, the engine stops here.
  if (!stateCode) return notFound();

  return (
    <div className="py-10">
      <StateScheduleView 
        stateCode={stateCode} 
        stateName={state.charAt(0).toUpperCase() + state.slice(1)} 
        programCode={program.toUpperCase()} 
      />
    </div>
  );
}