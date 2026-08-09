import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  './src/deadlineRuleProfileMetrics.ts',
  'utf8',
)

assert.match(
  source,
  /whenisdue:deadline-rule-profile-metrics/,
  'Expected stable metrics storage key',
)

assert.match(
  source,
  /rule_saved/,
  'Expected rule_saved metric',
)

assert.match(
  source,
  /rule_save_deduped/,
  'Expected rule_save_deduped metric',
)

assert.match(
  source,
  /rule_applied/,
  'Expected rule_applied metric',
)

assert.match(
  source,
  /rule_deleted/,
  'Expected rule_deleted metric',
)

assert.doesNotMatch(
  source,
  /profile\.name|originalText|triggerEventText|note|email/i,
  'Metrics module should not capture rule names or user-entered text',
)

console.log('✓ Deadline rule profile metrics v1 passed')
console.log('  Save, dedupe, apply, and delete counters defined without storing rule text')
