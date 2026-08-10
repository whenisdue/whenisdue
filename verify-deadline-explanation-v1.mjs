import assert from 'node:assert/strict'

import { parsePlainDate } from './src/dateHelpers.ts'
import { calculateDeadlineByRule } from './src/deadlineRules.ts'
import { buildDeadlineExplanation } from './src/deadlineExplanation.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert(parsed, `Invalid test date: ${value}`)
  return parsed
}

const business = calculateDeadlineByRule({
  triggerDate: date('2026-08-10'),
  duration: 5,
  direction: 'after',
  unit: 'business-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'us',
  endDayAdjustment: 'none',
})

assert(business)
assert.equal(
  buildDeadlineExplanation(business, 'received'),
  'Count 5 business days after receipt. The start date is not counted. Business days are Monday–Friday, excluding US federal holidays.',
)

const calendar = calculateDeadlineByRule({
  triggerDate: date('2026-08-10'),
  duration: 30,
  direction: 'after',
  unit: 'calendar-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'none',
  endDayAdjustment: 'none',
})

assert(calendar)
assert.equal(
  buildDeadlineExplanation(calendar, null),
  'Count 30 calendar days after the start date. The start date is not counted.',
)

const adjusted = calculateDeadlineByRule({
  triggerDate: date('2026-08-08'),
  duration: 30,
  direction: 'after',
  unit: 'calendar-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'us',
  endDayAdjustment: 'next-business-day',
})

assert(adjusted)
assert.match(
  buildDeadlineExplanation(adjusted, null),
  /moves to the next business day\.$/,
)

console.log('✓ Deadline explanation v1 passed')
console.log('  Main-result explanations are now plain-language and rule-aware')
