import { NextRequest, NextResponse } from "next/server";
import { normalizeQuery, SearchIntent } from "@/lib/search/normalizer";
import { resolveSmartSearch } from "@/lib/search/resolver-engine";
import { STATE_NAMES } from "@/lib/constants";
import { STATE_PROGRAM_PROFILES, getIdentifierConfig } from "@/lib/schedule/identifier-config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const q = searchParams.get("q");
  const state = searchParams.get("state")?.toUpperCase();
  const kind = searchParams.get("kind")?.toUpperCase();
  const val = searchParams.get("val")?.toUpperCase();

  try {
    let intent: SearchIntent;

    // PATH A: Structured Intent (Direct Injection from Resume)
    if (state && kind && val) {
      // 1. Validate State Code
      if (!STATE_NAMES[state]) {
        return NextResponse.json({ type: 'NO_MATCH', query: `${state}|${kind}|${val}` });
      }

      // 2. Validate Kind for State (Prevention of Cross-State Kind-Spoofing)
      const profileKey = `${state}_SNAP`;
      const expectedKind = STATE_PROGRAM_PROFILES[profileKey];
      if (!expectedKind || kind !== expectedKind) {
        return NextResponse.json({ type: 'NO_MATCH', query: `${state}|${kind}|${val}` });
      }

      // 3. Validate Value Format (Alpha + Numeric + Width)
      const config = getIdentifierConfig(kind);
      let isValidFormat = true;
      
      if (config.validationType === "numeric" && !/^\d+$/.test(val)) isValidFormat = false;
      if (config.validationType === "alpha" && !/^[A-Z]+$/.test(val)) isValidFormat = false;
      if (config.maxLength && val.length !== config.maxLength) isValidFormat = false;

      if (!isValidFormat) {
        // Semantic Failure: Stale client data is a NO_MATCH, not a SERVER_ERROR
        return NextResponse.json({ type: 'NO_MATCH', query: `${state}|${kind}|${val}` });
      }

      const now = new Date();
      intent = {
        stateCode: state,
        programCode: 'SNAP',
        identifierKind: kind,
        identifierValue: val,
        benefitMonth: now.getMonth() + 1,
        benefitYear: now.getFullYear(),
        canonicalKey: `${state}|SNAP|${kind}|${val}|${now.getFullYear()}|${now.getMonth() + 1}`,
        intentClass: 'EXACT_PAYMENT'
      };
    } 
    // PATH B: Fuzzy Query (Standard Search)
    else if (q) {
      intent = normalizeQuery(q);
    } 
    else {
      return NextResponse.json({ type: 'NO_MATCH', query: "" });
    }

    // Pass the validated intent to the resolver engine
    const response = await resolveSmartSearch(intent);
    
    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' }
    });

  } catch (error) {
    console.error("API_RESOLVE_FAILURE", error);
    // Real system failures return a 500 status
    return NextResponse.json({ type: 'SERVER_ERROR', message: 'Internal engine failure' }, { status: 500 });
  }
}