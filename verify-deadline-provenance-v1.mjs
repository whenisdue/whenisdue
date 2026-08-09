import assert from 'node:assert/strict'

import { parsePlainDate } from './src/dateHelpers.ts'
import { calculateDeadlineByRule } from './src/deadlineRules.ts'
import {
  buildDeadlineProvenanceRows,
  summarizeDeadlineProvenance,
} from './src/deadlineProvenance.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert(parsed, `Invalid test date: ${value}`)
  return parsed
}

const businessAnswer = calculateDeadlineByRule({
  triggerDate: date('2026-12-31'),
  duration: 1,
  direction: 'after',
  unit: 'business-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'us',
  endDayAdjustment: 'none',
})

assert(businessAnswer)

assert.deepEqual(
  buildDeadlineProvenanceRows(businessAnswer),
  [
    {
      label: 'Deadline rules',
      value: 'deadline-rule-v1',
    },
    {
      label: 'Working schedule',
      value: 'Monday–Friday',
    },
    {
      label: 'Holiday rules',
      value: 'US federal holidays · us-federal-v1',
    },
  ],
)

assert.deepEqual(
  summarizeDeadlineProvenance(businessAnswer),
  {
    deadlineRuleVersion: 'deadline-rule-v1',
    workingScheduleId: 'standard_mon_fri',
    holidayCalendar: 'us',
    holidayCalendarVersion: 'us-federal-v1',
  },
)

const calendarAnswer = calculateDeadlineByRule({
  triggerDate: date('2026-08-10'),
  duration: 30,
  direction: 'after',
  unit: 'calendar-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'none',
  endDayAdjustment: 'none',
})

assert(calendarAnswer)

assert.deepEqual(
  buildDeadlineProvenanceRows(calendarAnswer),
  [
    {
      label: 'Deadline rules',
      value: 'deadline-rule-v1',
    },
  ],
)

console.log('✓ Deadline provenance v1 passed')
console.log('  Rule, working-schedule, and holiday-calendar versions are readable and reproducible')
