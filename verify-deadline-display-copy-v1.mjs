import assert from 'node:assert/strict'
import {
  getHolidayCalendarDisplayLabel,
  getTriggerDisplayLabel,
} from './src/deadlineDisplayLabels.ts'

assert.equal(getTriggerDisplayLabel('received'), 'Receipt')
assert.equal(getTriggerDisplayLabel('served'), 'Service')
assert.equal(getTriggerDisplayLabel(null), 'Start date')

assert.equal(getHolidayCalendarDisplayLabel('us'), 'US federal holidays')
assert.equal(
  getHolidayCalendarDisplayLabel('uk'),
  'England & Wales bank holidays',
)
assert.equal(
  getHolidayCalendarDisplayLabel('ph'),
  'Philippines predictable regular holidays',
)

console.log('✓ Deadline display copy v1 passed')
console.log('  Trigger names and holiday labels are now human-readable')
