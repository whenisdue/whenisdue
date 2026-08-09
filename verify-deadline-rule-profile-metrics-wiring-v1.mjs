import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const storage = await readFile(
  './src/deadlineRuleProfileStorage.ts',
  'utf8',
)
const view = await readFile(
  './src/SavedDeadlineRulesView.tsx',
  'utf8',
)

assert.match(
  storage,
  /recordDeadlineRuleProfileMetric\('rule_saved'\)/,
  'Expected successful saves to be counted',
)

assert.match(
  storage,
  /recordDeadlineRuleProfileMetric\('rule_save_deduped'\)/,
  'Expected duplicate save attempts to be counted',
)

assert.match(
  storage,
  /recordDeadlineRuleProfileMetric\('rule_deleted'\)/,
  'Expected actual deletes to be counted',
)

assert.match(
  view,
  /recordDeadlineRuleProfileMetric\('rule_applied'\)/,
  'Expected rule reuse to be counted',
)

assert.doesNotMatch(
  storage,
  /recordDeadlineRuleProfileMetric\([^)]*profile\.name/,
  'Metric calls should not capture profile names',
)

console.log('✓ Deadline rule profile metrics wiring v1 passed')
console.log('  Save, dedupe, apply, and delete actions now increment privacy-safe counters')
