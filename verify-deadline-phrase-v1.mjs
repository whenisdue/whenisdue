import assert from 'node:assert/strict'

import {
  parsePlainDate,
  toDateKey,
} from './src/dateHelpers.ts'
import {
  interpretDeadlinePhrase,
  summarizeDeadlineInterpretation,
} from './src/deadlinePhrase.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert(parsed, `Invalid test date: ${value}`)
  return parsed
}

// Basic business-day phrase.
{
  const result = interpretDeadlinePhrase(
    '5 business days after 2026-08-10',
  )

  assert(result)
  assert.equal(result.duration, 5)
  assert.equal(result.unit, 'business-days')
  assert.equal(result.direction, 'after')
  assert.equal(toDateKey(result.answer.answerDate), '2026-08-17')
}

// Working days is treated as business days.
{
  const result = interpretDeadlinePhrase(
    '5 working days after 2026-08-10',
  )

  assert(result)
  assert.equal(result.unit, 'business-days')
  assert.equal(toDateKey(result.answer.answerDate), '2026-08-17')
}

// Calendar-day phrase.
{
  const result = interpretDeadlinePhrase(
    '3 calendar days before 2026-08-10',
  )

  assert(result)
  assert.equal(result.unit, 'calendar-days')
  assert.equal(result.direction, 'before')
  assert.equal(toDateKey(result.answer.answerDate), '2026-08-07')
}

// "from" means forward in v1.
{
  const result = interpretDeadlinePhrase(
    '2 days from 2026-08-08',
  )

  assert(result)
  assert.equal(result.direction, 'after')
  assert.equal(toDateKey(result.answer.answerDate), '2026-08-10')
}

// "within" is supported but explicitly flagged as ambiguous wording.
{
  const result = interpretDeadlinePhrase(
    'within 5 business days after 2026-08-10',
  )

  assert(result)
  assert(
    result.ambiguities.includes('within-wording'),
    'Expected "within" wording to be flagged',
  )
}

// "today" requires an explicit caller-supplied reference date.
{
  const withoutToday = interpretDeadlinePhrase(
    '5 business days from today',
  )
  assert.equal(withoutToday, null)

  const withToday = interpretDeadlinePhrase(
    '5 business days from today',
    {
      today: date('2026-08-10'),
    },
  )

  assert(withToday)
  assert.equal(toDateKey(withToday.answer.answerDate), '2026-08-17')
  assert(withToday.ambiguities.includes('today-reference'))
}

// Selected holiday calendar changes the result and is no longer defaulted.
{
  const result = interpretDeadlinePhrase(
    '1 business day after 2026-12-31',
    {
      holidayCalendar: 'us',
    },
  )

  assert(result)
  assert.equal(toDateKey(result.answer.answerDate), '2027-01-04')
  assert(
    !result.ambiguities.includes('holiday-calendar-defaulted'),
    'Explicit calendar should not be marked as defaulted',
  )
}

// Explicit start-day convention can change the result.
{
  const result = interpretDeadlinePhrase(
    '5 business days after 2026-08-10',
    {
      startDayConvention: 'include-if-qualifying',
    },
  )

  assert(result)
  assert.equal(toDateKey(result.answer.answerDate), '2026-08-14')
}

// End-day adjustment can move a calendar-day result off a weekend.
{
  const result = interpretDeadlinePhrase(
    '1 day after 2026-08-14',
    {
      endDayAdjustment: 'next-business-day',
    },
  )

  assert(result)
  assert.equal(toDateKey(result.answer.answerDate), '2026-08-17')
}

// Summary stays machine-friendly and explicit.
{
  const result = interpretDeadlinePhrase(
    '5 business days after 2026-08-10',
  )

  assert(result)

  const summary = summarizeDeadlineInterpretation(result)
  assert.deepEqual(summary, {
    trigger: '2026-08-10',
    direction: 'after',
    duration: 5,
    unit: 'business days',
    result: '2026-08-17',
    assumptions: {
      startDayConvention: 'exclude-trigger',
      holidayCalendar: 'none',
      endDayAdjustment: 'none',
    },
    ambiguities: [
      'holiday-calendar-defaulted',
      'start-day-rule-defaulted',
      'end-day-adjustment-defaulted',
    ],
  })
}

// Unsupported wording stays safely unsupported.
{
  assert.equal(
    interpretDeadlinePhrase('respond sometime next week'),
    null,
  )
}

console.log('✓ Deterministic deadline phrase interpreter v1 passed')
