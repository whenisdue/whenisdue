"use server";

import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createSubscriptionAction(formData: {
  email: string;
  stateCode: string;
  programCode: string;
  identifierValue: string;
  nextDepositDateIso: string;
}) {
  try {
    const trimmedEmail = formData.email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();
    const nextDepositDate = new Date(formData.nextDepositDateIso);

    // 1. Simple, flat write (No complex transactions for now)
    const subscriber = await prisma.subscriber.upsert({
      where: { normalizedEmail },
      update: {},
      create: { 
        email: trimmedEmail,
        normalizedEmail: normalizedEmail
      },
    });

    await prisma.subscription.upsert({
      where: {
        subscription_identity_key: {
          subscriberId: subscriber.id,
          stateCode: formData.stateCode,
          programCode: formData.programCode,
          identifierValue: formData.identifierValue,
        }
      },
      update: { 
        status: SubscriptionStatus.ACTIVE,
        nextDepositDate: nextDepositDate 
      },
      create: {
        subscriberId: subscriber.id,
        stateCode: formData.stateCode,
        programCode: formData.programCode,
        identifierValue: formData.identifierValue,
        nextDepositDate: nextDepositDate,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    revalidatePath(`/snap/${formData.stateCode.toLowerCase()}`);
    return { success: true };

  } catch (error: any) {
    // This will print the EXACT database error to your terminal
    console.error("🚨 DATABASE ERROR:", error.message);
    return { success: false, error: error.message };
  }
}