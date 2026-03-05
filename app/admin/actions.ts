"use server";

import { prisma } from '@/lib/data-service';
import { revalidatePath } from 'next/cache';

export async function verifyAndBroadcast(formData: {
  seriesKey: string;
  date: string;
  proof: string;
}) {
  try {
    // 1. Save to Database
    const newOccurrence = await prisma.occurrence.create({
      data: {
        series: { connect: { seriesKey: formData.seriesKey } },
        date: new Date(formData.date),
        status: 'VERIFIED',
        verificationProof: formData.proof,
      },
    });

    // 2. Prepare the Push Message
    const message = `VERIFIED: New date for ${formData.seriesKey} confirmed for ${formData.date}.`;

    // 3. Trigger Global Broadcast (Internal API call)
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    // 4. Refresh the UI
    revalidatePath(`/series/${formData.seriesKey}`);
    return { success: true };
  } catch (error) {
    console.error("Admin Action Failed:", error);
    return { success: false, error: "Failed to verify date." };
  }
}
export async function deleteOccurrence(id: string, seriesKey: string) {
  try {
    await prisma.occurrence.delete({
      where: { id },
    });
    
    revalidatePath(`/series/${seriesKey}`);
    return { success: true };
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false };
  }
}