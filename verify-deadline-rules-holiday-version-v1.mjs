import assert from 'node:assert/strict'

import { parsePlainDate } from './src/dateHelpers.ts'
import { calculateDeadlineByRule } from './src/deadlineRules.ts'
import { getHolidayCalendarVersion } from './src/holidayCalendarVersions.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert(parsed, `Invalid test date: ${value}`)
  return parsed
}

assert.equal(getHolidayCalendarVersion('none'), 'none-v1')
assert.equal(getHolidayCalendarVersion('us'), 'us-federal-v1')
assert.equal(getHolidayCalendarVersion('uk'), 'uk-england-wales-v1')
assert.equal(getHolidayCalendarVersion('ca'), 'ca-federal-v1')
assert.equal(getHolidayCalendarVersion('au'), 'au-nationwide-v1')
assert.equal(
  getHolidayCalendarVersion('ph'),
  'ph-predictable-regular-v1',
)

const usAnswer = calculateDeadlineByRule({
  triggerDate: date('2026-12-31'),
  duration: 1,
  direction: 'after',
  unit: 'business-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'us',
  endDayAdjustment: 'none',
})

assert(usAnswer)
assert.equal(usAnswer.holidayCalendar, 'us')
assert.equal(
  usAnswer.holidayCalendarVersion,
  'us-federal-v1',
)

const noHolidayAnswer = calculateDeadlineByRule({
  triggerDate: date('2026-08-10'),
  duration: 5,
  direction: 'after',
  unit: 'business-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'none',
  endDayAdjustment: 'none',
})

assert(noHolidayAnswer)
assert.equal(
  noHolidayAnswer.holidayCalendarVersion,
  'none-v1',
)

console.log('✓ Deadline rules holiday-calendar version v1 passed')
console.log('  Deadline answers now carry an explicit calendar version')
