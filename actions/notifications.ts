"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleSubscription(prevState: any, formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const pushDetailsStr = formData.get("pushDetails") as string;

  if (!pushDetailsStr) {
    // Logic for Unsubscribe would go here
    return { subscribed: false };
  }

  const pushSub = JSON.parse(pushDetailsStr);

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: pushSub.endpoint },
      update: { isValid: true },
      create: {
        endpoint: pushSub.endpoint,
        p256dh: pushSub.keys.p256dh,
        auth: pushSub.keys.auth,
      }
    });

    revalidatePath(`/`); 
    return { subscribed: true };
  } catch (error) {
    return { subscribed: false, error: "Failed to subscribe" };
  }
}