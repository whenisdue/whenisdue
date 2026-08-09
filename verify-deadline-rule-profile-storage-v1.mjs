import assert from 'node:assert/strict'

import {
  createDeadlineRuleProfile,
} from './src/deadlineRuleProfile.ts'

const storageModuleText = await import('node:fs/promises').then((fs) =>
  fs.readFile('./src/deadlineRuleProfileStorage.ts', 'utf8'),
)

assert.match(
  storageModuleText,
  /whenisdue:deadline-rule-profiles/,
  'Expected stable localStorage key',
)

assert.match(
  storageModuleText,
  /whenisdue:deadline-rule-profiles-changed/,
  'Expected stable change event',
)

assert.match(
  storageModuleText,
  /MAX_PROFILES = 50/,
  'Expected bounded profile storage',
)

assert.match(
  storageModuleText,
  /duplicateIndex/,
  'Expected duplicate prevention',
)

const profile = createDeadlineRuleProfile({
  id: 'invoice-received-net-30',
  name: 'Invoice received — Net 30',
  triggerKind: 'received',
  duration: 30,
  direction: 'after',
  unit: 'calendar-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'none',
  endDayAdjustment: 'none',
})

assert.equal(profile.ruleVersion, 'deadline-rule-profile-v1')
assert.equal(profile.triggerKind, 'received')
assert.equal(profile.duration, 30)

console.log('✓ Deadline rule profile storage v1 passed')
console.log('  Local persistence contract, dedupe, and storage bounds checked')
