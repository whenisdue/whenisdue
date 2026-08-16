export type AskWhenCompletion =
  | {
      kind: 'navigate'
      path: string
      label: string
      description: string
    }
  | {
      kind: 'missing'
      prompt: string
      description: string
      preservedQuery: string
    }
  | {
      kind: 'none'
    }

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^\p{L}\p{N}\s/+\-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function isValidDateKey(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const test = new Date(Date.UTC(year, month - 1, day))

  return (
    test.getUTCFullYear() === year &&
    test.getUTCMonth() === month - 1 &&
    test.getUTCDate() === day
  )
}

function extractDateKey(query: string, todayKey: string) {
  const normalized = normalize(query)

  if (/\btoday\b/.test(normalized) && isValidDateKey(todayKey)) {
    return todayKey
  }

  const iso = normalized.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/)
  if (iso) {
    const key = `${iso[1]}-${pad2(Number(iso[2]))}-${pad2(Number(iso[3]))}`
    return isValidDateKey(key) ? key : null
  }

  const monthPattern = Object.keys(MONTHS)
    .sort((a, b) => b.length - a.length)
    .join('|')
  const monthDate = normalized.match(
    new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:\\s*,?\\s*(20\\d{2}))?\\b`, 'i'),
  )

  if (monthDate) {
    const todayYear = Number(todayKey.slice(0, 4))
    const year = monthDate[3] ? Number(monthDate[3]) : todayYear
    const month = MONTHS[monthDate[1].toLowerCase()]
    const day = Number(monthDate[2])
    const key = `${year}-${pad2(month)}-${pad2(day)}`
    return isValidDateKey(key) ? key : null
  }

  return null
}

function extractBusinessDays(query: string) {
  const normalized = normalize(query)
  const match = normalized.match(
    /\b(\d{1,3})\s*(?:business|working|work|biz)\s*days?\b/,
  )
  return match ? Number(match[1]) : null
}

function extractCalendarDays(query: string) {
  const normalized = normalize(query)
  const matches = [
    ...normalized.matchAll(/\b(\d{1,3})\s*(?:calendar\s+)?days?\b/g),
  ]

  if (matches.length === 0) return null

  // Prefer a duration that is not obviously part of "Net 30".
  for (const match of matches) {
    const index = match.index ?? 0
    const before = normalized.slice(Math.max(0, index - 5), index)
    if (!/\bnet\s*$/.test(before)) return Number(match[1])
  }

  return null
}

function extractNetTerm(query: string) {
  const match = normalize(query).match(/\bnet\s*(7|15|30|45|60|90)\b/)
  return match ? Number(match[1]) : null
}

function extractShippingRange(query: string) {
  const normalized = normalize(query)
  const match = normalized.match(
    /\b(\d{1,3})\s*(?:-|to)\s*(\d{1,3})\s*(?:(business|working|work|calendar)\s*)?days?\b/,
  )

  if (!match) return null

  const min = Number(match[1])
  const max = Number(match[2])
  if (min > max) return null

  return {
    min,
    max,
    mode: match[3] === 'calendar' ? 'calendar' : 'business',
  } as const
}

function buildPath(path: string, params: Record<string, string | number | null>) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === '') return
    search.set(key, String(value))
  })

  const query = search.toString()
  return query ? `${path}?${query}` : path
}

function missing(prompt: string, description: string, preservedQuery: string): AskWhenCompletion {
  return {
    kind: 'missing',
    prompt,
    description,
    preservedQuery,
  }
}

function detectIntent(value: string) {
  const normalized = normalize(value)

  if (/\b(return|returns|refund|send back)\b/.test(normalized)) return 'return'
  if (/\b(trial|free trial)\b/.test(normalized)) return 'trial'
  if (/\b(invoice|net\s*\d+|payment terms?|bill due)\b/.test(normalized)) return 'invoice'
  if (/\b(ship|shipping|delivery|deliver|arrive|arrival|eta|package|parcel)\b/.test(normalized)) {
    return 'shipping'
  }
  if (
    /\b(business|working|work|biz)\s*days?\b/.test(normalized) ||
    /\bweekdays?\b/.test(normalized)
  ) {
    return 'business-days'
  }

  return null
}

function chooseIntent(query: string, chosenSuggestion?: string) {
  // What the user actually typed always wins. A clicked suggestion is only
  // a hint when the original wording did not name an intent clearly.
  return detectIntent(query) ?? (chosenSuggestion ? detectIntent(chosenSuggestion) : null)
}

export function resolveAskWhenCompletion(
  query: string,
  todayKey: string,
  chosenSuggestion?: string,
): AskWhenCompletion {
  const original = query.trim()
  if (!original) return { kind: 'none' }

  const intent = chooseIntent(original, chosenSuggestion)
  const dateKey = extractDateKey(original, todayKey)

  if (intent === 'invoice') {
    const term = extractNetTerm(original)

    if (!term) {
      return missing(
        'What are the payment terms?',
        'For example: Net 30, Net 45, or EOM.',
        original,
      )
    }

    if (!dateKey) {
      return missing(
        'What is the invoice date?',
        `I kept Net ${term}. Add the invoice date and I can finish it.`,
        original,
      )
    }

    return {
      kind: 'navigate',
      path: buildPath('/invoice-due-date-calculator', {
        date: dateKey,
        term: `net${term}`,
      }),
      label: `Net ${term} invoice`,
      description: 'Invoice date and payment terms carried over.',
    }
  }

  if (intent === 'business-days') {
    const days = extractBusinessDays(original)

    if (!days) {
      return missing(
        'How many business days?',
        'Add the number of business days and I can finish it.',
        original,
      )
    }

    if (!dateKey) {
      return missing(
        'What date should I start from?',
        `I kept ${days} business ${days === 1 ? 'day' : 'days'}.`,
        original,
      )
    }

    return {
      kind: 'navigate',
      path: buildPath('/business-days-calculator', {
        start: dateKey,
        days,
      }),
      label: `${days} business ${days === 1 ? 'day' : 'days'}`,
      description: 'Start date and day count carried over.',
    }
  }

  if (intent === 'return') {
    const days = extractCalendarDays(original)

    if (!days) {
      return missing(
        'How long is the return window?',
        'For example: 14 days or 30 days.',
        original,
      )
    }

    if (!dateKey) {
      return missing(
        'What was the purchase date?',
        `I kept the ${days}-day return window.`,
        original,
      )
    }

    return {
      kind: 'navigate',
      path: buildPath('/return-window-calculator', {
        start: dateKey,
        days,
      }),
      label: `${days}-day return window`,
      description: 'Purchase date and return window carried over.',
    }
  }

  if (intent === 'trial') {
    const days = extractCalendarDays(original)

    if (!days) {
      return missing(
        'How long is the trial?',
        'For example: 7 days, 14 days, or 30 days.',
        original,
      )
    }

    if (!dateKey) {
      return missing(
        'When did the trial start?',
        `I kept the ${days}-day trial length.`,
        original,
      )
    }

    return {
      kind: 'navigate',
      path: buildPath('/free-trial-calculator', {
        start: dateKey,
        days,
      }),
      label: `${days}-day free trial`,
      description: 'Trial start and length carried over.',
    }
  }

  if (intent === 'shipping') {
    const range = extractShippingRange(original)

    if (!range) {
      return missing(
        'What delivery range were you given?',
        'For example: 3–5 business days.',
        original,
      )
    }

    if (!dateKey) {
      return missing(
        'What date was it shipped?',
        `I kept the ${range.min}–${range.max} ${range.mode} day range.`,
        original,
      )
    }

    return {
      kind: 'navigate',
      path: buildPath('/shipping-delivery-range', {
        start: dateKey,
        min: range.min,
        max: range.max,
        mode: range.mode,
      }),
      label: `${range.min}–${range.max} ${range.mode} day delivery`,
      description: 'Ship date and delivery range carried over.',
    }
  }

  return { kind: 'none' }
}
