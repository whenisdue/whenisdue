import { Resend } from 'resend';
import twilio from 'twilio';

// Initialize the Email Client
const resend = new Resend(process.env.RESEND_API_KEY);

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
      // Create the secure 1-click verification link
      // We use your production URL so the link actually works in your Gmail
      const baseUrl = 'https://whenisdue.com';
      const verifyLink = `${baseUrl}/verify?token=${tokenStr}&sub=${subscriptionId}`;

      await resend.emails.send({
        // CRITICAL FIX: Changed from 'alerts@' to 'admin@' to match your verification
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
            <p style="font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; pt-16px;">
              If you did not request this, you can safely ignore this email. No reminders will be sent.
            </p>
          </div>
        `,
      });
      
      console.log(`[DELIVERY] Email verification sent to ${contactValue}`);
      
    } else if (channel === 'SMS') {
      // SAFETY BYPASS: Since Twilio is blocked, we log it instead of crashing the site
      console.log(`[DELIVERY BYPASS] SMS requested for ${contactValue}, but Twilio is currently disabled.`);
      return; 

      /* // Re-enable this once your Twilio/Plivo registration is approved
      if (!twilioClient) {
        throw new Error("Twilio credentials are not configured.");
      }
      const messageBody = `WhenIsDue Alert Setup\nYour code is: ${tokenStr}`;
      await twilioClient.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+1${contactValue}`,
      });
      */
    }
  } catch (error) {
    console.error(`[DELIVERY ERROR] Failed to send ${channel} verification:`, error);
    // We throw the error so the 'Subscribe' button knows to stop the loading spinner
    throw error;
  }
}