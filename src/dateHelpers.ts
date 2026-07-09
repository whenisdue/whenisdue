export type CalculatorMode =
  | 'calendar'
  | 'business'
  | 'invoice'
  | 'trial'
  | 'return'

export type InvoiceTerm = 'net7' | 'net15' | 'net30' | 'net45' | 'net60' | 'net90' | 'eom'

export type PlainDate = {
  year: number
  month: number
  day: number
}

export const modeLabels: Record<CalculatorMode, string> = {
  calendar: 'Calendar days',
  business: 'Business days',
  invoice: 'Invoice terms',
  trial: 'Free trial',
  return: 'Return window',
}

export const invoiceTermLabels: Record<InvoiceTerm, string> = {
  net7: 'Net 7',
  net15: 'Net 15',
  net30: 'Net 30',
  net45: 'Net 45',
  net60: 'Net 60',
  net90: 'Net 90',
  eom: 'EOM',
}

const invoiceTermDays: Partial<Record<InvoiceTerm, number>> = {
  net7: 7,
  net15: 15,
  net30: 30,
  net45: 45,
  net60: 60,
  net90: 90,
}

const millisecondsPerDay = 86_400_000

export function getTodayPlainDate(now = new Date()): PlainDate {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  }
}

export function todayInputValue(now = new Date()): string {
  return toDateKey(getTodayPlainDate(now))
}

export function parsePlainDate(value: string): PlainDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    return null
  }

  return { year, month, day }
}

export function toDateKey(date: PlainDate): string {
  const year = String(date.year).padStart(4, '0')
  const month = String(date.month).padStart(2, '0')
  const day = String(date.day).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatPlainDate(date: PlainDate, variant: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    month: variant === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(toUtcDate(date))
}

export function formatWeekday(date: PlainDate): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    weekday: 'long',
  }).format(toUtcDate(date))
}

export function parseInteger(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) {
    return null
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return null
  }

  return parsed
}

export function addCalendarDays(startDate: PlainDate, days: number): PlainDate {
  return fromDayIndex(toDayIndex(startDate) + days)
}

export function addBusinessDays(startDate: PlainDate, businessDays: number): PlainDate {
  let result = startDate
  let added = 0

  while (added < businessDays) {
    result = addCalendarDays(result, 1)

    if (!isWeekend(result)) {
      added += 1
    }
  }

  return result
}

export function calculateInvoiceDueDate(startDate: PlainDate, term: InvoiceTerm): PlainDate {
  if (term === 'eom') {
    return {
      year: startDate.year,
      month: startDate.month,
      day: daysInMonth(startDate.year, startDate.month),
    }
  }

  return addCalendarDays(startDate, invoiceTermDays[term] ?? 30)
}

export function daysBetween(start: PlainDate, end: PlainDate): number {
  return toDayIndex(end) - toDayIndex(start)
}

export function getStatusText(daysRemaining: number, done = false): string {
  if (done) {
    return 'Done'
  }

  if (daysRemaining < 0) {
    return `Overdue by ${Math.abs(daysRemaining)} ${pluralize('day', Math.abs(daysRemaining))}`
  }

  if (daysRemaining === 0) {
    return 'Due today'
  }

  if (daysRemaining === 1) {
    return 'Due tomorrow'
  }

  return `${daysRemaining} days remaining`
}

export function getDueDateForMode(
  mode: CalculatorMode,
  startDate: PlainDate,
  amount: number,
  invoiceTerm: InvoiceTerm,
): PlainDate {
  if (mode === 'business') {
    return addBusinessDays(startDate, amount)
  }

  if (mode === 'invoice') {
    return calculateInvoiceDueDate(startDate, invoiceTerm)
  }

  return addCalendarDays(startDate, amount)
}

export function isDateInSupportedRange(date: PlainDate): boolean {
  return toDateKey(date) >= '1900-01-01' && toDateKey(date) <= '2100-12-31'
}

function toUtcDate(date: PlainDate): Date {
  return new Date(Date.UTC(date.year, date.month - 1, date.day))
}

function toDayIndex(date: PlainDate): number {
  return Date.UTC(date.year, date.month - 1, date.day) / millisecondsPerDay
}

function fromDayIndex(dayIndex: number): PlainDate {
  const date = new Date(dayIndex * millisecondsPerDay)

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}

function isWeekend(date: PlainDate): boolean {
  const day = toUtcDate(date).getUTCDay()
  return day === 0 || day === 6
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`
}
