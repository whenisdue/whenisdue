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
}

function expectTriggerMissing(phrase, expectedKind) {
  const result = interpretDeadlinePhrase(phrase)

  assert(result, `Expected trigger-aware interpretation for: ${phrase}`)
  assert.equal(result.classification, 'underspecified', phrase)
  assert.equal(result.answer, null, phrase)
  assert.equal(result.triggerEvent?.kind, expectedKind, phrase)
  assert(result.missing.includes('trigger-date'), phrase)
}

// Existing calibration behavior remains intact.
expectResolved('5 business days after 2026-08-10', '2026-08-17')
expectResolved('within 5 business days after 2026-08-10', '2026-08-17')
expectResolved('5 business days before 2026-08-10', '2026-08-03')
expectAmbiguous('5 business days from 2026-08-10', '2026-08-17')
expectAmbiguous('within 5 business days of 2026-08-10', '2026-08-17')
expectAmbiguous(
  '5 business days from today',
  '2026-08-17',
  { today: date('2026-08-10') },
)

// Trigger-aware underspecified phrases.
expectTriggerMissing('30 days after receipt', 'received')
expectTriggerMissing('30 days after invoice receipt', 'received')
expectTriggerMissing('5 business days after delivery', 'delivered')
expectTriggerMissing('10 days after acceptance', 'accepted')
expectTriggerMissing('3 business days after filing', 'filed')
expectTriggerMissing('14 days after service', 'served')
expectTriggerMissing('7 days after sent', 'sent')
expectTriggerMissing('2 days after issuance', 'issued')

// Unknown event wording remains unsupported instead of guessed.
assert.equal(interpretDeadlinePhrase('30 days after invoice date'), null)
assert.equal(interpretDeadlinePhrase('5 days after order date'), null)
assert.equal(interpretDeadlinePhrase('5 days after approval'), null)

// Missing event date remains explicit.
{
  const result = interpretDeadlinePhrase('30 days after invoice receipt')
  assert(result)
  assert.equal(result.triggerDate, null)
  assert.equal(result.triggerEventText, 'invoice receipt')
  assert.deepEqual(result.missing, ['trigger-date'])
}

console.log('✓ Deadline phrase trigger-aware corpus v1 passed')
console.log('  Trigger events recognized while missing dates remain underspecified')
