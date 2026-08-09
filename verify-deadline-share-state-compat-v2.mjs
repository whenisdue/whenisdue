import assert from 'node:assert/strict'

import {
  buildDeadlineSharePath,
  parseDeadlineShareState,
  parseDeadlineShareStateCompat,
  parseLegacyDeadlineShareState,
  serializeDeadlineShareState,
} from './src/deadlineShareState.ts'

const state = {
  date: '2026-08-10',
  duration: 30,
  direction: 'after',
  unit: 'calendar-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'none',
  endDayAdjustment: 'none',
  triggerKind: 'received',
  workingScheduleId: 'standard_mon_fri',
}

const params = serializeDeadlineShareState(state)

assert.deepEqual(
  parseDeadlineShareState(params),
  {
    ...state,
    shareStateVersion: 1,
  },
)

const legacy =
  '?date=2026-08-10&days=30&direction=after&unit=calendar-days&startday=exclude-trigger&calendar=none&endrule=none&trigger=received'

assert.deepEqual(
  parseLegacyDeadlineShareState(legacy),
  {
    ...state,
    shareStateVersion: 1,
  },
)

assert.deepEqual(
  parseDeadlineShareStateCompat(legacy),
  {
    ...state,
    shareStateVersion: 1,
  },
)

assert.equal(
  buildDeadlineSharePath(state),
  '/deadline-calculator?sv=1&date=2026-08-10&days=30&direction=after&unit=calendar-days&startday=exclude-trigger&calendar=none&endrule=none&schedule=standard_mon_fri&trigger=received',
)

assert.equal(
  parseDeadlineShareState(
    '?sv=2&date=2026-08-10&days=30&direction=after&unit=calendar-days&startday=exclude-trigger&calendar=none&endrule=none&schedule=standard_mon_fri',
  ),
  null,
)

console.log('✓ Deadline share-state compatibility v2 passed')
console.log('  Versioned links are canonical while legacy links remain readable')
