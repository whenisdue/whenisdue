'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { adminEventSchema } from '@/lib/validation'
import { parseLocalDateTimeToUtcDate } from '@/lib/dates'
import { EventDateStatus, Prisma } from '@prisma/client'

export type ActionState = {
  ok: boolean
  message?: string
  fieldErrors?: Record<string, string[]>
}

/**
 * NEW: Notification Health Check
 * Fetches the count of failed notifications for the sidebar badge.
 */
export async function getDeadLetterCount() {
  try {
    const count = await prisma.notificationOutbox.count({
      where: { status: 'DEAD_LETTER' }
    });
    return count;
  } catch (error) {
    console.error("[ACTION_ERROR] getDeadLetterCount:", error);
    return 0;
  }
}

// 1. TOGGLE TRENDING
export async function toggleTrending(id: string, currentStatus: boolean) {
  await requireAdminSession()
  
  await prisma.event.update({
    where: { id },
    data: { trending: !currentStatus }
  })
  
  revalidatePath('/')
  revalidatePath('/admin')
}

// 2. DELETE EVENT
export async function deleteEvent(id: string) {
  await requireAdminSession()
  
  await prisma.event.delete({ where: { id } })
  
  revalidatePath('/')
  revalidatePath('/admin')
}

// 3. SAVE EVENT (Create or Update)
export async function saveEvent(prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession()

  const rawData: Record<string, any> = {
    id: formData.get('id'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    category: formData.get('category'),
    description: formData.get('description'),
    dateStatus: formData.get('dateStatus'),
    localDate: formData.get('localDate'),
    localTime: formData.get('localTime'),
    timeZone: formData.get('timeZone'),
    displayMonth: formData.get('displayMonth'),
    displayYear: formData.get('displayYear'),
    dateLabel: formData.get('dateLabel'),
    trending: formData.get('trending') === 'true'
  }

  Object.keys(rawData).forEach(key => {
    if (rawData[key] === '') {
      rawData[key] = undefined
    }
  })

  const parsed = adminEventSchema.safeParse(rawData)

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors
    }
  }

  const data = parsed.data
  let dueAtUtc: Date | null = null

  if (data.dateStatus === EventDateStatus.EXACT) {
    try {
      dueAtUtc = parseLocalDateTimeToUtcDate(
        data.localDate as string, 
        data.localTime as string, 
        data.timeZone as string
      )
    } catch (error: any) {
      return {
        ok: false,
        message: error.message || 'Invalid date/time combination.',
        fieldErrors: { localTime: ['Check DST overlap or invalid time.'] }
      }
    }
  }

  try {
    const payload = {
      title: data.title,
      slug: data.slug,
      category: data.category,
      description: data.description || null,
      dateStatus: data.dateStatus,
      dueAt: dueAtUtc,
      timeZone: data.dateStatus === EventDateStatus.EXACT ? data.timeZone : null,
      displayMonth: data.dateStatus === EventDateStatus.TBD_MONTH && data.displayMonth ? Number(data.displayMonth) : null,
      displayYear: data.dateStatus === EventDateStatus.TBD_MONTH && data.displayYear ? Number(data.displayYear) : null,
      dateLabel: data.dateLabel || null,
      trending: data.trending
    }

    if (data.id) {
      await prisma.event.update({
        where: { id: data.id },
        data: payload
      })
    } else {
      await prisma.event.create({
        data: payload
      })
    }

    revalidatePath('/')
    revalidatePath('/admin')

    return { ok: true, message: 'Event saved successfully.' }

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { 
        ok: false, 
        message: 'This slug is already in use.', 
        fieldErrors: { slug: ['Slug must be unique.'] } 
      }
    }
    console.error(error)
    return { ok: false, message: 'An unexpected database error occurred.' }
  }
}