import { NextRequest, NextResponse } from "next/server";
import { normalizeQuery } from "@/lib/search/normalizer";
import { resolveSmartSearch } from "@/lib/search/resolver-engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ type: 'NO_MATCH', query: "" });
  }

  try {
    const intent = normalizeQuery(query);
    const response = await resolveSmartSearch(intent);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error("SEARCH_RESOLVE_ERROR", error);
    return NextResponse.json({ type: 'SERVER_ERROR', message: 'Internal resolution failure' }, { status: 500 });
  }
}