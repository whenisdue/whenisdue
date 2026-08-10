import assert from 'node:assert/strict'

import { parsePlainDate, toDateKey } from './src/dateHelpers.ts'
import {
  compareDeadlineStartDayChoices,
  resolveStartDayConvention,
} from './src/deadlineStartDayAmbiguity.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert(parsed, `Invalid test date: ${value}`)
  return parsed
}

const comparison = compareDeadlineStartDayChoices({
  triggerDate: date('2026-08-10'),
  duration: 5,
  direction: 'after',
  unit: 'business-days',
  holidayCalendar: 'none',
  endDayAdjustment: 'none',
})

assert.equal(toDateKey(comparison.excluded.answerDate), '2026-08-17')
assert.equal(toDateKey(comparison.included.answerDate), '2026-08-14')
assert.equal(comparison.sameResult, false)

assert.equal(resolveStartDayConvention('exclude-trigger'), 'exclude-trigger')
assert.equal(
  resolveStartDayConvention('include-if-qualifying'),
  'include-if-qualifying',
)
assert.equal(resolveStartDayConvention('unspecified'), null)

console.log('✓ Deadline start-day ambiguity v1 passed')
console.log('  Ambiguous wording can now show both outcomes without inventing certainty')
