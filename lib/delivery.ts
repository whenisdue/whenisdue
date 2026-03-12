import { Resend } from 'resend';
import twilio from 'twilio';

/**
 * We move the key retrieval inside the function to ensure 
 * Vercel Server Actions pull the fresh environment variable 
 * every time the button is clicked.
 */
export async function sendVerificationMessage(
  channel: 'SMS' | 'EMAIL',
  contactValue: string,
  tokenStr: string,
  subscriptionId: string
) {
  try {
    if (channel === 'EMAIL') {
      // PULL KEY AT EXECUTION TIME
      const apiKey = process.env.RESEND_API_KEY;

      if (!apiKey) {
        console.error("[DELIVERY ERROR] RESEND_API_KEY is missing from the environment.");
        throw new Error("Internal Configuration Error: Missing API Key");
      }

      const resend = new Resend(apiKey);
      const baseUrl = 'https://whenisdue.com';
      const verifyLink = `${baseUrl}/verify?token=${tokenStr}&sub=${subscriptionId}`;

      console.log(`[DELIVERY] Contacting Resend for ${contactValue}...`);

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
            <p style="font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              If you did not request this, you can safely ignore this email. No reminders will be sent.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("[RESEND API ERROR]", error);
        throw new Error(error.message);
      }
      
      console.log(`[DELIVERY] Email verification sent successfully:`, data);
      
    } else if (channel === 'SMS') {
      // LOG ONLY UNTIL TWILIO IS FIXED
      console.log(`[DELIVERY BYPASS] SMS requested for ${contactValue}, but Twilio is currently disabled.`);
      return; 
    }
  } catch (error) {
    console.error(`[DELIVERY ERROR] Failed to send ${channel} verification:`, error);
    // This allows the front-end to stop the "Securing..." spinner and show the error
    throw error;
  }
}