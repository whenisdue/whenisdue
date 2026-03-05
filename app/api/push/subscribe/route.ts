import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize the Prisma Client to talk to our SQLite database
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // 1. Parse the incoming subscription data from the browser
    const body = await request.json();
    const { endpoint, expirationTime, keys } = body;

    // 2. Strict validation (Architect's rule: must have endpoint, p256dh, and auth)
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription object: Missing required cryptographic keys.' }, 
        { status: 400 }
      );
    }

    // 3. The UPSERT operation (Create if new, Update if existing)
    const subscription = await prisma.pushSubscription.upsert({
      where: {
        endpoint: endpoint,
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        expirationTime: expirationTime ? new Date(expirationTime) : null,
        status: 'ACTIVE',
        active: true,
        updatedAt: new Date(),
      },
      create: {
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        expirationTime: expirationTime ? new Date(expirationTime) : null,
        status: 'ACTIVE',
        active: true,
        // Note: Because we aren't handling user logins yet, userId stays null.
        // The browser's unique endpoint acts as their identity.
      }
    });

    // 4. Return success
    return NextResponse.json({ success: true, id: subscription.id }, { status: 200 });

  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}