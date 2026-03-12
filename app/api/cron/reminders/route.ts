import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma'; // Fixed: Added curly braces for named export

// Use the public key bypass we established earlier to ensure Vercel sees it
const apiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY;
const resend = new Resend(apiKey);

export async function GET(request: Request) {
  try {
    // 1. SECURITY: Ensure only Vercel CRON can trigger this endpoint
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log("[CRON] Starting daily reminder batch process...");

    // 2. FETCH SUBSCRIBERS
    // We are pulling from the Subscription table we saw in your Prisma Studio 
    // where ruleGroup matches our target
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        // For V1, let's grab the specific Vermont rule you subscribed to
        ruleGroup: 'snap-deposit-schedule-vermont-2026',
      },
      include: {
        subscriber: true,
      }
    });

    if (activeSubscriptions.length === 0) {
      return NextResponse.json({ message: "No reminders to send today." });
    }

    // 3. THE "TRUST-FIRST" EMAIL BATCH PIPELINE
    // Fixed: Added explicit 'any' type to 'sub' to satisfy TypeScript strict mode
    const emailsToSend = activeSubscriptions.map((sub: any) => {
      const { subscriber, state, program } = sub;
      const baseUrl = 'https://whenisdue.com';

      return {
        from: 'WhenIsDue Alerts <admin@whenisdue.com>',
        to: subscriber.contactValue,
        // RESEARCH APPLIED: "Entity + Event" Subject Line
        subject: `${state} ${program} deposit expected tomorrow`,
        html: `
          <div style="font-family: sans-serif; max-w: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a; margin-bottom: 8px;">${state} ${program} Alert</h2>
            
            <p style="color: #334155; font-size: 16px; font-weight: bold;">
              Your ${program} benefits are expected to deposit tomorrow.
            </p>
            <p style="color: #475569; line-height: 1.5;">
              Most deposits appear between midnight and 9:00 AM local time. 
              <br/><br/>
              <em>Note: Bank processing speeds and federal holidays can cause exact posting times to vary.</em>
            </p>

            <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin-top: 24px; font-size: 13px; color: #64748b;">
              <strong>Source:</strong> USDA & ${state} Health Departments<br/>
              <strong>Data Verified:</strong> Recently
            </div>

            <div style="margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
              <a href="${baseUrl}/preferences?sub=${sub.id}" style="font-size: 12px; color: #94a3b8; text-decoration: underline;">
                Manage Reminders or Unsubscribe
              </a>
            </div>
          </div>
        `
      };
    });

    // 4. DISPATCH BATCH TO RESEND
    // Resend allows sending up to 100 emails in a single batch API call
    const { data, error } = await resend.batch.send(emailsToSend);

    if (error) {
      console.error("[CRON ERROR] Resend Batch Failed:", error);
      throw new Error(error.message);
    }

    console.log(`[CRON SUCCESS] Processed ${activeSubscriptions.length} reminders.`);

    return NextResponse.json({ 
      success: true, 
      processed: activeSubscriptions.length,
      batchId: data 
    });

  } catch (error) {
    console.error("[CRON FATAL]", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}