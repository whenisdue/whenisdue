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
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const verifyLink = `${baseUrl}/verify?token=${tokenStr}&sub=${subscriptionId}`;

      await resend.emails.send({
        from: 'alerts@whenisdue.com', // Note: You will need to verify this domain in Resend
        to: contactValue,
        subject: 'Confirm your payment reminder subscription',
        html: `
          <div style="font-family: sans-serif; max-w: 500px; margin: 0 auto;">
            <h2>Confirm your reminder</h2>
            <p>You requested payment schedule reminders. Click the button below to confirm your email and activate your alerts.</p>
            <a href="${verifyLink}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">
              Verify Subscription
            </a>
            <p style="font-size: 12px; color: #64748b; margin-top: 32px;">
              If you did not request this, you can safely ignore this email. No reminders will be sent.
            </p>
          </div>
        `,
      });
      
      console.log(`[DELIVERY] Email verification sent to ${contactValue}`);
      
    } else if (channel === 'SMS') {
      if (!twilioClient) {
        throw new Error("Twilio credentials are not configured in environment variables.");
      }

      // 3-Line SMS format for the verification text
      const messageBody = `WhenIsDue Alert Setup\nYour verification code is: ${tokenStr}\nExpires in 15 minutes.`;

      await twilioClient.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+1${contactValue}`, // Assuming US numbers for TCPA compliance
      });

      console.log(`[DELIVERY] SMS verification sent to ${contactValue}`);
    }
  } catch (error) {
    console.error(`[DELIVERY ERROR] Failed to send ${channel} verification:`, error);
    throw error;
  }
}