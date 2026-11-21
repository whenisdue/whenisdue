import { addCalendarDays, type PlainDate } from './dateHelpers.ts'

export type ReturnWindowCountingRule = 'start-date' | 'next-day'

export function isReturnWindowCountingRule(
  value: unknown,
): value is ReturnWindowCountingRule {
  return value === 'start-date' || value === 'next-day'
}

export function parseReturnWindowCountingRule(
  value: string | null,
): ReturnWindowCountingRule {
  return value === 'next-day' ? 'next-day' : 'start-date'
}

export function calculateReturnWindowDeadline(
  startDate: PlainDate,
  windowDays: number,
  rule: ReturnWindowCountingRule,
): PlainDate {
  const offset = rule === 'next-day' ? windowDays : Math.max(windowDays - 1, 0)
  return addCalendarDays(startDate, offset)
}

export function buildReturnWindowShareUrl(
  currentHref: string,
  values: {
    start: string
    days: string
    rule: ReturnWindowCountingRule
  },
): string {
  const url = new URL(currentHref)
  url.searchParams.set('start', values.start)
  url.searchParams.set('days', values.days)

  if (values.rule === 'next-day') {
    url.searchParams.set('rule', 'next-day')
  } else {
    url.searchParams.delete('rule')
  }

  return url.toString()
}
