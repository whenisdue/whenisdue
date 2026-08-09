import assert from 'node:assert/strict'

import { parsePlainDate } from './src/dateHelpers.ts'
import {
  createDeadlineTrigger,
  parseDeadlineTriggerEvent,
  summarizeDeadlineTrigger,
} from './src/deadlineTrigger.ts'

function expectKind(input, expectedKind) {
  const result = parseDeadlineTriggerEvent(input)
  assert(result, `Expected trigger event for: ${input}`)
  assert.equal(result.kind, expectedKind, input)
}

// Canonical wording.
expectKind('issued', 'issued')
expectKind('sent', 'sent')
expectKind('received', 'received')
expectKind('delivered', 'delivered')
expectKind('accepted', 'accepted')
expectKind('filed', 'filed')
expectKind('served', 'served')

// Common noun / verb variants.
expectKind('issuance', 'issued')
expectKind('sending', 'sent')
expectKind('receipt', 'received')
expectKind('delivery', 'delivered')
expectKind('acceptance', 'accepted')
expectKind('filing', 'filed')
expectKind('service', 'served')

// Normalization.
expectKind('Received.', 'received')
expectKind(' DELIVERY ', 'delivered')

// Conservative non-inference: generic dates do not silently become events.
assert.equal(parseDeadlineTriggerEvent('invoice date'), null)
assert.equal(parseDeadlineTriggerEvent('order date'), null)
assert.equal(parseDeadlineTriggerEvent('start date'), null)
assert.equal(parseDeadlineTriggerEvent('payment date'), null)

// Reproducible trigger receipt.
{
  const date = parsePlainDate('2026-08-10')
  assert(date)

  const trigger = createDeadlineTrigger({
    kind: 'received',
    date,
    source: 'user-selected',
    originalText: 'invoice received',
  })

  assert.deepEqual(summarizeDeadlineTrigger(trigger), {
    event: 'received',
    label: 'Received',
    date: '2026-08-10',
    source: 'user-selected',
    originalText: 'invoice received',
    ruleVersion: 'deadline-trigger-v1',
  })
}

console.log('✓ Deadline trigger semantics v1 passed')
console.log('  Explicit trigger events normalized without guessing generic date meaning')
