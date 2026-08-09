import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const profile = await readFile('./src/deadlineRuleProfile.ts', 'utf8')
const metrics = await readFile('./src/deadlineRuleProfileMetrics.ts', 'utf8')
const experiment = await readFile('./src/deadlineRuleProfileExperiment.ts', 'utf8')
const button = await readFile('./src/SaveDeadlineRuleButton.tsx', 'utf8')
const storage = await readFile('./src/deadlineRuleProfileStorage.ts', 'utf8')

assert.match(profile, /workingScheduleId/)
assert.match(profile, /standard_mon_fri/)
assert.match(profile, /schemaVersion:\s*2/)

assert.match(metrics, /rule_reused_later_with_new_date/)
assert.match(experiment, /savedTriggerFingerprint/)
assert.match(experiment, /savedSessionId/)
assert.doesNotMatch(experiment, /triggerDateKey:\s*string[\s\S]*localStorage\.setItem\([^)]*triggerDateKey/)
assert.match(button, /Save deadline setup/)
assert.match(button, /Saved on this device\./)
assert.doesNotMatch(button, /reusable-rules view next/)
assert.match(storage, /workingScheduleId/)
assert.match(storage, /item\.name\.toLowerCase\(\) === profile\.name\.toLowerCase\(\)/)

console.log('✓ Saved deadline setup validation-ready v1 passed')
console.log('  Copy, persistence metadata, migration, and later-new-date reuse signal checked')
