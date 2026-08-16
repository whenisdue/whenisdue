export type AskWhenIntentDefinition = {
  id: string
  phrases: string[]
  fragments?: string[]
  typoWords?: string[]
  suggestions: string[]
  priority?: number
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s/+-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function unique<T>(items: T[]) {
  return [...new Set(items)]
}

function tokenSet(value: string) {
  return new Set(normalize(value).split(' ').filter(Boolean))
}

function tokenOverlapScore(query: string, phrase: string) {
  const queryTokens = tokenSet(query)
  const phraseTokens = tokenSet(phrase)

  if (queryTokens.size === 0 || phraseTokens.size === 0) return 0

  let overlap = 0
  for (const token of queryTokens) {
    if (phraseTokens.has(token)) overlap += 1
  }

  return overlap / queryTokens.size
}

function isSingleAdjacentTransposition(a: string, b: string) {
  if (a.length !== b.length || a === b) return false

  const differentIndexes: number[] = []

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) differentIndexes.push(index)
    if (differentIndexes.length > 2) return false
  }

  if (differentIndexes.length !== 2) return false

  const [first, second] = differentIndexes
  if (second !== first + 1) return false

  return a[first] === b[second] && a[second] === b[first]
}

function editDistance(a: string, b: string) {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix = Array.from({ length: rows }, () =>
    Array<number>(cols).fill(0),
  )

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

function typoWordScore(query: string, typoWords: string[]) {
  const words = normalize(query).split(' ').filter(Boolean)
  let best = 0

  for (const word of words) {
    if (word.length < 4) continue

    for (const target of typoWords) {
      const normalizedTarget = normalize(target)
      const distance = editDistance(word, normalizedTarget)
      const adjacentSwap = isSingleAdjacentTransposition(word, normalizedTarget)

      if (distance === 0) best = Math.max(best, 92)
      else if (adjacentSwap) best = Math.max(best, 78)
      else if (distance === 1) best = Math.max(best, 72)
      else if (
        distance === 2 &&
        Math.max(word.length, normalizedTarget.length) >= 7
      ) {
        best = Math.max(best, 54)
      }
    }
  }

  return best
}

function phraseScore(query: string, candidate: string) {
  const q = normalize(query)
  const c = normalize(candidate)

  if (!q || !c) return 0
  if (q === c) return 170
  if (c.startsWith(q)) return 138
  if (q.startsWith(c)) return 120
  if (c.includes(q)) return 106
  if (q.includes(c)) return 94

  const overlap = tokenOverlapScore(q, c)
  if (overlap >= 1) return 86
  if (overlap >= 0.66) return 68
  if (overlap >= 0.5) return 50

  return 0
}

const intents: AskWhenIntentDefinition[] = [
  {
    id: 'business-days',
    priority: 24,
    phrases: [
      'business days',
      'business day',
      'working days',
      'working day',
      'work days',
      'work day',
      'weekdays',
      'weekday',
      'days excluding weekends',
      'days without weekends',
      'skip weekends',
      'exclude weekends',
      'count weekdays only',
      'office days',
      'banking days',
    ],
    fragments: [
      'bus',
      'busi',
      'business',
      'work',
      'work d',
      'working',
      'weekd',
      'weekday',
    ],
    typoWords: ['business', 'working', 'weekday', 'weekdays'],
    suggestions: [
      '5 business days from today',
      '5 business days after a date',
      '5 business days before a date',
      'business days between two dates',
    ],
  },
  {
    id: 'calendar-days',
    priority: 12,
    phrases: [
      'calendar days',
      'calendar day',
      'including weekends',
      'count every day',
      'count all days',
      'all days',
      'days from today',
      'days after a date',
      'days before a date',
      'consecutive days',
    ],
    fragments: ['cal', 'calendar', 'consec'],
    typoWords: ['calendar', 'consecutive'],
    suggestions: [
      '30 days from today',
      '30 days after a date',
      '30 days before a date',
    ],
  },
  {
    id: 'returns',
    priority: 30,
    phrases: [
      'return',
      'returns',
      'return window',
      'return period',
      'return deadline',
      'return date',
      'return by',
      'return until',
      'refund',
      'refund deadline',
      'refund window',
      'send it back',
      'send back',
      'last day to return',
      'last date to return',
      'when can i return',
      'when is return due',
      'when does return end',
      'when does return window end',
      'store return',
      'purchase return',
    ],
    fragments: [
      'ret',
      'retu',
      'retur',
      'return',
      'ref',
      'refu',
      'refund',
      'send b',
    ],
    typoWords: ['return', 'returns', 'refund'],
    suggestions: [
      '30 day return window',
      'return deadline from a purchase date',
      'return deadline from today',
      'when is the last day to return it',
    ],
  },
  {
    id: 'free-trial',
    priority: 30,
    phrases: [
      'trial',
      'free trial',
      'trial end',
      'trial ends',
      'trial ending',
      'trial expiry',
      'trial expiration',
      'trial expires',
      'free trial expires',
      'cancel trial',
      'cancel free trial',
      'when does my free trial end',
      'when does trial end',
      'when should i cancel trial',
      'trial deadline',
    ],
    fragments: ['tri', 'tria', 'trial', 'expir', 'free t'],
    typoWords: ['trial', 'expire', 'expires'],
    suggestions: [
      'when does my free trial end',
      '30 day free trial',
      'trial end date from a start date',
      'when should I cancel my trial',
    ],
  },
  {
    id: 'invoice-net',
    priority: 34,
    phrases: [
      'invoice',
      'invoice due',
      'invoice due date',
      'invoice deadline',
      'payment due',
      'payment due date',
      'payment deadline',
      'payment terms',
      'net 7',
      'net 15',
      'net 30',
      'net 45',
      'net 60',
      'net 90',
      'net terms',
      'terms net',
      'due invoice',
      'bill due',
      'billing due',
      'client payment',
      'customer payment',
      'accounts receivable',
      'ar due date',
    ],
    fragments: [
      'inv',
      'invo',
      'invoi',
      'invoice',
      'net',
      'paym',
      'bill',
      'billing',
      'ar ',
    ],
    typoWords: ['invoice', 'payment', 'billing'],
    suggestions: [
      'invoice due date from Net terms',
      'Net 30 due date',
      'invoice due date with end of month (EOM)',
      '2/10 Net 30',
    ],
  },
  {
    id: 'invoice-eom',
    priority: 38,
    phrases: [
      'eom',
      'end of month',
      'end of the month',
      'month end',
      'month-end',
      'end month',
      'month ending',
      'due end of month',
      'invoice end of month',
      'payment end of month',
      'end of month invoice',
      'month end invoice',
      'pay at month end',
      'due at month end',
    ],
    fragments: [
      'eom',
      'end of m',
      'end of mo',
      'end of mon',
      'month e',
      'month en',
      'month end',
    ],
    typoWords: ['month'],
    suggestions: [
      'invoice due date with end of month (EOM)',
      'invoice due date from payment terms',
      'Net 30 due date',
    ],
  },
  {
    id: 'discount-net-terms',
    priority: 36,
    phrases: [
      '2/10 net 30',
      '2 10 net 30',
      '2 percent 10 net 30',
      'early payment discount',
      'discount if paid early',
      'invoice discount deadline',
      'discount due date',
    ],
    fragments: ['2/10', '2 10', 'early pay', 'discount'],
    typoWords: ['discount'],
    suggestions: [
      '2/10 Net 30',
      'Net 30 due date',
      'invoice due date from Net terms',
    ],
  },
  {
    id: 'end-generic',
    priority: 10,
    phrases: [
      'end',
      'ends',
      'ending',
      'end date',
      'when does it end',
      'when does this end',
      'last day',
      'last date',
      'expires',
      'expire',
      'expired',
      'expiry',
      'expiration',
      'expiration date',
      'final day',
    ],
    fragments: ['end', 'ends', 'endi', 'last', 'exp', 'expi', 'final'],
    typoWords: ['expire', 'expires', 'expiry', 'expiration'],
    suggestions: [
      'end of month (EOM) invoice due date',
      'when does my free trial end',
      'when does my return window end',
      'when does my subscription renew',
    ],
  },
  {
    id: 'shipping',
    priority: 30,
    phrases: [
      'shipping',
      'ship',
      'ships',
      'ship date',
      'shipping date',
      'shipping window',
      'delivery',
      'deliver',
      'delivered',
      'delivery window',
      'delivery date',
      'delivery range',
      'arrival',
      'arrive',
      'arrival date',
      'eta',
      'estimated delivery',
      'estimated arrival',
      'when will it arrive',
      'when should my order arrive',
      'order arrive',
      'order delivery',
      'package arrive',
      'parcel arrive',
      'package delivery',
    ],
    fragments: [
      'shi',
      'ship',
      'del',
      'deli',
      'deliver',
      'arr',
      'arri',
      'eta',
      'pack',
      'parcel',
    ],
    typoWords: ['shipping', 'delivery', 'arrival', 'package'],
    suggestions: [
      '3-5 business days shipping',
      'delivery date range from a ship date',
      'when should my order arrive',
      'delivery range in business days',
    ],
  },
  {
    id: 'notice',
    priority: 30,
    phrases: [
      'notice',
      'notice period',
      'give notice',
      '30 day notice',
      'notice date',
      'notice deadline',
      'notice due',
      'resign',
      'resignation',
      'resignation notice',
      'resignation date',
      'last day at work',
      'last working day',
      'termination notice',
      'cancel before',
      'cancellation notice',
      'notice to vacate',
      'vacate notice',
      'lease notice',
    ],
    fragments: [
      'not',
      'noti',
      'notic',
      'resig',
      'termin',
      'vacat',
      'lease n',
    ],
    typoWords: ['notice', 'resignation', 'termination'],
    suggestions: [
      '30 day notice period',
      'when should I give notice',
      'notice deadline before a date',
      'notice period in business days',
    ],
  },
  {
    id: 'payday',
    priority: 30,
    phrases: [
      'payday',
      'pay day',
      'next payday',
      'next pay day',
      'next pay',
      'salary',
      'salary date',
      'salary day',
      'pay date',
      'paycheck',
      'pay check',
      'wages',
      'biweekly',
      'bi weekly',
      'every 2 weeks',
      'every two weeks',
      'fortnightly',
      'twice a month',
      'twice monthly',
      'semi monthly',
      'semimonthly',
      '1st and 15th',
      '15th and last',
      'monthly payday',
    ],
    fragments: [
      'pay',
      'payd',
      'payda',
      'salary',
      'wage',
      'biw',
      'semi',
      'fort',
    ],
    typoWords: ['payday', 'salary', 'biweekly', 'semimonthly'],
    suggestions: [
      'when is my next payday',
      'next payday every 2 weeks',
      'next payday twice a month',
      'next payday monthly',
    ],
  },
  {
    id: 'renewal',
    priority: 30,
    phrases: [
      'renew',
      'renews',
      'renewal',
      'renewal date',
      'next renewal',
      'auto renew',
      'auto-renew',
      'subscription',
      'subscription renews',
      'subscription renewal',
      'membership renewal',
      'plan renewal',
      'cancel subscription',
      'cancel before renewal',
      'subscription cancellation',
      'renewal deadline',
      'subscription expires',
      'membership expires',
    ],
    fragments: [
      'ren',
      'rene',
      'renew',
      'subs',
      'subscr',
      'cancel',
      'member',
      'plan r',
    ],
    typoWords: ['renewal', 'subscription', 'membership'],
    suggestions: [
      'when does my subscription renew',
      'cancel before renewal',
      'next renewal date',
      'subscription cancellation deadline',
    ],
  },
  {
    id: 'weekend',
    priority: 28,
    phrases: [
      'weekend',
      'weekends',
      'saturday',
      'sunday',
      'deadline saturday',
      'deadline sunday',
      'falls on weekend',
      'deadline falls on weekend',
      'lands on weekend',
      'due on saturday',
      'due on sunday',
      'due on weekend',
      'weekend deadline',
      'move to monday',
      'next business day',
    ],
    fragments: ['wee', 'weeke', 'weekend', 'sat', 'sund', 'mon'],
    typoWords: ['weekend', 'saturday', 'sunday'],
    suggestions: [
      'what if a deadline falls on a weekend',
      'do weekends count as business days',
      'move deadline to next business day',
    ],
  },
  {
    id: 'holidays',
    priority: 28,
    phrases: [
      'holiday',
      'holidays',
      'public holiday',
      'public holidays',
      'federal holiday',
      'bank holiday',
      'legal holiday',
      'exclude holidays',
      'without holidays',
      'skip holidays',
      'holiday calendar',
      'do holidays count',
      'holiday business day',
      'business days no holidays',
    ],
    fragments: [
      'hol',
      'holi',
      'holiday',
      'bank h',
      'federal h',
      'public h',
    ],
    typoWords: ['holiday', 'holidays'],
    suggestions: [
      'do public holidays count as business days',
      'business days without holidays',
      'business days with US federal holidays excluded',
    ],
  },
  {
    id: 'within',
    priority: 28,
    phrases: [
      'within',
      'within days',
      'within 5 days',
      'within business days',
      'within 5 business days',
      'within x days',
      'what does within mean',
      'within deadline',
      'within period',
    ],
    fragments: ['wit', 'withi', 'within'],
    typoWords: ['within'],
    suggestions: [
      'what does within 5 days mean',
      'within 5 business days',
      'does the start date count',
    ],
  },
  {
    id: 'between-dates',
    priority: 28,
    phrases: [
      'between dates',
      'between two dates',
      'days between dates',
      'days between two dates',
      'business days between',
      'business days between dates',
      'how many business days',
      'how many weekdays',
      'working days between',
      'difference between dates',
      'date difference',
    ],
    fragments: ['bet', 'betw', 'between', 'diff'],
    typoWords: ['between', 'difference'],
    suggestions: [
      'business days between two dates',
      'how many business days are between two dates',
      'days between two dates',
    ],
  },
  {
    id: 'business-hours',
    priority: 30,
    phrases: [
      'business hours',
      'working hours',
      'office hours',
      'sla',
      'service level',
      'service level agreement',
      'hours deadline',
      'deadline in working hours',
      'deadline in business hours',
      'response time',
      'response deadline',
      'support deadline',
      'ticket due',
    ],
    fragments: [
      'sla',
      'business h',
      'working h',
      'office h',
      'response',
      'support',
      'ticket',
    ],
    typoWords: ['business', 'working', 'response'],
    suggestions: [
      'deadline in working hours',
      'business-hours deadline',
      'SLA deadline in business hours',
    ],
  },
  {
    id: 'start-date-count',
    priority: 26,
    phrases: [
      'does the start date count',
      'start date count',
      'include start date',
      'exclude start date',
      'count the first day',
      'first day counts',
      'day one',
      'day 1',
      'start day',
      'from today inclusive',
      'inclusive counting',
      'exclusive counting',
    ],
    fragments: ['start d', 'day one', 'day 1', 'inclu', 'exclu'],
    typoWords: ['inclusive', 'exclusive'],
    suggestions: [
      'does the start date count',
      'start counting after the first date',
      'include the start date as day one',
    ],
  },
  {
    id: 'deadline',
    priority: 18,
    phrases: [
      'deadline',
      'due date',
      'when is it due',
      'when due',
      'due',
      'by when',
      'by what date',
      'what date is it due',
      'what day is it due',
      'cutoff',
      'cut off',
      'last date',
      'final date',
      'target date',
      'due by',
    ],
    fragments: ['dead', 'due', 'cut', 'by w', 'final d', 'target'],
    typoWords: ['deadline', 'cutoff'],
    suggestions: [
      'deadline after a date',
      'deadline before a date',
      'what if a deadline falls on a weekend',
      'does the start date count',
    ],
  },
  {
    id: 'before-after',
    priority: 16,
    phrases: [
      'after',
      'before',
      'from',
      'starting from',
      'starting on',
      'prior to',
      'ahead of',
      'later than',
      'earlier than',
    ],
    fragments: ['aft', 'bef', 'prio', 'earl', 'late'],
    typoWords: ['after', 'before'],
    suggestions: [
      'days after a date',
      'days before a date',
      'business days after a date',
      'business days before a date',
    ],
  },
]

function numericSuggestions(query: string) {
  const normalized = normalize(query)
  const amount = normalized.match(/\b(\d+)\b/)?.[1]

  if (!amount) return []

  if (/^\d+$/.test(normalized)) {
    return [
      `${amount} days from today`,
      `${amount} day return window`,
      `Net ${amount} invoice`,
      `${amount} day notice period`,
    ]
  }

  if (/^\d+\s+d(?:a(?:y(?:s)?)?)?$/.test(normalized)) {
    return [
      `${amount} days from today`,
      `${amount} day return window`,
      `${amount} day notice period`,
      `${amount} day free trial`,
    ]
  }

  if (
    normalized.includes('business') ||
    normalized.includes('working day') ||
    normalized.includes('work day') ||
    normalized.includes('weekday')
  ) {
    if (
      normalized.includes('before') ||
      normalized.includes('prior to')
    ) {
      return [
        `${amount} business days before a date`,
        `${amount} business days from today`,
        `${amount} business days after a date`,
      ]
    }

    if (
      normalized.includes('after') ||
      normalized.includes('from date') ||
      normalized.includes('from a date')
    ) {
      return [
        `${amount} business days after a date`,
        `${amount} business days from today`,
        `${amount} business days before a date`,
      ]
    }

    return [
      `${amount} business days from today`,
      `${amount} business days after a date`,
      `${amount} business days before a date`,
    ]
  }

  if (normalized.includes('return') || normalized.includes('refund')) {
    return [
      `${amount} day return window`,
      'return deadline from a purchase date',
      'return deadline from today',
    ]
  }

  if (normalized.includes('trial')) {
    return [
      `${amount} day free trial`,
      'trial end date from a start date',
      'when should I cancel my trial',
    ]
  }

  if (normalized.includes('notice')) {
    return [
      `${amount} day notice period`,
      'when should I give notice',
      'notice deadline before a date',
    ]
  }

  if (normalized.includes('within')) {
    return [
      `what does within ${amount} days mean`,
      `within ${amount} business days`,
      'does the start date count',
    ]
  }

  return []
}

function fallbackSuggestions(query: string) {
  const normalized = normalize(query)

  if (!normalized) return []

  // Keep broad fallbacks aligned to WhenIsDue's real product areas.
  if (
    normalized.includes('pay') ||
    normalized.includes('bill') ||
    normalized.includes('money')
  ) {
    return [
      'invoice due date from Net terms',
      'when is my next payday',
      'Net 30 due date',
      '2/10 Net 30',
    ]
  }

  if (
    normalized.includes('buy') ||
    normalized.includes('purchase') ||
    normalized.includes('order') ||
    normalized.includes('store')
  ) {
    return [
      '30 day return window',
      'when should my order arrive',
      'return deadline from a purchase date',
      'delivery date range from a ship date',
    ]
  }

  if (
    normalized.includes('cancel') ||
    normalized.includes('membership') ||
    normalized.includes('plan')
  ) {
    return [
      'when does my subscription renew',
      'cancel before renewal',
      'when should I cancel my trial',
      '30 day notice period',
    ]
  }

  if (
    normalized.includes('work') ||
    normalized.includes('office') ||
    normalized.includes('client')
  ) {
    return [
      '5 business days from today',
      'deadline in working hours',
      'invoice due date from Net terms',
      '30 day notice period',
    ]
  }

  return [
    '5 business days from today',
    'invoice due date from Net terms',
    '30 day return window',
    'deadline after a date',
  ]
}

export type AskWhenSuggestionMode = 'recognized' | 'typo' | 'ambiguous' | 'fallback'

export type AskWhenSuggestionAnalysis = {
  mode: AskWhenSuggestionMode
  label: string
  suggestions: string[]
}

function titleCaseIntentLabel(intentId: string) {
  const labels: Record<string, string> = {
    'business-days': 'Business days',
    'calendar-days': 'Calendar days',
    returns: 'Returns',
    'free-trial': 'Free trial',
    'invoice-net': 'Invoice',
    'invoice-eom': 'End of month',
    'discount-net-terms': '2/10 Net 30',
    'end-generic': 'End date',
    shipping: 'Shipping',
    notice: 'Notice period',
    payday: 'Payday',
    renewal: 'Subscription renewal',
    weekend: 'Weekend deadline',
    holidays: 'Public holidays',
    within: 'Within X days',
    'between-dates': 'Days between dates',
    'business-hours': 'Business-hours deadline',
    'start-date-count': 'Start-date counting',
    deadline: 'Deadline',
    'before-after': 'Before / after a date',
  }

  return labels[intentId] ?? intentId
}

function bestTypoCorrection(query: string, intent: AskWhenIntentDefinition) {
  const words = normalize(query).split(' ').filter(Boolean)
  let best: { corrected: string; distance: number } | null = null

  for (const word of words) {
    if (word.length < 4) continue

    for (const target of intent.typoWords ?? []) {
      const normalizedTarget = normalize(target)
      const distance = editDistance(word, normalizedTarget)
      const adjacentSwap = isSingleAdjacentTransposition(word, normalizedTarget)
      const allowed =
        adjacentSwap ||
        distance === 1 ||
        (distance === 2 && Math.max(word.length, normalizedTarget.length) >= 7)

      if (!allowed) continue

      if (!best || distance < best.distance) {
        best = { corrected: normalizedTarget, distance }
      }
    }
  }

  return best
}

export function analyzeAskWhenSuggestions(
  query: string,
): AskWhenSuggestionAnalysis {
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) {
    return {
      mode: 'fallback',
      label: '',
      suggestions: [],
    }
  }

  const numeric = numericSuggestions(normalizedQuery)

  const scored = intents
    .map((intent) => {
      const phraseMatches = intent.phrases.map((phrase) =>
        phraseScore(normalizedQuery, phrase),
      )
      const fragmentMatches = (intent.fragments ?? []).map((fragment) =>
        phraseScore(normalizedQuery, fragment) - 8,
      )
      const typoScore = typoWordScore(
        normalizedQuery,
        intent.typoWords ?? [],
      )
      const typoCorrection = bestTypoCorrection(normalizedQuery, intent)

      const strongestPhraseScore = Math.max(0, ...phraseMatches, ...fragmentMatches)
      const strongestScore = Math.max(strongestPhraseScore, typoScore)
      const directPhraseMatch = intent.phrases.some((candidate) => {
        const normalizedCandidate = normalize(candidate)
        return (
          normalizedQuery === normalizedCandidate ||
          normalizedCandidate.startsWith(normalizedQuery)
        )
      })

      const directFragmentMatch = (intent.fragments ?? []).some((candidate) => {
        const normalizedCandidate = normalize(candidate)
        return normalizedQuery === normalizedCandidate
      })

      const directNormalizedMatch =
        directPhraseMatch || directFragmentMatch

      return {
        intent,
        score: strongestScore + (intent.priority ?? 0),
        phraseScore: strongestPhraseScore,
        typoScore,
        typoCorrection,
        directNormalizedMatch,
      }
    })
    .filter((item) => item.score >= 48)
    .sort((a, b) => b.score - a.score)

  const rankedSuggestions = scored.flatMap(({ intent }) => intent.suggestions)
  const combined = unique([...numeric, ...rankedSuggestions])
  const suggestions =
    combined.length >= 4
      ? combined.slice(0, 4)
      : unique([
          ...combined,
          ...fallbackSuggestions(normalizedQuery),
        ]).slice(0, 4)

  if (scored.length === 0) {
    return {
      mode: 'fallback',
      label: normalizedQuery,
      suggestions,
    }
  }

  const top = scored[0]
  const second = scored[1]
  const scoreGap = second ? top.score - second.score : 999

  const exactOrClearPhrase =
    top.phraseScore >= 120 &&
    (!second || scoreGap >= 12 || top.phraseScore >= 160)

  const likelyTypo =
    Boolean(top.typoCorrection) &&
    top.typoScore >= 54 &&
    !top.directNormalizedMatch

  if (likelyTypo && top.typoCorrection) {
    const corrected =
      top.intent.id === 'free-trial' && top.typoCorrection.corrected === 'trial'
        ? 'Trial'
        : top.intent.id === 'invoice-net' && top.typoCorrection.corrected === 'invoice'
          ? 'Invoice'
          : top.intent.id === 'shipping' && top.typoCorrection.corrected === 'delivery'
            ? 'Delivery'
            : top.intent.id === 'renewal' && top.typoCorrection.corrected === 'renewal'
              ? 'Renewal'
              : top.intent.id === 'notice' && top.typoCorrection.corrected === 'notice'
                ? 'Notice'
                : top.intent.id === 'returns' && top.typoCorrection.corrected === 'return'
                  ? 'Return'
                  : top.typoCorrection.corrected.charAt(0).toUpperCase() +
                    top.typoCorrection.corrected.slice(1)

    return {
      mode: 'typo',
      label: corrected,
      suggestions,
    }
  }

  if (exactOrClearPhrase) {
    return {
      mode: 'recognized',
      label: titleCaseIntentLabel(top.intent.id),
      suggestions,
    }
  }

  const clearlyAmbiguous =
    scored.length > 1 &&
    scoreGap < 18

  return {
    mode: clearlyAmbiguous ? 'ambiguous' : 'recognized',
    label: clearlyAmbiguous
      ? normalizedQuery
      : titleCaseIntentLabel(top.intent.id),
    suggestions,
  }
}

export function getAskWhenSuggestions(query: string) {
  return analyzeAskWhenSuggestions(query).suggestions
}
