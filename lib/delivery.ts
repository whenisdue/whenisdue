import { Resend } from 'resend';
import twilio from 'twilio';

export async function sendVerificationMessage(
  channel: 'SMS' | 'EMAIL',
  contactValue: string,
  tokenStr: string,
  subscriptionId: string
) {
  try {
    if (channel === 'EMAIL') {
      // WE USE THE PUBLIC NAME TO FORCE VERCEL TO PASS IT TO THE SERVER
      const apiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY || process.env.RESEND_API_KEY;

      if (!apiKey) {
        console.error("[CRITICAL] Resend API Key is missing from Vercel.");
        throw new Error("Internal Configuration Error: Missing API Key");
      }

      const resend = new Resend(apiKey);
      const baseUrl = 'https://whenisdue.com';
      const verifyLink = `${baseUrl}/verify?token=${tokenStr}&sub=${subscriptionId}`;

      const { data, error } = await resend.emails.send({
        from: 'WhenIsDue <admin@whenisdue.com>', 
        to: contactValue,
        subject: 'Confirm your payment reminder subscription',
        html: `
          <div style="font-family: sans-serif; max-w: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a;">Confirm your reminder</h2>
            <p style="color: #334155; line-height: 1.5;">You requested payment schedule reminders for <strong>WhenIsDue</strong>. Click the button below to activate your alerts.</p>
            <a href="${verifyLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">
              Verify Subscription
            </a>
          </div>
        `,
      });

      if (error) throw new Error(error.message);
      console.log(`[DELIVERY] Email sent to ${contactValue}`);
      
    } else if (channel === 'SMS') {
      console.log(`[DELIVERY BYPASS] SMS disabled.`);
      return; 
    }
  } catch (error) {
    console.error(`[DELIVERY ERROR]`, error);
    throw error;
  }
}