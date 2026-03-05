import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// Configure web-push with your VAPID keys ONLY if they exist
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@whenisdue.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const alertMessage = body.message || 'A verified schedule shift has occurred.';

    // Fetch ALL subscriptions (since we delete inactive ones automatically)
    const subscriptions = await prisma.pushSubscription.findMany();

    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found.' }, { status: 200 });
    }

    // Prepare the Push Payload
    const payload = JSON.stringify({
      title: 'WhenIsDue Authority Update',
      body: alertMessage,
      url: '/series/ssa-ssdi-payments'
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        console.log(`Push sent successfully to ${sub.id}`);
      } catch (error: any) {
        console.error(`Failed to send to ${sub.id}:`, error);
        
        // If the browser revoked the permission (410/404), DELETE the dead subscription
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id }
          });
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, sentCount: subscriptions.length }, { status: 200 });

  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}