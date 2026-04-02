import { NextRequest, NextResponse } from "next/server";
import { BenefitEngine } from "@/lib/engine/benefit-engine";

// 🚀 AGENCY SOVEREIGN MAP (Consistency Check)
const AGENCY_MAP: Record<string, any> = {
  CA: { name: "California Department of Social Services (CDSS)", portal: "https://www.benefitscal.com/" },
  NY: { name: "New York HRA / OTDA", portal: "https://a069-access.nyc.gov/" },
  TX: { name: "Texas HHSC", portal: "https://www.yourtexasbenefits.com/" },
  FL: { name: "Florida DCF", portal: "https://myaccess.myflfamilies.com/" },
  GA: { name: "Georgia DFCS", portal: "https://gateway.ga.gov/" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state")?.toUpperCase();
  const id = searchParams.get("id");

  // 1. VALIDATION
  if (!state || !id) {
    return NextResponse.json(
      { error: "MISSING_PARAMETERS", message: "Both 'state' and 'id' are required." },
      { status: 400 }
    );
  }

  try {
    // 2. ENGINE RESOLUTION
    const result = BenefitEngine.resolve(state, id);
    const agency = AGENCY_MAP[state] || { name: "State Social Services Agency", portal: "#" };

    // 3. THE FORENSIC PAYLOAD
    return NextResponse.json({
      status: "success",
      metadata: {
        engine: "Sovereign-2026",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      },
      data: {
        state,
        issuance_date: result.date,
        agency: agency.name,
        portal: agency.portal,
        logic_receipt: {
          nominal_day: result.details.nominalDay,
          rule_applied: result.details.ruleApplied,
          was_shifted: result.details.wasShifted,
          explanation: `Issuance for ${state} determined by identifier ${id}. Date adjusted for weekends/holidays where applicable.`
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", code: "ENGINE_FAILURE", message: error.message },
      { status: 500 }
    );
  }
}