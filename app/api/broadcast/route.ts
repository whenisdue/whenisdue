import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/data-service";
import crypto from "crypto";

export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Missing secret" }, { status: 500 });

  // 1. Extract the HMAC Signatures sent by the scraper
  const signature = req.headers.get("x-webhook-signature");
  const timestamp = req.headers.get("x-webhook-timestamp");
  
  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Missing signatures" }, { status: 401 });
  }

  // 2. Prevent "Replay Attacks" (Reject if older than 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return NextResponse.json({ error: "Timestamp expired" }, { status: 401 });
  }

  // 3. Verify the HMAC-SHA256 Signature
  const rawBody = await req.text();
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  if (signature !== `v1=${expectedSignature}`) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 4. Payload is secure. Parse it.
  const data = JSON.parse(rawBody);

  // 5. Setup Web Push
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@whenisdue.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  // 6. Fetch Active Subscriptions (Using your exact database column name)
  const subs = await prisma.pushSubscription.findMany({
    where: { active: true } // Fixed to match your schema
  });

  const pushPayload = JSON.stringify({
    title: "Verified: New Deposit Date 🟢",
    body: `The payment date for ${data.seriesKey || 'a tracked series'} has been officially verified.`,
    url: `/series/${data.seriesKey || ''}`,
    icon: "/icons/icon-192.png"
  });

  let sent = 0;
  let deleted = 0;

  // 7. Fire the Broadcast!
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        pushPayload,
        { TTL: 43200 } // <-- Added 12-hour expiration
      );
      sent++;
        } catch (err: any) {
      // If the user revoked permission, Google returns a 410. Deactivate them.
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { active: false } // Fixed to match your schema
        });
        deleted++;
      }
    }
  }

  return NextResponse.json({ success: true, sent, deleted });
}