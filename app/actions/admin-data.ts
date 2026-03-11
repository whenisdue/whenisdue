'use server'

import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/admin-session'
import { revalidatePath } from 'next/cache'

export async function saveDeepData(eventId: string, payload: any) {
  // 1. Security check
  await requireAdminSession()

  // 2. Update the database
  const updatedEvent = await prisma.event.update({
    where: { id: eventId },
    data: {
      whatToExpect: payload.whatToExpect,
      scheduleRules: payload.scheduleRules,
      faqData: payload.faqData,
    }
  })

  // 3. Force Next.js to refresh the admin dashboard and the public page instantly
  revalidatePath('/admin')
  revalidatePath(`/${updatedEvent.category.toLowerCase()}/${updatedEvent.slug}`)
  
  return { success: true }
}