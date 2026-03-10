import React from 'react'

type EventPayload = {
  title: string
  description: string
  dueAt: Date | null
  category: string
  url: string
}

export function CountdownJsonLd({ event }: { event: EventPayload }) {
  // If we don't have an exact date, do NOT emit an Event schema, as Google hates fake dates.
  if (!event.dueAt) return null

  const startDate = event.dueAt.toISOString()

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    url: event.url,
  }

  // If it's a game, inject the secondary SoftwareApplication/VideoGame schema
  if (event.category.toLowerCase() === 'gaming') {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              schema,
              {
                '@type': 'VideoGame',
                name: event.title,
                description: event.description,
                url: event.url,
                datePublished: startDate,
              }
            ]
          })
        }}
      />
    )
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}