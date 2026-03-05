import { prisma } from '@/lib/data-service';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

  const data = await prisma.series.findUnique({
    where: { seriesKey: key },
    include: { occurrences: { orderBy: { date: 'desc' } } }
  });

  return NextResponse.json(data);
}