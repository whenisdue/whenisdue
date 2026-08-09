import assert from 'node:assert/strict'

import { parsePlainDate, toDateKey } from './src/dateHelpers.ts'
import { interpretDeadlinePhrase } from './src/deadlinePhrase.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert(parsed, `Invalid test date: ${value}`)
  return parsed
}

function expectResolved(phrase, expectedDate, options = {}) {
  const result = interpretDeadlinePhrase(phrase, options)
  assert(result, `Expected interpretation for: ${phrase}`)
  assert.equal(result.classification, 'resolved', phrase)
  assert(result.answer, `Expected answer for: ${phrase}`)
  assert.equal(toDateKey(result.answer.answerDate), expectedDate, phrase)
}

function expectAmbiguous(phrase, expectedDate, options = {}) {
  const result = interpretDeadlinePhrase(phrase, options)
  assert(result, `Expected interpretation for: ${phrase}`)
  assert.equal(result.classification, 'ambiguous', phrase)
  assert(result.answer, `Expected default answer for: ${phrase}`)
  assert.equal(toDateKey(result.answer.answerDate), expectedDate, phrase)
  assert(result.ambiguities.includes('start-day-rule'), phrase)
}

function expectUnderspecified(phrase) {
  const result = interpretDeadlinePhrase(phrase)
  assert(result, `Expected interpretation for: ${phrase}`)
  assert.equal(result.classification, 'underspecified', phrase)
  assert.equal(result.answer, null, phrase)
  assert(result.missing.includes('trigger-date'), phrase)
}

// RESOLVED: explicit after/before wording.
expectResolved('5 business days after 2026-08-10', '2026-08-17')
expectResolved('within 5 business days after 2026-08-10', '2026-08-17')
expectResolved('5 business days before 2026-08-10', '2026-08-03')
expectResolved('within 3 calendar days before 2026-08-10', '2026-08-07')
expectResolved(
  '1 working day after 2026-12-31',
  '2027-01-04',
  { holidayCalendar: 'us' },
)

// AMBIGUOUS: from/of do not force a start-day convention.
expectAmbiguous('5 business days from 2026-08-10', '2026-08-17')
expectAmbiguous('within 5 business days of 2026-08-10', '2026-08-17')
expectAmbiguous('5 calendar days from 2026-08-10', '2026-08-15')
expectAmbiguous(
  '5 business days from today',
  '2026-08-17',
  { today: date('2026-08-10') },
)

// UNDERSPECIFIED: missing trigger date.
expectUnderspecified('within 5 business days')
expectUnderspecified('5 calendar days')

// UNSUPPORTED: open prose stays unsupported.
assert.equal(interpretDeadlinePhrase('respond sometime next week'), null)
assert.equal(interpretDeadlinePhrase('five business days after 2026-08-10'), null)
assert.equal(interpretDeadlinePhrase('5 business days after delivery'), null)

console.log('✓ Deadline phrase calibration corpus v1 passed')
console.log('  Resolved, ambiguous, underspecified, and unsupported cases checked')
