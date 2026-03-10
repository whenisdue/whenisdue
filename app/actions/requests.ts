"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitEventRequest(formData: FormData) {
  const title = formData.get("eventTitle") as string;
  const dateStr = formData.get("eventDate") as string;
  const source = formData.get("eventSource") as string;
  const honeypot = formData.get("nickname") as string; // Bot trap

  // 1. Bot Trap: If the hidden field is filled, silently ignore
  if (honeypot) return { success: true };

  // 2. Data Validation
  if (!title || title.length < 3) {
    return { error: "Please enter the name of the event." };
  }

  try {
    await prisma.eventSubmission.create({
      data: {
        submittedTitle: title,
        submittedDate: dateStr || null,
        submittedSource: source || null,
        status: "PENDING",
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Submission failed. Please try again." };
  }
}