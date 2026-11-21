import assert from 'node:assert/strict'
import {
  addBusinessDays,
  addCalendarDays,
  calculateInvoiceDueDate,
  parsePlainDate,
  toDateKey,
} from '../src/dateHelpers.ts'
import {
  buildReturnWindowShareUrl,
  calculateReturnWindowDeadline,
  parseReturnWindowCountingRule,
} from '../src/returnWindowCalculation.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert.ok(parsed, `Invalid test date: ${value}`)
  return parsed
}

function expectDate(actual, expected, label) {
  assert.equal(toDateKey(actual), expected, label)
}

function countBusinessDaysBetween(start, end) {
  const startKey = toDateKey(start)
  const endKey = toDateKey(end)

  if (startKey === endKey) return 0

  const earlier = startKey < endKey ? start : end
  const later = startKey < endKey ? end : start
  let count = 0
  let cursor = addCalendarDays(earlier, 1)

  while (toDateKey(cursor) <= toDateKey(later)) {
    const current = new Date(`${toDateKey(cursor)}T12:00:00Z`)
    const weekday = current.getUTCDay()
    if (weekday !== 0 && weekday !== 6) count += 1
    cursor = addCalendarDays(cursor, 1)
  }

  return count
}

const tests = [
  () => expectDate(addBusinessDays(date('2026-12-31'), 1), '2027-01-01', 'Year-end business day'),
  () => expectDate(addBusinessDays(date('2024-02-27'), 2), '2024-02-29', 'Leap-year business day'),
  () => expectDate(addBusinessDays(date('2026-08-08'), 3), '2026-08-12', 'Weekend start + 3 business days'),
  () => expectDate(addBusinessDays(date('2026-08-08'), 10), '2026-08-21', 'Weekend start + 10 business days'),

  () => expectDate(calculateInvoiceDueDate(date('2026-12-31'), 'net30'), '2027-01-30', 'Net 30 year-end'),
  () => expectDate(calculateInvoiceDueDate(date('2024-02-01'), 'eom'), '2024-02-29', 'EOM leap February'),
  () => expectDate(calculateInvoiceDueDate(date('2026-08-08'), 'net90'), '2026-11-06', 'Net 90'),

  () => expectDate(addCalendarDays(date('2026-12-31'), 29), '2027-01-29', '30-day return window, start is day 1'),
  () => expectDate(addCalendarDays(date('2026-08-08'), 6), '2026-08-14', '7-day return window, start is day 1'),

  () => expectDate(calculateReturnWindowDeadline(date('2026-11-19'), 30, 'start-date'), '2026-12-18', '30-day return window, start date counts'),
  () => expectDate(calculateReturnWindowDeadline(date('2026-11-19'), 30, 'next-day'), '2026-12-19', '30-day return window, counting begins next day'),
  () => expectDate(calculateReturnWindowDeadline(date('2026-01-31'), 30, 'start-date'), '2026-03-01', '30-day January window, start date counts'),
  () => expectDate(calculateReturnWindowDeadline(date('2026-01-31'), 30, 'next-day'), '2026-03-02', '30-day January window, next-day counting'),
  () => expectDate(calculateReturnWindowDeadline(date('2028-02-28'), 2, 'start-date'), '2028-02-29', 'Leap-day window, start date counts'),
  () => expectDate(calculateReturnWindowDeadline(date('2028-02-28'), 2, 'next-day'), '2028-03-01', 'Leap-day window, next-day counting'),
  () => expectDate(calculateReturnWindowDeadline(date('2026-06-15'), 1, 'start-date'), '2026-06-15', 'One-day window, start date counts'),
  () => expectDate(calculateReturnWindowDeadline(date('2026-06-15'), 1, 'next-day'), '2026-06-16', 'One-day window, next-day counting'),
  () => assert.equal(parseReturnWindowCountingRule(null), 'start-date', 'Missing rule keeps legacy convention'),
  () => assert.equal(parseReturnWindowCountingRule('unexpected'), 'start-date', 'Invalid rule safely uses legacy convention'),
  () => assert.equal(parseReturnWindowCountingRule('next-day'), 'next-day', 'Alternative URL rule is recognized'),
  () => {
    const url = new URL(buildReturnWindowShareUrl(
      'https://www.whenisdue.com/return-window-calculator?utm_source=mail&rule=invalid#answer',
      { start: '2026-11-19', days: '30', rule: 'start-date' },
    ))
    assert.equal(url.searchParams.get('start'), '2026-11-19', 'Default URL keeps start')
    assert.equal(url.searchParams.get('days'), '30', 'Default URL keeps duration')
    assert.equal(url.searchParams.has('rule'), false, 'Default URL removes rule parameter')
    assert.equal(url.searchParams.get('utm_source'), 'mail', 'URL keeps campaign parameters')
    assert.equal(url.hash, '#answer', 'URL keeps the fragment')
  },
  () => {
    const url = new URL(buildReturnWindowShareUrl(
      'https://www.whenisdue.com/return-window-calculator?utm_campaign=holiday',
      { start: '2026-11-19', days: '30', rule: 'next-day' },
    ))
    assert.equal(url.searchParams.get('rule'), 'next-day', 'Alternative URL preserves rule')
    assert.equal(url.searchParams.get('utm_campaign'), 'holiday', 'Alternative URL keeps campaign parameters')
  },

  () => expectDate(addCalendarDays(date('2026-12-31'), 7), '2027-01-07', '7-day trial end'),
  () => expectDate(addCalendarDays(date('2027-01-07'), -1), '2027-01-06', 'One-day-before trial reminder'),

  () => assert.equal(countBusinessDaysBetween(date('2026-12-31'), date('2027-01-04')), 2, 'Business days between year-end dates'),
  () => assert.equal(countBusinessDaysBetween(date('2026-08-10'), date('2026-08-14')), 4, 'Start excluded, end included'),
  () => assert.equal(countBusinessDaysBetween(date('2026-08-14'), date('2026-08-17')), 1, 'Friday to Monday'),
  () => assert.equal(countBusinessDaysBetween(date('2026-08-15'), date('2026-08-16')), 0, 'Weekend-only range'),
  () => assert.equal(countBusinessDaysBetween(date('2026-08-14'), date('2026-08-14')), 0, 'Same-date range'),
  () => assert.equal(countBusinessDaysBetween(date('2027-01-04'), date('2026-12-31')), 2, 'Reversed range is order-independent'),
]

let passed = 0

for (const test of tests) {
  test()
  passed += 1
}

console.log(`✓ WhenIsDue date regression checks passed: ${passed}/${tests.length}`)
