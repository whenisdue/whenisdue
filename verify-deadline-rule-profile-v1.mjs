import assert from 'node:assert/strict'

import {
  createDeadlineRuleProfile,
  describeDeadlineRuleProfile,
  summarizeDeadlineRuleProfile,
} from './src/deadlineRuleProfile.ts'

const profile = createDeadlineRuleProfile({
  id: 'invoice-received-net-30',
  name: ' Invoice received — Net 30 ',
  triggerKind: 'received',
  duration: 30,
  direction: 'after',
  unit: 'calendar-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'none',
  endDayAdjustment: 'none',
})

assert.deepEqual(summarizeDeadlineRuleProfile(profile), {
  id: 'invoice-received-net-30',
  name: 'Invoice received — Net 30',
  triggerKind: 'received',
  duration: 30,
  direction: 'after',
  unit: 'calendar-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'none',
  endDayAdjustment: 'none',
  ruleVersion: 'deadline-rule-profile-v1',
})

assert.equal(
  describeDeadlineRuleProfile(profile),
  '30 calendar days after received',
)

const businessProfile = createDeadlineRuleProfile({
  id: 'client-delivery-five-days',
  name: 'Client delivery follow-up',
  triggerKind: 'delivered',
  duration: 5,
  direction: 'after',
  unit: 'business-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'us',
  endDayAdjustment: 'none',
})

assert.equal(
  describeDeadlineRuleProfile(businessProfile),
  '5 business days after delivered',
)

// No trigger event is valid for generic reusable rules.
const genericProfile = createDeadlineRuleProfile({
  id: 'generic-ten-business-days',
  name: '10 business days',
  triggerKind: null,
  duration: 10,
  direction: 'after',
  unit: 'business-days',
  startDayConvention: 'exclude-trigger',
  holidayCalendar: 'none',
  endDayAdjustment: 'none',
})

assert.equal(
  describeDeadlineRuleProfile(genericProfile),
  '10 business days after start date',
)

// Validation stays strict.
assert.throws(
  () =>
    createDeadlineRuleProfile({
      id: 'bad-duration',
      name: 'Bad duration',
      triggerKind: null,
      duration: 2.5,
      direction: 'after',
      unit: 'calendar-days',
      startDayConvention: 'exclude-trigger',
      holidayCalendar: 'none',
      endDayAdjustment: 'none',
    }),
  /non-negative integer/,
)

assert.throws(
  () =>
    createDeadlineRuleProfile({
      id: 'blank-name',
      name: '   ',
      triggerKind: null,
      duration: 5,
      direction: 'after',
      unit: 'business-days',
      startDayConvention: 'exclude-trigger',
      holidayCalendar: 'none',
      endDayAdjustment: 'none',
    }),
  /name is required/,
)

console.log('✓ Deadline rule profile foundation v1 passed')
console.log('  Reusable rule profiles validated without adding persistence or UI yet')
