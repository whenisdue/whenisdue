import assert from 'node:assert/strict'

import { parsePlainDate, toDateKey } from './src/dateHelpers.ts'
import { calculateDeadlineByRule } from './src/deadlineRules.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert(parsed, `Invalid test date: ${value}`)
  return parsed
}

const defaultSchedule = calculateDeadlineByRule({
  triggerDate: date('2026-08-10'),
  duration: 5,
  direction: 'after',
  unit: 'business-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'none',
  endDayAdjustment: 'none',
})

assert(defaultSchedule)
assert.equal(
  defaultSchedule.workingScheduleId,
  'standard_mon_fri',
)
assert.equal(
  toDateKey(defaultSchedule.answerDate),
  '2026-08-17',
)

const explicitSchedule = calculateDeadlineByRule({
  triggerDate: date('2026-08-10'),
  duration: 5,
  direction: 'after',
  unit: 'business-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'none',
  endDayAdjustment: 'none',
  workingScheduleId: 'standard_mon_fri',
})

assert(explicitSchedule)
assert.equal(
  explicitSchedule.workingScheduleId,
  'standard_mon_fri',
)
assert.equal(
  toDateKey(explicitSchedule.answerDate),
  '2026-08-17',
)

assert.deepEqual(
  explicitSchedule.skippedDates.map((item) => item.date),
  ['2026-08-15', '2026-08-16'],
)

const adjusted = calculateDeadlineByRule({
  triggerDate: date('2026-08-15'),
  duration: 0,
  direction: 'after',
  unit: 'calendar-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'none',
  endDayAdjustment: 'next-business-day',
  workingScheduleId: 'standard_mon_fri',
})

assert(adjusted)
assert.equal(toDateKey(adjusted.answerDate), '2026-08-17')

console.log('✓ Deadline rules working-schedule v2 passed')
console.log('  Business-day qualification now uses the explicit working schedule module')
