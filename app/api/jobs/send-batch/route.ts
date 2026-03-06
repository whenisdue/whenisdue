import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_for_build");

export async function POST(req: NextRequest) {
  // In production, verify QStash signature here using @upstash/qstash
  const body = await req.json() as {
    campaignId: string;
    batchId: string;
    batchIndex: number;
  };

  const batch = await prisma.emailCampaignBatch.findUnique({
    where: { id: body.batchId },
    include: { campaign: true },
  });

  if (!batch) return NextResponse.json({ ok: false, reason: "BATCH_NOT_FOUND" });
  if (batch.status === "SENT" || batch.status === "PARTIAL") {
    return NextResponse.json({ ok: true, skipped: true, reason: "ALREADY_PROCESSED" });
  }

  // Transition to PROCESSING
  await prisma.emailCampaignBatch.update({
    where: { id: batch.id },
    data: { status: "PROCESSING", attemptCount: { increment: 1 } },
  });

  const recipients = await prisma.emailCampaignRecipient.findMany({
    where: { campaignId: batch.campaignId, status: "PENDING" },
    skip: batch.offsetStart,
    take: batch.recipientCount,
  });

  if (recipients.length === 0) {
    await prisma.emailCampaignBatch.update({
      where: { id: batch.id },
      data: { status: "SENT", processedAt: new Date() },
    });
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Construct Resend Payload
  const emails = recipients.map((r) => ({
    from: process.env.RESEND_FROM || "Alerts <alerts@whenisdue.com>",
    to: [r.email],
    subject: r.subject ?? batch.campaign.subject,
    html: `<p>Your payment is expected soon. Check your dashboard for details.</p>`, // Replace with React Email template
    headers: {
      "X-Campaign-ID": batch.campaignId,
      "X-Batch-ID": batch.id,
      "X-Recipient-ID": r.id,
    },
  }));

  // Send via Resend Batch API
  const { data, error } = await resend.batch.send(emails);

  if (error) {
    await prisma.emailCampaignBatch.update({
      where: { id: batch.id },
      data: { status: "FAILED", lastError: error.message },
    });
    return NextResponse.json({ ok: false, reason: "RESEND_BATCH_FAILED", message: error.message });
  }

  // Success handling omitted for brevity, but you would mark recipients as SENT here
  await prisma.emailCampaignBatch.update({
    where: { id: batch.id },
    data: { status: "SENT", processedAt: new Date() },
  });

  return NextResponse.json({ ok: true, sentCount: emails.length });
}