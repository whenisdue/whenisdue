import { NextResponse } from "next/server";
import { runDailyNotificationSweep } from "@/src/services/notifications/worker";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // 1. Security Gate
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Authoritative Date Source
    // We lock the business date to "Today" (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // 3. Kick off the Scout (Worker)
    await runDailyNotificationSweep(today);

    return NextResponse.json({ 
      success: true, 
      message: `Sweep completed for ${today}` 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}