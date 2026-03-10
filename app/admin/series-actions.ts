'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { generateMonthlyBusinessDayRecurrences } from '@/lib/recurrence'
import { EventCategory, EventDateStatus } from '@prisma/client'
import { requireAdminSession } from '@/lib/admin-session'

export type GeneratedOccurrence = {
  index: number;
  originalDateIso: string;
  adjustedDateIso: string;
  reason: string;
}

export async function previewSeriesDatesAction(payload: {
  title: string;
  category: string;
  seriesId: string;
  startDate: string;
  dayOfMonth: number;
  count: number;
}): Promise<GeneratedOccurrence[]> {
  await requireAdminSession()

  const startDate = new Date(`${payload.startDate}T12:00:00Z`)
  
  const dates = generateMonthlyBusinessDayRecurrences({
    startDate,
    dayOfMonth: payload.dayOfMonth,
    count: payload.count
  })

  return dates.map((d, i) => {
    const iso = d.toISOString().split('T')[0]
    return {
      index: i + 1,
      originalDateIso: iso, 
      adjustedDateIso: iso,
      reason: "Calculated via OPM/SSA Rules" 
    }
  })
}

export async function commitSeriesAction(payload: {
  title: string;
  category: string;
  seriesId: string;
  dates: string[];
}): Promise<void> {
  await requireAdminSession()

  // 1. Upsert the Series
  const series = await prisma.eventSeries.upsert({
    where: { slugBase: payload.seriesId },
    update: { title: payload.title },
    create: {
      title: payload.title,
      slugBase: payload.seriesId,
      category: payload.category.toUpperCase() as EventCategory,
      isActive: true
    }
  })

  // 2. Format and Create the individual Events
  const eventsToCreate = payload.dates.map(dateStr => {
    const dateObj = new Date(`${dateStr}T14:00:00Z`) // Default 14:00 UTC (10am/9am ET)
    const monthName = dateObj.toLocaleString('default', { month: 'long', timeZone: 'UTC' })
    const year = dateObj.getUTCFullYear()
    
    return {
      title: `${payload.title} - ${monthName} ${year}`,
      slug: `${payload.seriesId}-${dateStr}`,
      category: payload.category.toUpperCase() as EventCategory,
      seriesId: series.id,
      dueAt: dateObj,
      timeZone: 'America/New_York', 
      dateStatus: EventDateStatus.EXACT,
      trending: false,
      isGenerated: true
    }
  })

  // 3. Batch Insert safely
  await prisma.event.createMany({
    data: eventsToCreate,
    skipDuplicates: true // Prevents crashing if you accidentally run the same dates twice
  })

  revalidatePath('/')
  revalidatePath('/admin')
}