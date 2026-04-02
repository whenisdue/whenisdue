import { NextRequest, NextResponse } from 'next/server';
import { resolveTruth } from '@/lib/edge/orchestrator';

/**
 * @description Topic A131 & A200: Sovereign API Entry Point.
 * Bridges the Next.js frontend to the Cloudflare Edge Mesh.
 */
export const runtime = 'edge'; // Forces execution at the nearest Edge PoP

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Accessing the Cloudflare Environment (Topic A001)
    const env = (request as any).nextConfig?.env || process.env;
    
    // THE 10X MOVE: Resolve Truth at the Edge
    const truth = await resolveTruth(params.id, {
      TRUTH_KV: (globalThis as any).TRUTH_KV // Accessing the bound KV namespace
    });

    return NextResponse.json(truth, {
      headers: {
        'X-Sovereign-Finality': 'true',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Sovereign Mesh Error:', error);
    return NextResponse.json({ error: 'Truth Unreachable' }, { status: 500 });
  }
}