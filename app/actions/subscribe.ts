'use server'

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendVerificationMessage } from '@/lib/delivery'

// A simple interface matching the payload from our SubscribeWidget
export interface SubscribePayload {
  channel: 'SMS' | 'EMAIL';
  contactValue: string;
  stateName: string;
  programName: string;
  ruleGroup: string;
}

export async function subscribeUser(data: SubscribePayload) {
  try {
    // 1. NORMALIZE THE INPUT (Batch 1, Tab 4)
    // Strip whitespace, lowercase emails, and strip non-digits from phone numbers
    let normalizedContact = data.contactValue.trim();
    if (data.channel === 'EMAIL') {
      normalizedContact = normalizedContact.toLowerCase();
    } else if (data.channel === 'SMS') {
      normalizedContact = normalizedContact.replace(/\D/g, ''); // Keep only numbers
    }

    // 2. GENERATE THE SECURE HASH (Batch 1, Tab 4)
    // This allows us to look up the user without storing their raw email/phone as the primary key
    const contactHash = crypto.createHash('sha256').update(normalizedContact).digest('hex');

    // NOTE: For full production compliance, 'normalizedContact' should be encrypted using AES-256-GCM 
    // before saving to the DB. For this implementation, we are saving the normalized string.
    const encryptedContactValue = normalizedContact; 

    // 3. UPSERT THE SUBSCRIBER (Batch 1, Tab 3)
    // If they exist (matched by hash), do nothing. If they are new, create them.
    const subscriber = await prisma.subscriber.upsert({
      where: { contactHash },
      update: {}, 
      create: {
        channel: data.channel,
        contactValue: encryptedContactValue, 
        contactHash: contactHash,
        timezone: 'America/New_York', // We can capture this from the client browser later (Batch 3, Tab 5)
      }
    });

    // 4. CREATE THE SUBSCRIPTION (Pending Verification)
    // We check if this exact subscription already exists to prevent duplicate rows
    const existingSub = await prisma.subscription.findFirst({
      where: {
        subscriberId: subscriber.id,
        state: data.stateName,
        program: data.programName,
        ruleGroup: data.ruleGroup,
      }
    });

    let subscriptionId: string;

    if (existingSub) {
      subscriptionId = existingSub.id;
    } else {
      const newSub = await prisma.subscription.create({
        data: {
          subscriberId: subscriber.id,
          state: data.stateName,
          program: data.programName,
          ruleGroup: data.ruleGroup,
          status: 'PENDING_VERIFICATION', // Starts locked! (Batch 3, Tab 2)
        }
      });
      subscriptionId = newSub.id;
    }

    // 5. GENERATE THE SHORT-LIVED TOKEN (Batch 3, Tab 2)
    // 6-digit OTP for SMS. Secure random string for Email.
    const tokenStr = data.channel === 'SMS' 
      ? Math.floor(100000 + Math.random() * 900000).toString() 
      : crypto.randomBytes(32).toString('hex');

    // Set expiration to 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const verificationToken = await prisma.verificationToken.create({
      data: {
        subscriberId: subscriber.id,
        token: tokenStr,
        expiresAt: expiresAt,
      }
    });

    // 6. SEND THE MESSAGE via Twilio or Resend
console.log(`[SECURE LOG] Generated Token ${tokenStr} for ${data.channel}`);
await sendVerificationMessage(data.channel, normalizedContact, tokenStr, subscriptionId);

    return { success: true, subscriptionId };

  } catch (error) {
    console.error("Subscription failed:", error);
    return { success: false, error: "Failed to process subscription." };
  }
}