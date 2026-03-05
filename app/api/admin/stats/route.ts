import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Count only users who haven't revoked permission
    const count = await prisma.pushSubscription.count({
      where: { status: 'ACTIVE' }
    });

    return NextResponse.json({ activeSubscribers: count });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}