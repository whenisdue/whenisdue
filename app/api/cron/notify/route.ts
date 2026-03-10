import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { after } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // 1. Secure the Cron Route
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  // Target window: Events happening between 24 and 25 hours from exactly right now
  const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  try {
    // 2. Find events in the 24-hour window
    const targetEvents = await prisma.event.findMany({
      where: {
        dueAt: { gte: windowStart, lt: windowEnd },
        dateStatus: "EXACT", // Only exact dates get 24h reminders
      },
      select: { id: true, title: true, slug: true, dueAt: true },
    });

    if (targetEvents.length === 0) {
      return NextResponse.json({ ok: true, message: "No events in 24h window" });
    }

    // 3. Kick off the heavy worker in the background
    // We pass the event IDs to our internal worker route
    const eventIds = targetEvents.map(e => e.id).join(",");
    
    after(async () => {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      await fetch(`${baseUrl}/api/worker/dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.CRON_SECRET!,
        },
        body: JSON.stringify({ eventIds: targetEvents }),
      }).catch(console.error);
    });

    return NextResponse.json({ ok: true, queuedEvents: targetEvents.length });
  } catch (error) {
    console.error("Cron Orchestrator Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}