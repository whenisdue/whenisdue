"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function rejectSubmission(id: string) {
  await prisma.eventSubmission.update({
    where: { id },
    data: { status: "REJECTED" },
  });
  
  revalidatePath("/admin/requests");
}

export async function approveSubmission(id: string) {
  const submission = await prisma.eventSubmission.findUnique({
    where: { id },
  });

  if (!submission) return;

  // Generate a simple slug from the title
  const slug = submission.submittedTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Use a transaction to ensure atomicity
  await prisma.$transaction([
    // 1. Mark as approved
    prisma.eventSubmission.update({
      where: { id },
      data: { status: "APPROVED" },
    }),
    // 2. Create the actual live Event
    prisma.event.create({
      data: {
        title: submission.submittedTitle,
        slug: `${slug}-${Date.now()}`, // Ensure uniqueness
        category: "TECH", // Defaulting to TECH, you can edit later in Prisma Studio
        dateStatus: "TBA",
      },
    }),
  ]);

  revalidatePath("/admin/requests");
}