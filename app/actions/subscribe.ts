'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Singleton Prisma client for Serverless environments
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type SubscribeState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export async function subscribeToEvent(
  prevState: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const email = formData.get('email') as string;
  const topicKey = formData.get('topicKey') as string;
  const turnstileToken = formData.get('cf-turnstile-response') as string;

  // 1. Basic Validation
  if (!email || !email.includes('@')) {
    return { status: 'error', message: 'Please enter a valid email address.' };
  }

  // 2. Bot Protection (Turnstile Verification Mock)
  // In production, you would verify this token against Cloudflare's API
  if (!turnstileToken && process.env.NODE_ENV === 'production') {
    return { status: 'error', message: 'Security verification failed. Please try again.' };
  }

  try {
    // 3. Database Upsert (Anonymous-first compatible)
    // Find or create the user identity
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // 4. Create the Topic Subscription
    await prisma.userTopicSubscription.upsert({
      where: {
        userId_topicKey: {
          userId: user.id,
          topicKey: topicKey,
        },
      },
      update: { wantsEmail: true },
      create: {
        userId: user.id,
        topicKey: topicKey,
        wantsEmail: true,
      },
    });

    // 5. Trigger Resend API here for Double Opt-in (omitted for brevity)
    // await resend.emails.send({ ... })

    return { status: 'success', message: 'You are on the list! Watch your inbox.' };
  } catch (error) {
    console.error('Subscription error:', error);
    // Generic error to prevent leaking database state
    return { status: 'error', message: 'Could not subscribe right now. Please try again.' };
  }
}