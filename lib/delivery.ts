import { Resend } from 'resend';
import twilio from 'twilio';

/**
 * REINFORCED API KEY PICKUP
 * We check three different common naming conventions to ensure 
 * the Server Action doesn't "miss" the key.
 */
const apiKey = process.env.RESEND_API_KEY || 
               process.env.NEXT_PUBLIC_RESEND_API_KEY || 
               process.env.VERCEL_RESEND_API_KEY;

// This log will show up in your Vercel logs to tell us if it found the key
if (!apiKey) {
  console.error("[CRITICAL] Resend API Key is missing from ALL environment slots.");
} else {
  console.log(`[AUTH] Resend Key detected (starts with: ${apiKey.substring(0, 5)}...)`);
}

const resend = new Resend(apiKey);

// Initialize the SMS Client (safely checking for env vars)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export async function sendVerificationMessage(
  channel: 'SMS' | 'EMAIL',
  contactValue: string,
  tokenStr: string,
  subscriptionId: string
) {
  try {
    if (channel === 'EMAIL') {
      const baseUrl = 'https://whenisdue.com';
      const verifyLink = `${baseUrl}/verify?token=${tokenStr}&sub=${subscriptionId}`;

      await resend.emails.send({
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
            <p style="font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              If you did not request this, you can safely ignore this email. No reminders will be sent.
            </p>
          </div>
        `,
      });
      
      console.log(`[DELIVERY] Email verification sent to ${contactValue}`);
      
    } else if (channel === 'SMS') {
      console.log(`[DELIVERY BYPASS] SMS requested for ${contactValue}, but Twilio is currently disabled.`);
      return; 
    }
  } catch (error) {
    console.error(`[DELIVERY ERROR] Failed to send ${channel} verification:`, error);
    throw error;
  }
}