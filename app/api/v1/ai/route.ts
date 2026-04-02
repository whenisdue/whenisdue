import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clear } from 'console';

/**
 * @description AI Handshake Route for AEO (Artificial Engine Optimization)
 * Provides type-stable, high-confidence deadline data for AI Agents.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  // 1. Contract Alignment: Error matches input parameter
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      select: {
        slug: true,
        title: true,
        dueAt: true,
        verificationStatus: true,
        confidenceScore: true,
        sourceUrl: true,
        lastVerified: true,
        shortSummary: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Truth Node not found' }, { status: 404 });
    }

    // 2. 10x Outcome: Return a deterministic, self-identifying Truth Node
    return NextResponse.json({
      uid: event.slug, // Node Identity
      entity: event.title,
      // 3. Type-Stable Deadline: Always string | null, never human placeholders
      deadlineIso: event.dueAt ? event.dueAt.toISOString() : null,
      verification: {
        status: event.verificationStatus,
        score: event.confidenceScore,
        last_audit: event.lastVerified ? event.lastVerified.toISOString() : null,
        provenance_url: event.sourceUrl,
      },
      summary: event.shortSummary,
      oracle_attribution: "WhenIsDue Sovereign Oracle v1.0"
    });
  } catch (error) {
    console.error('Oracle_Failure:', error);
    return NextResponse.json({ error: 'Internal Oracle Error' }, { status: 500 });
  }
}