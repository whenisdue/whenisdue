import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @description AI Discovery Route
 * Returns a manifest of all available Truth Node slugs for machine indexing.
 */
export async function GET() {
  try {
    const nodes = await prisma.event.findMany({
      where: { isArchived: false },
      select: {
        slug: true,
        title: true,
        lastVerified: true,
      },
      orderBy: { lastVerified: 'desc' },
      take: 1000, // High-capacity manifest
    });

    return NextResponse.json({
      count: nodes.length,
      nodes: nodes.map(n => ({
        slug: n.slug,
        title: n.title,
        updated_at: n.lastVerified?.toISOString() || null,
        api_url: `https://whenisdue.com/api/v1/ai?slug=${n.slug}`
      })),
      oracle_version: "1.0.0",
      manifest_type: "canonical_truth_nodes"
    });
  } catch (error) {
    console.error('Discovery_Failure:', error);
    return NextResponse.json({ error: 'Internal Discovery Error' }, { status: 500 });
  }
}