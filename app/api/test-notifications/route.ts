import { NextRequest, NextResponse } from 'next/server';
// 🟢 Pointing to your new Ironclad Dispatcher file
import { runNotificationDispatch } from '@/lib/notifications/runNotificationDispatch';

export async function GET(request: Request) {
  // 1. Basic Security Check
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log("Triggering manual notification batch...");
    
    // 🟢 Use the new function we built and verified
    const summary = await runNotificationDispatch({ trigger: "manual-test-endpoint" });
    
    return NextResponse.json({
      success: true,
      message: "Batch execution completed.",
      summary
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred during batch'
    }, { status: 500 });
  }
}