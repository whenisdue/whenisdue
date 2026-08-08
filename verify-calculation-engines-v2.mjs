import assert from 'node:assert/strict'
import { parsePlainDate, toDateKey } from './src/dateHelpers.ts'
import { getHolidayOnDate } from './src/holidayCalendars.ts'
import { calculateBusinessHoursDeadline } from './src/businessHours.ts'
import { calculateNextPayday } from './src/payday.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert.ok(parsed, `Could not parse ${value}`)
  return parsed
}

function expectDate(actual, expected, label) {
  assert.ok(actual, `${label}: expected a date`)
  assert.equal(toDateKey(actual), expected, label)
}

function expectDeadline(actual, expectedDate, expectedTime, label) {
  assert.ok(actual, `${label}: expected a deadline`)
  assert.equal(toDateKey(actual.date), expectedDate, `${label} date`)
  assert.equal(actual.time, expectedTime, `${label} time`)
}

const observedNewYear = getHolidayOnDate(date('2021-12-31'), 'us')
assert.ok(observedNewYear, 'US observed New Year should exist on 2021-12-31')
assert.match(observedNewYear.name, /New Year/i)

expectDeadline(
  calculateBusinessHoursDeadline(date('2026-08-14'), '15:00', 4, '09:00', '17:00', 'none'),
  '2026-08-17',
  '11:00',
  'Friday 3 PM + 4 business hours',
)

expectDeadline(
  calculateBusinessHoursDeadline(date('2026-08-15'), '10:00', 1, '09:00', '17:00', 'none'),
  '2026-08-17',
  '10:00',
  'Saturday + 1 business hour',
)

expectDeadline(
  calculateBusinessHoursDeadline(date('2026-08-17'), '07:00', 1, '09:00', '17:00', 'none'),
  '2026-08-17',
  '10:00',
  'Before workday + 1 business hour',
)

expectDeadline(
  calculateBusinessHoursDeadline(date('2026-08-17'), '17:00', 1, '09:00', '17:00', 'none'),
  '2026-08-18',
  '10:00',
  'At workday end + 1 business hour',
)

const newYearRollover = calculateBusinessHoursDeadline(
  date('2021-12-30'),
  '16:00',
  2,
  '09:00',
  '17:00',
  'us',
)
expectDeadline(
  newYearRollover,
  '2022-01-03',
  '10:00',
  'Observed New Year SLA rollover',
)
assert.ok(newYearRollover, 'Observed New Year rollover should return a result')
assert.deepEqual(
  newYearRollover.skippedHolidays.map((item) => item.date),
  ['2021-12-31'],
  'SLA receipt should report the observed holiday it skipped',
)
assert.match(
  newYearRollover.skippedHolidays[0]?.name ?? '',
  /New Year/i,
  'Skipped holiday should be identified as New Year',
)

expectDate(calculateNextPayday(date('2026-12-25'), 'weekly'), '2027-01-01', 'Weekly rollover')
expectDate(calculateNextPayday(date('2026-12-25'), 'biweekly'), '2027-01-08', 'Biweekly rollover')
expectDate(calculateNextPayday(date('2027-01-31'), 'monthly'), '2027-02-28', 'Jan 31 monthly')
expectDate(calculateNextPayday(date('2028-01-31'), 'monthly'), '2028-02-29', 'Leap-year Jan 31 monthly')
expectDate(calculateNextPayday(date('2027-01-15'), 'semimonthly-1-15'), '2027-02-01', '1st and 15th after Jan 15')
expectDate(calculateNextPayday(date('2027-02-15'), 'semimonthly-15-last'), '2027-02-28', '15th and month end')

console.log('✓ Calculation engine regression matrix v2 passed')
