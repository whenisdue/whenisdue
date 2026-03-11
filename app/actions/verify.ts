'use server'

import { prisma } from '@/lib/prisma'

export async function verifySubscriptionToken(subscriptionId: string, tokenStr: string) {
  try {
    // 1. Find the subscription to get the subscriber ID
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { subscriber: true }
    });

    if (!subscription) {
      return { success: false, error: "Subscription not found." };
    }

    if (subscription.status === 'ACTIVE') {
      return { success: true, message: "Already verified!" };
    }

    // 2. Find the matching token for this subscriber
    const verification = await prisma.verificationToken.findFirst({
      where: {
        subscriberId: subscription.subscriberId,
        token: tokenStr,
      }
    });

    if (!verification) {
      return { success: false, error: "Invalid verification code." };
    }

    // 3. Check expiration (Batch 3, Tab 2: Short-lived tokens)
    if (new Date() > verification.expiresAt) {
      return { success: false, error: "This code has expired. Please sign up again." };
    }

    // 4. Activate the subscription!
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'ACTIVE' }
    });

    // 5. Clean up the single-use token
    await prisma.verificationToken.delete({
      where: { id: verification.id }
    });

    return { success: true, message: "Reminders successfully activated!" };

  } catch (error) {
    console.error("[VERIFY ERROR]:", error);
    return { success: false, error: "An error occurred during verification." };
  }
}