import type { Metadata } from 'next'

export const SITE_NAME = 'WhenIsDue'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

export function toTitleCase(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

// Generates standardized Next.js Metadata
export function buildEventMetadata(event: {
  title: string
  category: string
  slug: string
  excerpt?: string | null
  dueAt: Date | null
  timeZone: string | null
  dateStatus: string
  displayMonth?: number | null
  displayYear?: number | null
  updatedAt: Date
}): Metadata {
  const categoryLabel = toTitleCase(event.category)
  const canonicalUrl = new URL(`/${event.category}/${event.slug}`, SITE_URL).toString()

  let title = `${event.title} Countdown | ${categoryLabel} Updates | ${SITE_NAME}`
  let description = event.excerpt?.trim() || `Track ${event.title} with a live countdown, schedule status, and latest timing details.`

  if (event.dueAt && event.dateStatus === 'EXACT') {
    const year = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' }).format(event.dueAt)
    const formattedDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: event.timeZone || 'UTC' }).format(event.dueAt)
    
    title = `${event.title} Countdown (${year}) | Exact Date & Time`
    description = event.excerpt?.trim() || `Track the exact countdown for ${event.title}. View the official due date and time (${formattedDate} ${event.timeZone || ''}).`
  } else if (event.dateStatus === 'TBD_MONTH' && event.displayMonth && event.displayYear) {
    const monthName = new Date(event.displayYear, event.displayMonth - 1).toLocaleString('default', { month: 'long' })
    title = `${event.title} Countdown (${monthName} ${event.displayYear})`
    description = event.excerpt?.trim() || `Track ${event.title} with a live countdown placeholder. Current schedule: ${monthName} ${event.displayYear}.`
  }

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${event.title} countdown` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    }
  }
}