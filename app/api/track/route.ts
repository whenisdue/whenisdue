// web/app/api/track/route.ts
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Process-local throttle (Friction, not absolute distributed security)
const burstMap = new Map<string, { count: number; resetAt: number }>();

function isThrottled(ipHash: string, eventId: string) {
  const key = `${ipHash}:${eventId}`;
  const now = Date.now();
  const record = burstMap.get(key);

  if (!record || now >= record.resetAt) {
    burstMap.set(key, { count: 1, resetAt: now + 10000 }); // 10-second window
    return false;
  }
  
  record.count += 1;
  return record.count > 5; // Max 5 clicks per 10s per IP per event
}

export async function POST(req: Request) {
  // Layer 1: Browser-Origin Friction
  const origin = req.headers.get('origin');
  if (origin && !origin.includes(process.env.NEXT_PUBLIC_SITE_URL || 'localhost')) {
    return new Response(null, { status: 403 }); 
  }

  // Layer 2: Payload Validation
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  if (!body.events || !Array.isArray(body.events)) {
    return new Response(null, { status: 400 });
  }

  // Layer 3: Pseudonymous IP Hashing
  const rawIp = req.headers.get('x-forwarded-for') || 'unknown';
  const salt = process.env.TELEMETRY_SALT || 'local-dev-salt';
  const ipHash = crypto.createHash('sha256').update(rawIp + salt).digest('hex');

  // Layer 4: Background Telemetry (after() is for telemetry, not truth)
  after(async () => {
    for (const event of body.events) {
      if (!event.eventId) continue;
      
      // Check process-local burst limit
      if (isThrottled(ipHash, event.eventId)) {
        console.warn(`Throttled click from IP Hash ${ipHash.substring(0,8)} for event ${event.eventId}`);
        continue;
      }

      try {
        // Phase 1: Atomic Increment for single hot fields
        await prisma.eventClickStat.upsert({
          where: { eventId: event.eventId },
          update: { 
            clickCount1h: { increment: 1 },
            totalClicks: { increment: 1 },
            lastClickAt: new Date()
          },
          create: {
            eventId: event.eventId,
            clickCount1h: 1,
            totalClicks: 1,
            lastClickAt: new Date()
          }
        });
      } catch (error) {
        console.error("Telemetry Prisma write failed:", error);
      }
    }
  });

  // Layer 5: Status Code Discipline
  return new Response(null, { status: 202 }); 
}