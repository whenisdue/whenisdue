import assert from 'node:assert/strict'

import { parsePlainDate, toDateKey } from './src/dateHelpers.ts'
import { calculateDeadlineByRule } from './src/deadlineRules.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert(parsed, `Invalid test date: ${value}`)
  return parsed
}

// Aug 8 + 30 calendar days = Sep 7, 2026.
// With US final-day adjustment, Labor Day moves it to Sep 8.
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
assert.equal(toDateKey(adjusted.finalDayAdjustment.candidateDate), '2026-09-07')
assert.equal(toDateKey(adjusted.finalDayAdjustment.adjustedDate), '2026-09-08')
assert.equal(adjusted.finalDayAdjustment.applied, true)
assert.equal(adjusted.finalDayAdjustment.blockedDates.length, 1)
assert.equal(adjusted.finalDayAdjustment.blockedDates[0].reason, 'holiday')
assert.match(
  adjusted.finalDayAdjustment.blockedDates[0].name ?? '',
  /Labor Day/i,
)

// Adjustment-blocked dates must not be mixed into the business-day counting skips.
assert.deepEqual(adjusted.skippedDates, [])

const noAdjustment = calculateDeadlineByRule({
  triggerDate: date('2026-08-08'),
  duration: 30,
  direction: 'after',
  unit: 'calendar-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'us',
  endDayAdjustment: 'none',
})

assert(noAdjustment)
assert.equal(toDateKey(noAdjustment.answerDate), '2026-09-07')
assert.equal(noAdjustment.finalDayAdjustment.applied, false)
assert.deepEqual(noAdjustment.finalDayAdjustment.blockedDates, [])

console.log('✓ Final-day adjustment transparency v1 passed')
console.log('  Candidate date, adjustment reason, and adjusted date are now separated from counting skips')
