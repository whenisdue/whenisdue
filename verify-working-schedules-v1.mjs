import assert from 'node:assert/strict'

import { parsePlainDate } from './src/dateHelpers.ts'
import {
  getDefaultWorkingScheduleId,
  getWorkingSchedule,
  isWorkingWeekday,
} from './src/workingSchedules.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert(parsed, `Invalid test date: ${value}`)
  return parsed
}

assert.equal(
  getDefaultWorkingScheduleId(),
  'standard_mon_fri',
)

assert.deepEqual(
  getWorkingSchedule('standard_mon_fri').workingWeekdays,
  [1, 2, 3, 4, 5],
)

assert.equal(
  isWorkingWeekday(date('2026-08-10')),
  true,
  'Monday should be a working weekday',
)

assert.equal(
  isWorkingWeekday(date('2026-08-14')),
  true,
  'Friday should be a working weekday',
)

assert.equal(
  isWorkingWeekday(date('2026-08-15')),
  false,
  'Saturday should not be a working weekday',
)

assert.equal(
  isWorkingWeekday(date('2026-08-16')),
  false,
  'Sunday should not be a working weekday',
)

console.log('✓ Working schedule foundation v1 passed')
console.log('  Monday–Friday assumptions are now explicit and versioned')
