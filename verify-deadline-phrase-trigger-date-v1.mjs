import assert from 'node:assert/strict'

import { parsePlainDate, toDateKey } from './src/dateHelpers.ts'
import { interpretDeadlinePhrase } from './src/deadlinePhrase.ts'

function date(value) {
  const parsed = parsePlainDate(value)
  assert(parsed, `Invalid test date: ${value}`)
  return parsed
}

function expectResolvedTrigger(phrase, eventKind, expectedDate, options = {}) {
  const result = interpretDeadlinePhrase(phrase, options)

  assert(result, `Expected interpretation for: ${phrase}`)
  assert.equal(result.classification, 'resolved', phrase)
  assert.equal(result.triggerEvent?.kind, eventKind, phrase)
  assert(result.triggerDate, `Expected trigger date for: ${phrase}`)
  assert(result.answer, `Expected answer for: ${phrase}`)
  assert.equal(toDateKey(result.answer.answerDate), expectedDate, phrase)
}

expectResolvedTrigger(
  '30 days after invoice receipt on 2026-08-10',
  'received',
  '2026-09-09',
)

expectResolvedTrigger(
  '5 business days after delivery on 2026-08-10',
  'delivered',
  '2026-08-17',
)

expectResolvedTrigger(
  '10 days after acceptance on 2026-08-10',
  'accepted',
  '2026-08-20',
)

expectResolvedTrigger(
  '3 business days before filing on 2026-08-10',
  'filed',
  '2026-08-05',
)

expectResolvedTrigger(
  '7 days after service at 2026-08-10',
  'served',
  '2026-08-17',
)

expectResolvedTrigger(
  '5 business days after delivery on today',
  'delivered',
  '2026-08-17',
  { today: date('2026-08-10') },
)

{
  const result = interpretDeadlinePhrase('30 days after invoice receipt')
  assert(result)
  assert.equal(result.classification, 'underspecified')
  assert.equal(result.triggerEvent?.kind, 'received')
  assert.equal(result.triggerDate, null)
  assert.equal(result.answer, null)
}

assert.equal(
  interpretDeadlinePhrase('30 days after invoice date on 2026-08-10'),
  null,
)

console.log('✓ Deadline trigger-date resolution v1 passed')
console.log('  Recognized trigger events can resolve when their date is supplied')
