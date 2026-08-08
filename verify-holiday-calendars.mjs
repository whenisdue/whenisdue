import assert from 'node:assert/strict'
import { parsePlainDate, toDateKey } from './src/dateHelpers.ts'
import {
  calculateBusinessDaysWithCalendar,
  countBusinessDaysBetweenWithCalendar,
} from './src/holidayCalendars.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert.ok(parsed, `Invalid test date: ${value}`)
  return parsed
}

function expectDate(actual, expected, label) {
  assert.equal(toDateKey(actual), expected, label)
}

const tests = [
  () => {
    const result = calculateBusinessDaysWithCalendar(date('2026-12-23'), 2, 'none')
    expectDate(result.date, '2026-12-25', 'Weekends-only calendar still counts Christmas')
  },
  () => {
    const result = calculateBusinessDaysWithCalendar(date('2026-12-23'), 2, 'us')
    expectDate(result.date, '2026-12-28', 'US federal calendar skips Christmas')
    assert.equal(result.skippedHolidays[0]?.name, 'Christmas Day')
  },
  () => {
    const result = calculateBusinessDaysWithCalendar(date('2026-12-23'), 2, 'uk')
    expectDate(result.date, '2026-12-29', 'UK calendar skips Christmas and Boxing substitute day')
    assert.equal(result.skippedHolidays.length, 2)
  },
  () => {
    const result = calculateBusinessDaysWithCalendar(date('2026-12-23'), 2, 'ca')
    expectDate(result.date, '2026-12-29', 'Canada federal calendar skips Christmas and Boxing substitute day')
    assert.equal(result.skippedHolidays.length, 2)
  },
  () => {
    const result = calculateBusinessDaysWithCalendar(date('2026-12-23'), 2, 'au')
    expectDate(result.date, '2026-12-29', 'Australia nationwide calendar skips Christmas and Boxing substitute day')
    assert.equal(result.skippedHolidays.length, 2)
  },
  () => {
    const result = calculateBusinessDaysWithCalendar(date('2026-12-23'), 2, 'ph')
    expectDate(result.date, '2026-12-28', 'Philippines calendar skips Christmas')
    assert.equal(result.skippedHolidays[0]?.name, 'Christmas Day')
  },
  () => {
    const result = countBusinessDaysBetweenWithCalendar(
      date('2026-12-23'),
      date('2026-12-29'),
      'us',
    )
    assert.equal(result.count, 3, 'US count between dates excludes Christmas')
  },
  () => {
    const result = countBusinessDaysBetweenWithCalendar(
      date('2026-12-23'),
      date('2026-12-29'),
      'uk',
    )
    assert.equal(result.count, 2, 'UK count between dates excludes Christmas and Boxing substitute day')
  },
  () => {
    const result = calculateBusinessDaysWithCalendar(date('2026-04-08'), 1, 'ph')
    expectDate(result.date, '2026-04-10', 'Philippines calendar skips Araw ng Kagitingan')
  },
  () => {
    const result = calculateBusinessDaysWithCalendar(date('2026-07-02'), 1, 'us')
    expectDate(result.date, '2026-07-06', 'US calendar observes Independence Day on Friday when July 4 is Saturday')
  },
]

let passed = 0

for (const test of tests) {
  test()
  passed += 1
}

console.log(`✓ WhenIsDue holiday calendar checks passed: ${passed}/${tests.length}`)
