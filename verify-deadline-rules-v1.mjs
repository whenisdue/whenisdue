import assert from 'node:assert/strict'

import { parsePlainDate, toDateKey } from './src/dateHelpers.ts'
import { calculateDeadlineByRule } from './src/deadlineRules.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert(parsed, `Invalid test date: ${value}`)
  return parsed
}

function resultDate(input) {
  const result = calculateDeadlineByRule(input)
  assert(result, 'Expected a deadline result')
  return {
    result,
    key: toDateKey(result.answerDate),
  }
}

// Excluding Monday as the trigger: Tue/Wed/Thu/Fri/Mon = 5 business days.
{
  const { key } = resultDate({
    triggerDate: date('2026-08-10'),
    duration: 5,
    direction: 'after',
    unit: 'business-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  assert.equal(key, '2026-08-17')
}

// Including a qualifying Monday as day one makes Friday the fifth business day.
{
  const { key } = resultDate({
    triggerDate: date('2026-08-10'),
    duration: 5,
    direction: 'after',
    unit: 'business-days',
    startDayConvention: 'include-if-qualifying',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  assert.equal(key, '2026-08-14')
}

// If the trigger date is a weekend, "include if qualifying" does not count it.
{
  const { key } = resultDate({
    triggerDate: date('2026-08-08'),
    duration: 1,
    direction: 'after',
    unit: 'business-days',
    startDayConvention: 'include-if-qualifying',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  assert.equal(key, '2026-08-10')
}

// Calendar-day arithmetic remains literal.
{
  const { key } = resultDate({
    triggerDate: date('2026-08-08'),
    duration: 2,
    direction: 'after',
    unit: 'calendar-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  assert.equal(key, '2026-08-10')
}

// Backward business-day counting works too.
{
  const { key } = resultDate({
    triggerDate: date('2026-08-10'),
    duration: 1,
    direction: 'before',
    unit: 'business-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'none',
  })

  assert.equal(key, '2026-08-07')
}

// A calendar-day result on Saturday can be moved to the next business day.
{
  const { key } = resultDate({
    triggerDate: date('2026-08-14'),
    duration: 1,
    direction: 'after',
    unit: 'calendar-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'next-business-day',
  })

  assert.equal(key, '2026-08-17')
}

// U.S. New Year's Day plus the weekend are skipped.
{
  const { result, key } = resultDate({
    triggerDate: date('2026-12-31'),
    duration: 1,
    direction: 'after',
    unit: 'business-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'us',
    endDayAdjustment: 'none',
  })

  assert.equal(key, '2027-01-04')
  assert(
    result.skippedDates.some(
      (item) =>
        item.date === '2027-01-01' &&
        item.reason === 'holiday' &&
        item.name === "New Year's Day",
    ),
    'Expected New Year holiday to be recorded as skipped',
  )
}

// Zero-day deadlines keep the trigger date unless an end-day adjustment moves it.
{
  const { key } = resultDate({
    triggerDate: date('2026-08-08'),
    duration: 0,
    direction: 'after',
    unit: 'calendar-days',
    startDayConvention: 'exclude-trigger',
    holidayCalendar: 'none',
    endDayAdjustment: 'next-business-day',
  })

  assert.equal(key, '2026-08-10')
}

console.log('✓ Deadline rule engine v1 regression matrix passed')
