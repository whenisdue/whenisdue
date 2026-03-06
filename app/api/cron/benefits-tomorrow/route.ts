import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// Helper to reliably get "tomorrow" in Manila time
function computeTomorrowDateStringInManila() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);

  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + 1);

  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  // 1. Authenticate Vercel Cron
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const scheduledForDate = computeTomorrowDateStringInManila();
  const dedupeKey = `benefits-tomorrow:${scheduledForDate}`;

  // 2. Idempotency Check
  const existing = await prisma.emailCampaign.findUnique({
    where: { dedupeKey },
    select: { id: true, status: true },
  });

  if (existing) {
    return NextResponse.json({ ok: true, reused: true, campaignId: existing.id, status: existing.status });
  }

  // 3. Create Campaign (Simplified mock for deployment structure)
  const campaign = await prisma.emailCampaign.create({
    data: {
      dedupeKey,
      triggerSource: "CRON",
      status: "COMPLETED", // Automatically complete if 0 recipients found
      templateKey: "benefits-tomorrow",
      subject: "Your payment is expected tomorrow",
      payload: { scheduledForDate },
      totalRecipients: 0,
    }
  });

  // Note: Actual audience building, chunking, and QStash publishing would go here
  // pointing to the Worker Plane.

  return NextResponse.json({
    ok: true,
    scheduledForDate,
    campaignId: campaign.id
  });
}