import assert from 'node:assert/strict'

import {
  buildDeadlineSharePath,
  parseDeadlineShareState,
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

assert.equal(params.get('sv'), '1')
assert.equal(params.get('date'), '2026-08-10')
assert.equal(params.get('days'), '30')
assert.equal(params.get('trigger'), 'received')
assert.equal(params.get('schedule'), 'standard_mon_fri')

assert.deepEqual(
  parseDeadlineShareState(params),
  {
    ...state,
    shareStateVersion: 1,
  },
)

assert.equal(
  buildDeadlineSharePath(state),
  '/deadline-calculator?sv=1&date=2026-08-10&days=30&direction=after&unit=calendar-days&startday=exclude-trigger&calendar=none&endrule=none&schedule=standard_mon_fri&trigger=received',
)

// Invalid or future share-state versions should fail closed.
assert.equal(
  parseDeadlineShareState(
    '?sv=2&date=2026-08-10&days=30&direction=after&unit=calendar-days&startday=exclude-trigger&calendar=none&endrule=none&schedule=standard_mon_fri',
  ),
  null,
)

assert.equal(
  parseDeadlineShareState(
    '?sv=1&date=not-a-date&days=30&direction=after&unit=calendar-days&startday=exclude-trigger&calendar=none&endrule=none&schedule=standard_mon_fri',
  ),
  null,
)

console.log('✓ Deadline share-state v1 passed')
console.log('  Share URLs now encode a versioned, reproducible deadline setup')
