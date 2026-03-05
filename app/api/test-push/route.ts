import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/data-service";

export async function GET(req: Request) {
  // 1. Initialize VAPID
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@whenisdue.com";
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "Missing VAPID keys" }, { status: 500 });
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  // 2. Fetch all active subscriptions
  const subs = await prisma.pushSubscription.findMany({
    // In a real app, you'd filter by topic or isActive, but we'll grab all for the test
  });

  if (subs.length === 0) {
    return NextResponse.json({ message: "No subscribers found in database." });
  }

  // 3. The Payload
  const payload = JSON.stringify({
    title: "SYSTEM TEST 🟢",
    body: "The Authority Engine push protocol is fully operational.",
    url: "/directory",
    icon: "/icons/icon-192.png"
  });

  let sent = 0;
  let failed = 0;

  // 4. Fire the Broadcast
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payload
      );
      sent++;
    } catch (err) {
      console.error("Push failed for a sub:", err);
      failed++;
    }
  }

  return NextResponse.json({ success: true, sent, failed });
}