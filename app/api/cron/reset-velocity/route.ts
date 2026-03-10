import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  // Security Layer: Ensure only Vercel Cron or an authorized service can trigger this
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Reset the 1-hour click bucket for all events back to zero
    const result = await prisma.eventClickStat.updateMany({
      where: {
        clickCount1h: { gt: 0 }
      },
      data: {
        clickCount1h: 0
      }
    });

    return NextResponse.json({
      ok: true,
      message: 'Velocity reset successful',
      rowsUpdated: result.count
    });
  } catch (error) {
    console.error('Velocity reset failed:', error);
    return NextResponse.json({ ok: false, error: 'Reset failed' }, { status: 500 });
  }
}