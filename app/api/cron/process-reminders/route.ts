import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationMessage } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. SECURE THE ENDPOINT (Batch 3, Tab 4)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log("[CRON] Waking up to process reminders...");

    // ---------------------------------------------------------
    // PHASE 1: GENERATE OUTBOX JOBS (Idempotent)
    // ---------------------------------------------------------
    const activeSubs = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { subscriber: true }
    });

    const todayDateStr = new Date().toISOString().split('T')[0];
    let queuedCount = 0;

    for (const sub of activeSubs) {
      const dedupeKey = `${sub.id}_${todayDateStr}`;

      try {
        await prisma.notificationOutbox.upsert({
          where: { dedupeKey },
          update: {}, 
          create: {
            subscriptionId: sub.id,
            dedupeKey: dedupeKey,
            status: 'PENDING',
            sendAt: new Date(),
          }
        });
        queuedCount++;
      } catch (e) {
        // Safe skip if already exists
      }
    }

    // ---------------------------------------------------------
    // PHASE 2: PROCESS THE OUTBOX (The Worker)
    // ---------------------------------------------------------
    const pendingJobs = await prisma.notificationOutbox.findMany({
      where: { status: 'PENDING' },
      include: { 
        subscription: {
          include: { subscriber: true }
        }
      },
      take: 50 
    });

    let sentCount = 0;

    for (const job of pendingJobs) {
      const sub = job.subscription;
      const user = sub.subscriber;

      try {
        if (sub.status !== 'ACTIVE') {
          await prisma.notificationOutbox.update({
            where: { id: job.id },
            data: { status: 'CANCELLED_OUTDATED', lastError: 'Subscription no longer active' }
          });
          continue;
        }

        // 3-Line Mobile Payload (Batch 3, Tab 9)
        const messagePayload = `${sub.state} ${sub.program} Reminder\nRule: ${sub.ruleGroup}\nPayment arrives soon.\nReply STOP to opt out.`;

        if (user.channel === 'SMS') {
            console.log(`[DELIVERY] 📱 Sending SMS to ${user.contactValue}`);
            // await twilioClient.messages.create({...})
        } else {
            console.log(`[DELIVERY] 📧 Sending Email to ${user.contactValue}`);
        }

        await prisma.notificationOutbox.update({
          where: { id: job.id },
          data: { 
            status: 'SENT', 
            sentAt: new Date(),
          }
        });
        
        sentCount++;
      } catch (error: any) {
        await prisma.notificationOutbox.update({
          where: { id: job.id },
          data: { 
            status: 'FAILED',
            lastError: error.message || 'Unknown provider error'
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      queued: queuedCount,
      sent: sentCount 
    });

  } catch (error) {
    console.error("[CRON FATAL ERROR]:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}