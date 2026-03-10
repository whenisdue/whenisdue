import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// Required for the crypto operations in web-push
export const runtime = "nodejs";
export const maxDuration = 60; // Give it up to 60 seconds to process a chunk

// Setup VAPID keys
webpush.setVapidDetails(
  "mailto:admin@whenisdue.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  // 1. Internal Security Check
  if (req.headers.get("x-internal-secret") !== process.env.CRON_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { eventIds } = await req.json();
  if (!eventIds || eventIds.length === 0) return NextResponse.json({ ok: true });

  // For this V1 Worker, we'll grab a chunk of up to 500 active push subscriptions.
  // In a massive scale app, you would pass a `cursorId` in the request body to chain calls.
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { isValid: true },
    take: 500, 
  });

  let sentCount = 0;

  for (const event of eventIds) {
    const payload = JSON.stringify({
      title: "Event Starting Tomorrow!",
      body: `${event.title} begins in 24 hours.`,
      url: `/${event.category?.toLowerCase() || 'event'}/${event.slug}`,
    });

    for (const sub of subscriptions) {
      // 2. THE IDEMPOTENCY LEDGER: Generate a deterministic key
      const dedupeKey = `24H-${event.id}-PUSH-${sub.id}`;

      try {
        // 3. ATOMIC CLAIM: Try to insert the delivery row.
        // If it fails with P2002 (Unique Constraint), another worker already sent it!
        await prisma.notificationDelivery.create({
          data: {
            eventId: event.id,
            channel: "PUSH",
            recipientFingerprint: sub.endpoint,
            dedupeKey: dedupeKey,
            status: "SENDING",
            scheduledFor: new Date(event.dueAt),
          }
        });

        // 4. If we got here, we own the lock. Send the Push.
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );

        // 5. Finalize Success
        await prisma.notificationDelivery.update({
          where: { dedupeKey },
          data: { status: "SENT", sentAt: new Date() }
        });
        sentCount++;

      } catch (error: any) {
        // Did it fail because it was already sent? (Idempotency saved us!)
        if (error.code === "P2002") continue; 

        // 6. TERMINAL HYGIENE: Did the browser block us or revoke the sub?
        const statusCode = error?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // 410 Gone / 404 Not Found -> Prune the dead subscription immediately
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { isValid: false, failureCount: { increment: 1 } }
          });
          
          // Mark delivery as permanently dead
          await prisma.notificationDelivery.update({
            where: { dedupeKey },
            data: { status: "INVALID_ENDPOINT", errorLog: "410 Gone" }
          });
        } else {
          // Transient error (Timeout, 500, etc)
          await prisma.notificationDelivery.update({
            where: { dedupeKey },
            data: { status: "FAILED_RETRYABLE", errorLog: error?.message || "Unknown Push Error" }
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true, processed: sentCount });
}