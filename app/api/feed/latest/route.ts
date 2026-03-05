import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: Request) {
  try {
    // 1. Look for the "VIP Pass" in the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    // Extract just the token string
    const token = authHeader.split(' ')[1];

    // 2. Prepare the Cryptographic Secret to check the signature
    const secretKey = process.env.AGENT_JWT_SECRET;
    if (!secretKey) throw new Error("Missing AGENT_JWT_SECRET");
    const secret = new TextEncoder().encode(secretKey);

    // 3. Verify the token (This automatically checks if it has expired!)
    try {
      const { payload } = await jwtVerify(token, secret);
      // If we made it here, the token is perfectly valid.
      // We can even see who it is: console.log("Agent accessing data:", payload.sub);
    } catch (err) {
      // Token is fake, tampered with, or the 10 minutes are up.
      return NextResponse.json({ error: 'Unauthorized: Token is invalid or expired' }, { status: 401 });
    }

    // 4. THE VAULT OPENS: Serve the highly structured Premium Data Feed
    // In production, this data would be dynamically pulled from your Prisma database.
    const premiumData = {
      feedId: "financial-schedule-v1",
      publishedAtUtc: new Date().toISOString(),
      payload: {
        eventType: "distribution_window",
        seriesName: "Social Security Disability Insurance (SSDI)",
        windows: {
            p10: 3,
            p50: 3,
            p90: 4
        },
        trustVerdict: "PASS",
        confidenceScore: 99
      },
      integrity: {
        method: "HISTORICAL_DISTRIBUTION_ONLY",
        recordsAnalyzed: 24
      }
    };

    return NextResponse.json(premiumData, { status: 200 });

  } catch (error) {
    console.error('Feed error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}