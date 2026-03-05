"use server";

import { z } from "zod";
import { prisma } from "@/lib/data-service"; 

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(10).max(1024),
    auth: z.string().min(6).max(256),
  }),
});

export type SavePushSubscriptionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function savePushSubscription(
  raw: unknown,
  opts?: { userId?: string | null }
): Promise<SavePushSubscriptionResult> {
  const parsed = PushSubscriptionSchema.safeParse(raw);
  
  if (!parsed.success) {
    return { ok: false, error: "Invalid PushSubscription payload." };
  }

  const { endpoint, keys } = parsed.data;

  try {
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: opts?.userId ?? null,
        // Removed the `ua` field to perfectly match your Prisma schema
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: opts?.userId ?? null,
        // Removed the `ua` field to perfectly match your Prisma schema
      },
      select: { id: true },
    });

    return { ok: true, id: sub.id };
  } catch (err) {
    return { ok: false, error: "Failed to save subscription." };
  }
}